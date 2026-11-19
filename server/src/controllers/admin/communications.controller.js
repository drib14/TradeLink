const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const AppError = require('../../utils/AppError');
const asyncHandler = require('../../utils/asyncHandler');
const emailService = require('../../services/email.service');
const { logAdminAction } = require('./verification.controller');

function parseDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const date = new Date(value + 'T00:00:00.000Z');
  return Number.isNaN(date.getTime()) || formatDate(date) !== String(value) ? null : date;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getCampusDate() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

function shiftDays(date, amount) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + amount);
  return copy;
}

const getVisitAnalytics = asyncHandler(async (req, res) => {
  const selectedDate = parseDate(req.query.date) || parseDate(getCampusDate());
  const period = ['day', 'week', 'month', 'year'].includes(req.query.period) ? req.query.period : 'month';
  const monthStart = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(selectedDate.getUTCFullYear(), selectedDate.getUTCMonth() + 1, 0));
  let rangeStart = selectedDate;
  let rangeEnd = selectedDate;

  if (period === 'week') {
    const mondayOffset = (selectedDate.getUTCDay() + 6) % 7;
    rangeStart = shiftDays(selectedDate, -mondayOffset);
    rangeEnd = shiftDays(rangeStart, 6);
  } else if (period === 'month') {
    rangeStart = monthStart;
    rangeEnd = monthEnd;
  } else if (period === 'year') {
    rangeStart = new Date(Date.UTC(selectedDate.getUTCFullYear(), 0, 1));
    rangeEnd = new Date(Date.UTC(selectedDate.getUTCFullYear(), 11, 31));
  }

  const [calendarRows, summaryRow, selectedDayRow] = await Promise.all([
    db('site_visits')
      .select('visit_date')
      .count('* as visitors')
      .whereBetween('visit_date', [formatDate(monthStart), formatDate(monthEnd)])
      .groupBy('visit_date')
      .orderBy('visit_date', 'asc'),
    db('site_visits')
      .whereBetween('visit_date', [formatDate(rangeStart), formatDate(rangeEnd)])
      .countDistinct({ visitors: 'visitor_hash' })
      .first(),
    db('site_visits')
      .where({ visit_date: formatDate(selectedDate) })
      .count('* as visitors')
      .first()
  ]);

  const daily = calendarRows.map((row) => ({
    date: typeof row.visit_date === 'string' ? row.visit_date.slice(0, 10) : formatDate(new Date(row.visit_date)),
    visitors: Number(row.visitors) || 0
  }));

  res.status(200).json({
    status: 'success',
    data: {
      period,
      date: formatDate(selectedDate),
      range: { start: formatDate(rangeStart), end: formatDate(rangeEnd) },
      totalVisitors: Number(summaryRow?.visitors) || 0,
      selectedDayVisitors: Number(selectedDayRow?.visitors) || 0,
      daily
    }
  });
});

function audienceQuery(audience, campus) {
  const query = db('users')
    .select('id', 'name', 'email')
    .where('role', 'student')
    .whereNotNull('email')
    .whereNot('email', '')
    .andWhere((builder) => builder.whereNull('is_banned').orWhere('is_banned', false));

  if (audience === 'campus') query.andWhere('campus', campus);
  if (audience === 'verified') query.andWhere('is_verified', true);
  if (audience === 'unverified') query.andWhere((builder) => builder.whereNull('is_verified').orWhere('is_verified', false));
  return query;
}

const getEmailAudience = asyncHandler(async (req, res) => {
  const audience = ['all', 'campus', 'verified', 'unverified'].includes(req.query.audience) ? req.query.audience : 'all';
  const campus = String(req.query.campus || '').trim();
  if (audience === 'campus' && !campus) return res.status(200).json({ status: 'success', data: { count: 0 } });
  const row = await audienceQuery(audience, campus).clearSelect().count({ count: '*' }).first();
  res.status(200).json({ status: 'success', data: { count: Number(row?.count) || 0 } });
});

const getEmailCampaigns = asyncHandler(async (_req, res) => {
  const campaigns = await db('email_campaigns')
    .leftJoin('users', 'email_campaigns.created_by', 'users.id')
    .select('email_campaigns.*', 'users.name as admin_name')
    .orderBy('email_campaigns.created_at', 'desc')
    .limit(30);
  res.status(200).json({
    status: 'success',
    data: {
      campaigns: campaigns.map((campaign) => ({
        id: campaign.id,
        title: campaign.title,
        subject: campaign.subject,
        audience: campaign.audience,
        campus: campaign.campus,
        totalRecipients: Number(campaign.total_recipients) || 0,
        sentCount: Number(campaign.sent_count) || 0,
        failedCount: Number(campaign.failed_count) || 0,
        status: campaign.status,
        createdAt: campaign.created_at,
        completedAt: campaign.completed_at,
        adminName: campaign.admin_name || 'TradeLink Admin'
      }))
    }
  });
});

const createEmailCampaign = asyncHandler(async (req, res, next) => {
  const title = String(req.body.title || '').replaceAll(String.fromCharCode(10), ' ').replaceAll(String.fromCharCode(13), ' ').trim();
  const subject = String(req.body.subject || '').replaceAll(String.fromCharCode(10), ' ').replaceAll(String.fromCharCode(13), ' ').trim();
  const message = String(req.body.message || '').trim();
  const audience = ['all', 'campus', 'verified', 'unverified'].includes(req.body.audience) ? req.body.audience : 'all';
  const campus = String(req.body.campus || '').trim();

  if (title.length < 3 || title.length > 160) return next(new AppError('Title must be between 3 and 160 characters.', 400));
  if (subject.length < 3 || subject.length > 200) return next(new AppError('Subject must be between 3 and 200 characters.', 400));
  if (message.length < 10 || message.length > 5000) return next(new AppError('Message must be between 10 and 5,000 characters.', 400));
  if (audience === 'campus' && !campus) return next(new AppError('Choose a campus for this audience.', 400));

  const recipients = await audienceQuery(audience, campus);
  if (!recipients.length) return next(new AppError('No eligible student email addresses were found for this audience.', 404));

  const campaignId = uuidv4();
  await db.transaction(async (trx) => {
    await trx('email_campaigns').insert({
      id: campaignId,
      title,
      subject,
      message,
      audience,
      campus: audience === 'campus' ? campus : null,
      total_recipients: recipients.length,
      created_by: req.user.id,
      status: 'sending'
    });

    for (let offset = 0; offset < recipients.length; offset += 200) {
      const rows = recipients.slice(offset, offset + 200).map((user) => ({
        id: uuidv4(),
        campaign_id: campaignId,
        user_id: user.id,
        email: user.email,
        recipient_name: user.name || 'Student',
        status: 'queued'
      }));
      await trx('email_campaign_recipients').insert(rows);
    }
  });

  await logAdminAction(req.user, 'Created Email Campaign', 'email_campaign', campaignId, `Queued ${recipients.length} student emails for "${title}"`, req);
  res.status(201).json({
    status: 'success',
    message: 'Email campaign queued. Delivery can continue in small batches and resume if interrupted.',
    data: { campaignId, totalRecipients: recipients.length, status: 'sending' }
  });
});

const processEmailCampaignBatch = asyncHandler(async (req, res, next) => {
  const campaign = await db('email_campaigns').where({ id: req.params.id }).first();
  if (!campaign) return next(new AppError('Email campaign not found.', 404));

  // Recover jobs abandoned by a crashed serverless invocation.
  await db('email_campaign_recipients')
    .where({ campaign_id: campaign.id, status: 'processing' })
    .andWhere('processing_at', '<', db.raw('DATE_SUB(NOW(), INTERVAL 15 MINUTE)'))
    .update({ status: 'queued', processing_at: null });

  const batch = await db.transaction(async (trx) => {
    const rows = await trx('email_campaign_recipients')
      .where({ campaign_id: campaign.id, status: 'queued' })
      .orderBy('created_at', 'asc')
      .limit(10)
      .forUpdate();
    if (rows.length) {
      await trx('email_campaign_recipients')
        .whereIn('id', rows.map((row) => row.id))
        .update({ status: 'processing', processing_at: trx.fn.now() });
    }
    return rows;
  });

  const outcomes = await Promise.all(batch.map(async (recipient) => {
    try {
      const result = await emailService.sendTransactionalNotification({
        toEmail: recipient.email,
        greeting: recipient.recipient_name || 'Student',
        subject: `[TradeLink] ${campaign.subject}`,
        headline: campaign.title,
        message: campaign.message,
        ctaLabel: 'Explore TradeLink',
        req
      });
      if (!result || result.ok === false || result.skipped) throw new Error(result?.error || 'Email provider did not confirm delivery.');
      await db('email_campaign_recipients').where({ id: recipient.id }).update({
        status: 'sent', sent_at: db.fn.now(), processing_at: null, error_message: null
      });
      await db('email_campaigns').where({ id: campaign.id }).increment('sent_count', 1);
      return { sent: true };
    } catch (error) {
      await db('email_campaign_recipients').where({ id: recipient.id }).update({
        status: 'failed', processing_at: null, error_message: String(error.message || 'Delivery failed').slice(0, 500)
      });
      await db('email_campaigns').where({ id: campaign.id }).increment('failed_count', 1);
      return { sent: false };
    }
  }));

  const remaining = await db('email_campaign_recipients')
    .where({ campaign_id: campaign.id, status: 'queued' })
    .count({ count: '*' }).first();
  const processing = await db('email_campaign_recipients')
    .where({ campaign_id: campaign.id, status: 'processing' })
    .count({ count: '*' }).first();
  let updated = await db('email_campaigns').where({ id: campaign.id }).first();

  if (Number(remaining?.count) === 0 && Number(processing?.count) === 0) {
    const status = Number(updated.failed_count) === 0 ? 'sent' : (Number(updated.sent_count) > 0 ? 'partial' : 'failed');
    await db('email_campaigns').where({ id: campaign.id }).update({ status, completed_at: db.fn.now() });
    updated = await db('email_campaigns').where({ id: campaign.id }).first();
  }

  res.status(200).json({
    status: 'success',
    data: {
      campaignId: campaign.id,
      processed: outcomes.length,
      sentInBatch: outcomes.filter((item) => item.sent).length,
      failedInBatch: outcomes.filter((item) => !item.sent).length,
      sentCount: Number(updated.sent_count) || 0,
      failedCount: Number(updated.failed_count) || 0,
      totalRecipients: Number(updated.total_recipients) || 0,
      remaining: Number(remaining?.count) || 0,
      status: updated.status
    }
  });
});

module.exports = { getVisitAnalytics, getEmailAudience, getEmailCampaigns, createEmailCampaign, processEmailCampaignBatch };
