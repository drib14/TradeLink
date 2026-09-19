const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

// Initialize Gmail SMTP transporter (only outside test suite)
if (env.env !== 'test' && env.email.user && env.email.pass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    host: env.email.host || 'smtp.gmail.com',
    port: env.email.port || 465,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.pass
    }
  });
}

/**
 * TradeLink logo SVG for email templates (inline, self-contained)
 */
const TRADELINK_LOGO_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="180" height="44" viewBox="0 0 180 44" fill="none">
  <rect width="38" height="38" rx="10" x="0" y="3" fill="#002B7F"/>
  <path d="M11 14h16M19 14v14" stroke="#FFC72C" stroke-width="3" stroke-linecap="round"/>
  <path d="M13 22l6 6 6-6" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="46" y="20" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#002B7F" letter-spacing="-0.5">Trade</text>
  <text x="100" y="20" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="900" fill="#FFC72C" letter-spacing="-0.5">Link</text>
  <text x="46" y="34" font-family="Arial, Helvetica, sans-serif" font-size="9.5" font-weight="600" fill="#64748B" letter-spacing="0.5">Student Marketplace</text>
</svg>
`;

/**
 * Resolves the student web application base URL.
 * In production: Strictly rejects localhost/127.0.0.1 and resolves to live deployment origin.
 * 1. Request origin or referer (if valid live host)
 * 2. APP_URL environment variable
 * 3. Non-localhost entry in CLIENT_URL
 * 4. Production fallback: https://tradelink-uc.vercel.app
 * @param {import('express').Request} [req]
 * @returns {string} Fully qualified web app base URL without trailing slash
 */
function getAppBaseUrl(req = null) {
  const isProduction = env.isProduction || process.env.NODE_ENV === 'production';

  // 1. Check req headers if provided
  if (req && typeof req.get === 'function') {
    const rawOrigin = req.get('origin') || req.get('referer');
    if (rawOrigin) {
      try {
        const parsed = new URL(rawOrigin);
        const hostUrl = `${parsed.protocol}//${parsed.host}`;
        if (isProduction) {
          if (!parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
            if (!parsed.host.includes('admin') && !parsed.host.includes(':5174')) {
              return hostUrl;
            }
          }
        } else {
          return hostUrl;
        }
      } catch (_) {}
    }
  }

  // 2. Explicit APP_URL from env
  if (process.env.APP_URL && process.env.APP_URL.trim()) {
    const candidate = process.env.APP_URL.trim().replace(/\/+$/, '');
    if (!isProduction || (!candidate.includes('localhost') && !candidate.includes('127.0.0.1'))) {
      return candidate;
    }
  }

  // 3. CLIENT_URL from env (comma-separated list)
  if (env.clientUrl && env.clientUrl.trim()) {
    const origins = env.clientUrl.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
    const validOrigins = isProduction
      ? origins.filter((o) => !o.includes('localhost') && !o.includes('127.0.0.1'))
      : origins;
    const studentOrigin = validOrigins.find((o) => !o.includes(':3000') && !o.includes(':5174') && !o.includes('admin')) || validOrigins[0];
    if (studentOrigin) {
      return studentOrigin;
    }
  }

  // 4. Safe production fallback
  if (isProduction) {
    return 'https://tradelink-uc.vercel.app';
  }

  return 'http://localhost:5173';
}

/**
 * Resolves the administration portal base URL.
 * In production: Strictly rejects localhost/127.0.0.1 and resolves to live deployment origin.
 * @param {import('express').Request} [req]
 * @returns {string} Fully qualified admin portal base URL without trailing slash
 */
function getAdminBaseUrl(req = null) {
  const isProduction = env.isProduction || process.env.NODE_ENV === 'production';

  // 1. Check req headers if provided
  if (req && typeof req.get === 'function') {
    const rawOrigin = req.get('origin') || req.get('referer');
    if (rawOrigin) {
      try {
        const parsed = new URL(rawOrigin);
        const hostUrl = `${parsed.protocol}//${parsed.host}`;
        if (isProduction) {
          if (!parsed.hostname.includes('localhost') && !parsed.hostname.includes('127.0.0.1')) {
            return hostUrl;
          }
        } else {
          return hostUrl;
        }
      } catch (_) {}
    }
  }

  // 2. Explicit ADMIN_APP_URL or ADMIN_URL from env
  if (process.env.ADMIN_APP_URL && process.env.ADMIN_APP_URL.trim()) {
    const candidate = process.env.ADMIN_APP_URL.trim().replace(/\/+$/, '');
    if (!isProduction || (!candidate.includes('localhost') && !candidate.includes('127.0.0.1'))) {
      return candidate;
    }
  }

  if (env.adminUrl && env.adminUrl.trim()) {
    const origins = env.adminUrl.split(',').map((s) => s.trim().replace(/\/+$/, '')).filter(Boolean);
    const validOrigins = isProduction
      ? origins.filter((o) => !o.includes('localhost') && !o.includes('127.0.0.1'))
      : origins;
    if (validOrigins.length > 0) {
      return validOrigins[0];
    }
  }

  if (isProduction) {
    return 'https://tradelink-admin.vercel.app';
  }

  return 'http://localhost:5174';
}

/**
 * Formats user-friendly payment method label
 */
function formatPaymentMethodLabel(method) {
  switch (String(method).toLowerCase()) {
    case 'gcash':
      return 'GCash (e-Wallet)';
    case 'maya':
      return 'Maya (e-Wallet)';
    case 'cash':
    case 'cod':
      return 'Cash on Meetup / Handover';
    case 'free':
      return 'Free Student Donation (₱0.00)';
    default:
      return method ? String(method).toUpperCase() : 'Cash on Meetup';
  }
}

/**
 * Shared branded email layout wrapper
 * All emails use this to ensure consistent TradeLink branding
 * @param {string} bodyContent - The inner HTML content
 * @param {string} [preheader] - Optional preheader text
 * @param {string} [portalUrl] - Optional base URL for footer link
 * @returns {string} Complete branded HTML email
 */
function buildEmailLayout(bodyContent, preheader = '', portalUrl = '') {
  const displayUrl = portalUrl || getAppBaseUrl();

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>TradeLink UC</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F1F5F9; font-family: Arial, Helvetica, sans-serif;">
      ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #F1F5F9;">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 540px; background-color: #FFFFFF; border-radius: 16px; border: 1px solid #E2E8F0; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 43, 127, 0.06);">
              <!-- Logo Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #002B7F 0%, #0A1931 100%); padding: 22px 24px; text-align: center;">
                  <div style="display: inline-block;">
                    ${TRADELINK_LOGO_SVG}
                  </div>
                </td>
              </tr>
              <!-- Gold accent line -->
              <tr>
                <td style="height: 3px; background: linear-gradient(90deg, #FFC72C 0%, #FFD54F 50%, #FFC72C 100%);"></td>
              </tr>
              <!-- Body Content -->
              <tr>
                <td style="padding: 28px 24px;">
                  ${bodyContent}
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 0 24px 22px 24px;">
                  <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 0 0 16px 0;" />
                  <p style="font-size: 11px; color: #94A3B8; text-align: center; margin: 0; line-height: 1.6;">
                    University of Cebu TradeLink · Safe &amp; Verified Campus Marketplace<br/>
                    <a href="${displayUrl}" style="color: #002B7F; text-decoration: none; font-weight: bold;">${displayUrl}</a><br/>
                    <span style="color: #CBD5E1;">This is an automated notification from TradeLink UC. Please do not reply.</span>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Sends a password reset email with verification code directly to the student
 */
async function sendPasswordResetDirectEmail(toEmail, code, userName = 'Student', req = null) {
  const appUrl = getAppBaseUrl(req);
  const subject = `[TradeLink UC] Password Reset Verification Code: ${code}`;
  const text = `Hello ${userName},\n\nA password reset was requested for your TradeLink student account.\n\nYour verification code is: ${code}\n\nThis code will expire in 30 minutes.\n\nAccess TradeLink to reset your password:\n${appUrl}\n\nIf you did not request this, you can safely ignore this email.\n\nBest regards,\nUniversity of Cebu TradeLink Team`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="display: inline-block; background-color: #EBF1FC; color: #002B7F; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 12px;">
        Password Reset Code
      </span>
    </div>
    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${userName}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      A password reset was requested for your TradeLink student account. Use the verification code below to set your new password:
    </p>
    <div style="background-color: #F8FAFC; border: 2px dashed #002B7F; font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; padding: 18px; border-radius: 12px; color: #002B7F; margin: 0 0 20px 0;">
      ${code}
    </div>
    <div style="text-align: center; margin: 24px 0 20px 0;">
      <a href="${appUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #002B7F 0%, #0A1931 100%); color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 43, 127, 0.25);">
        Open TradeLink UC
      </a>
    </div>
    <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 1.5;">
      <strong>Valid for 30 minutes.</strong> Click the button above or visit <a href="${appUrl}" style="color: #002B7F; font-weight: bold;">${appUrl}</a>, open the TradeLink sign-in dialog, enter this code along with your new password to complete resetting your password.
    </p>
  `;

  const html = buildEmailLayout(bodyContent, `Your verification code is ${code}`, appUrl);
  return sendMail(toEmail, subject, text, html);
}

/**
 * Sends a password reset email with the approved verification code (for students)
 */
async function sendPasswordResetApprovedEmail(toEmail, code, userName = 'Student', req = null) {
  const appUrl = getAppBaseUrl(req);
  const subject = `[TradeLink UC] Password Reset Approved - Verification Code: ${code}`;
  const text = `Hello ${userName},\n\nYour password reset request has been APPROVED by University of Cebu campus administration.\n\nYour TradeLink verification code is: ${code}\n\nThis code will expire in 30 minutes.\n\nOpen TradeLink and complete your reset:\n${appUrl}\n\nIf you did not request this, please contact campus administration immediately.\n\nBest regards,\nUniversity of Cebu TradeLink Administration Team`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="display: inline-block; background-color: #DEF7EC; color: #03543F; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 12px;">
        Password Reset Approved
      </span>
    </div>
    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${userName}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      Your password reset request has been verified and <strong>approved</strong> by campus administration. Use the verification code below to set your new password:
    </p>
    <div style="background-color: #F8FAFC; border: 2px dashed #002B7F; font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; padding: 18px; border-radius: 12px; color: #002B7F; margin: 0 0 20px 0;">
      ${code}
    </div>
    <div style="text-align: center; margin: 24px 0 20px 0;">
      <a href="${appUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #002B7F 0%, #0A1931 100%); color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 43, 127, 0.25);">
        Open TradeLink and Reset Password
      </a>
    </div>
    <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 1.5;">
      <strong>Valid for 30 minutes.</strong> Click the button above or visit <a href="${appUrl}" style="color: #002B7F; font-weight: bold;">${appUrl}</a>, open the TradeLink sign-in dialog, choose "Reset Password", and enter this code along with your new password.
    </p>
  `;

  const html = buildEmailLayout(bodyContent, `Your verification code is ${code}`, appUrl);
  return sendMail(toEmail, subject, text, html);
}

/**
 * Sends a notification email when a password reset request is refused/rejected by administration
 */
async function sendPasswordResetRejectedEmail(toEmail, userName = 'Student', reason = '', req = null) {
  const appUrl = getAppBaseUrl(req);
  const supportEmail = process.env.SUPPORT_EMAIL || 'support@tradelink.ph';
  const subject = `[TradeLink] Password Reset Request Status`;
  const text = `Hello ${userName},\n\nYour password reset request was reviewed by campus administration and was not approved.\n\nReason: ${reason || 'Identity verification could not be confirmed.'}\n\nVisit TradeLink: ${appUrl}\nIf you believe this is an error, please contact support at ${supportEmail}.\n\nBest regards,\nTradeLink Marketplace Team`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="display: inline-block; background-color: #FDE8E8; color: #9B1C1C; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 12px;">
        Notice: Request Not Approved
      </span>
    </div>
    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${userName}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
      Your password reset request was reviewed by campus administration and could not be approved at this time.
    </p>
    ${reason ? `<div style="background-color: #FFF5F5; border-left: 4px solid #E02424; padding: 12px 16px; border-radius: 4px; margin: 0 0 16px 0; color: #771D1D; font-size: 14px;"><strong>Admin Note:</strong> ${reason}</div>` : ''}
    <div style="text-align: center; margin: 20px 0;">
      <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #002B7F; color: #FFFFFF; font-size: 13px; font-weight: bold; text-decoration: none; padding: 10px 22px; border-radius: 8px;">
        Visit TradeLink
      </a>
    </div>
    <p style="font-size: 13px; color: #64748B; margin: 0; line-height: 1.5;">
      If you require assistance regaining access to your student account, please contact us at <a href="mailto:${supportEmail}" style="color: #002B7F; font-weight: bold;">${supportEmail}</a> with proof of enrollment.
    </p>
  `;

  const html = buildEmailLayout(bodyContent, '', appUrl);
  return sendMail(toEmail, subject, text, html);
}

/**
 * Sends a password reset code directly to an admin
 */
async function sendAdminPasswordResetEmail(toEmail, code, req = null) {
  const adminUrl = getAdminBaseUrl(req);
  const subject = `[TradeLink] Administrator Password Reset - Code: ${code}`;
  const text = `TradeLink Administration Portal\n\nYour administrator password reset verification code is: ${code}\n\nThis code will expire in 30 minutes.\n\nOpen Administration Portal:\n${adminUrl}\n\nIf you did not request this, your account may be compromised. Please secure your account immediately.\n\nTradeLink Administration`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="display: inline-block; background-color: #DBEAFE; color: #1E40AF; font-size: 12px; font-weight: bold; padding: 4px 12px; border-radius: 12px;">
        Administrator Password Reset
      </span>
    </div>
    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>Administrator</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 20px 0;">
      A password reset was requested for your TradeLink administrator account. Use the verification code below to set a new password:
    </p>
    <div style="background-color: #F0F4FF; border: 2px dashed #002B7F; font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; padding: 18px; border-radius: 12px; color: #002B7F; margin: 0 0 20px 0;">
      ${code}
    </div>
    <div style="text-align: center; margin: 24px 0 20px 0;">
      <a href="${adminUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #002B7F 0%, #0A1931 100%); color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 43, 127, 0.25);">
        Open Administration Portal
      </a>
    </div>
    <p style="font-size: 13px; color: #64748B; margin: 0 0 14px 0; line-height: 1.5;">
      <strong>Valid for 30 minutes.</strong> Click the button above or visit <a href="${adminUrl}" style="color: #002B7F; font-weight: bold;">${adminUrl}</a> and enter this code along with your new password.
    </p>
  `;

  const html = buildEmailLayout(bodyContent, `Your admin reset code is ${code}`, adminUrl);
  return sendMail(toEmail, subject, text, html);
}

/**
 * ----------------------------------------------------------------------------
 * TRANSACTION NOTIFICATION EMAILS (WITH DYNAMIC LIVE URLS)
 * ----------------------------------------------------------------------------
 */

/**
 * Sends order confirmation receipt to the buyer
 */
async function sendOrderPlacedBuyerEmail(buyer, seller, transaction, listing, req = null) {
  if (!buyer || !buyer.email) return;
  const appUrl = getAppBaseUrl(req);
  const refNo = transaction.reference_no || transaction.id;
  const ctaUrl = `${appUrl}/transactions?id=${encodeURIComponent(refNo)}`;
  const formattedAmount = transaction.trade_mode === 'free_donation'
    ? 'FREE / Donation'
    : transaction.trade_mode === 'swap'
    ? 'Barter / Item Swap'
    : `₱${parseFloat(transaction.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const subject = `[TradeLink] Order Confirmation #${refNo} — ${listing.title}`;
  const text = `Hello ${buyer.name},\n\nYour order #${refNo} for "${listing.title}" has been created!\nSeller: ${seller.name} (${listing.campus})\nTotal: ${formattedAmount}\nPayment Method: ${formatPaymentMethodLabel(transaction.payment_method)}\n\nView deal details and coordinate safe handover:\n${ctaUrl}\n\nTrade safely on campus,\nTradeLink Marketplace Team`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="display: inline-block; background-color: #DEF7EC; color: #03543F; font-size: 12px; font-weight: bold; padding: 4px 14px; border-radius: 12px;">
        Order Placed Successfully
      </span>
    </div>
    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${buyer.name}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
      Your order has been initiated on TradeLink! Please coordinate meeting time and a convenient campus spot (e.g. campus canteen, library entrance, or student lounge) with the seller.
    </p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 0 0 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #334155;" cellspacing="0" cellpadding="4">
        <tr>
          <td style="color: #64748B; width: 35%;">Reference No:</td>
          <td><strong style="color: #002B7F; font-family: monospace; font-size: 14px;">${refNo}</strong></td>
        </tr>
        <tr>
          <td style="color: #64748B;">Item:</td>
          <td><strong>${listing.title}</strong></td>
        </tr>
        <tr>
          <td style="color: #64748B;">Seller:</td>
          <td>${seller.name} (${listing.campus || 'UC Campus'})</td>
        </tr>
        <tr>
          <td style="color: #64748B;">Total Amount:</td>
          <td><strong style="color: #047857; font-size: 15px;">${formattedAmount}</strong></td>
        </tr>
        <tr>
          <td style="color: #64748B;">Settlement:</td>
          <td>${formatPaymentMethodLabel(transaction.payment_method)}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0 20px 0;">
      <a href="${ctaUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #002B7F 0%, #0A1931 100%); color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 43, 127, 0.25);">
        View Deal &amp; Coordinate Handover
      </a>
    </div>
    <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
      Button not working? Open this link directly:<br/>
      <a href="${ctaUrl}" style="color: #002B7F; word-break: break-all;">${ctaUrl}</a>
    </p>
  `;

  const html = buildEmailLayout(bodyContent, `Order #${refNo} placed for ${listing.title}`, appUrl);
  return sendMail(buyer.email, subject, text, html);
}

/**
 * Sends new order alert to the seller
 */
async function sendNewOrderSellerEmail(seller, buyer, transaction, listing, req = null) {
  if (!seller || !seller.email) return;
  const appUrl = getAppBaseUrl(req);
  const refNo = transaction.reference_no || transaction.id;
  const ctaUrl = `${appUrl}/transactions?id=${encodeURIComponent(refNo)}`;
  const formattedAmount = transaction.trade_mode === 'free_donation'
    ? 'FREE / Donation'
    : transaction.trade_mode === 'swap'
    ? 'Barter / Item Swap'
    : `₱${parseFloat(transaction.amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

  const subject = `[TradeLink] New Order Received #${refNo} — ${listing.title}`;
  const text = `Hello ${seller.name},\n\nA fellow student (${buyer.name}) has placed an order for your listing: "${listing.title}".\nReference No: #${refNo}\nAmount: ${formattedAmount}\nPayment: ${formatPaymentMethodLabel(transaction.payment_method)}\n\nOpen chat and coordinate meetup:\n${ctaUrl}\n\nTradeLink Team`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="display: inline-block; background-color: #FEF3C7; color: #92400E; font-size: 12px; font-weight: bold; padding: 4px 14px; border-radius: 12px;">
        New Order Received
      </span>
    </div>
    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${seller.name}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
      Great news! <strong>${buyer.name}</strong> has initiated a deal for your listing: <strong>${listing.title}</strong>. Your item is now held as reserved.
    </p>
    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 18px; margin: 0 0 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #334155;" cellspacing="0" cellpadding="4">
        <tr>
          <td style="color: #64748B; width: 35%;">Reference No:</td>
          <td><strong style="color: #002B7F; font-family: monospace; font-size: 14px;">${refNo}</strong></td>
        </tr>
        <tr>
          <td style="color: #64748B;">Buyer:</td>
          <td>${buyer.name}</td>
        </tr>
        <tr>
          <td style="color: #64748B;">Amount:</td>
          <td><strong style="color: #047857; font-size: 15px;">${formattedAmount}</strong></td>
        </tr>
        <tr>
          <td style="color: #64748B;">Payment Method:</td>
          <td>${formatPaymentMethodLabel(transaction.payment_method)}</td>
        </tr>
      </table>
    </div>
    <div style="text-align: center; margin: 24px 0 20px 0;">
      <a href="${ctaUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #002B7F 0%, #0A1931 100%); color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(0, 43, 127, 0.25);">
        Open Chat &amp; Coordinate Handover
      </a>
    </div>
    <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
      Button not working? Open this link directly:<br/>
      <a href="${ctaUrl}" style="color: #002B7F; word-break: break-all;">${ctaUrl}</a>
    </p>
  `;

  const html = buildEmailLayout(bodyContent, `New order received for ${listing.title}`, appUrl);
  return sendMail(seller.email, subject, text, html);
}

/**
 * Sends order status update (completed / cancelled)
 */
async function sendOrderStatusUpdateEmail(targetUser, otherUser, transaction, listing, status, reason = '', req = null) {
  if (!targetUser || !targetUser.email) return;
  const appUrl = getAppBaseUrl(req);
  const refNo = transaction.reference_no || transaction.id;
  const ctaUrl = `${appUrl}/transactions?id=${encodeURIComponent(refNo)}`;

  const isCompleted = status === 'completed';
  const badgeColor = isCompleted ? '#DEF7EC' : '#FDE8E8';
  const textColor = isCompleted ? '#03543F' : '#9B1C1C';
  const titleText = isCompleted ? 'Deal Successfully Completed' : 'Order Cancelled';

  const subject = `[TradeLink] Order #${refNo} Status: ${status.toUpperCase()} — ${listing.title}`;
  const text = `Hello ${targetUser.name},\n\nOrder #${refNo} for "${listing.title}" is now marked as ${status.toUpperCase()}.\n${reason ? `Note: ${reason}\n` : ''}\nView details on TradeLink:\n${ctaUrl}\n\nTradeLink Marketplace Team`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 16px;">
      <span style="display: inline-block; background-color: ${badgeColor}; color: ${textColor}; font-size: 12px; font-weight: bold; padding: 4px 14px; border-radius: 12px;">
        ${titleText}
      </span>
    </div>
    <p style="color: #334155; font-size: 15px; margin: 0 0 12px 0;">Hello <strong>${targetUser.name}</strong>,</p>
    <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 18px 0;">
      Order <strong>#${refNo}</strong> for <strong>${listing.title}</strong> has been updated to <strong>${status.toUpperCase()}</strong>.
    </p>
    ${reason ? `<div style="background-color: #FFF5F5; border-left: 4px solid #E02424; padding: 12px 16px; border-radius: 4px; margin: 0 0 18px 0; color: #771D1D; font-size: 13px;"><strong>Reason / Note:</strong> ${reason}</div>` : ''}
    <div style="text-align: center; margin: 24px 0 20px 0;">
      <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #002B7F; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
        View Transaction Record
      </a>
    </div>
    <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
      Direct link: <a href="${ctaUrl}" style="color: #002B7F; word-break: break-all;">${ctaUrl}</a>
    </p>
  `;

  const html = buildEmailLayout(bodyContent, `Order #${refNo} marked as ${status}`, appUrl);
  return sendMail(targetUser.email, subject, text, html);
}

/**
 * Internal mail dispatcher with mock logger fallback
 */
async function sendMail(toEmail, subject, text, html) {
  if (!transporter) {
    const maskedEmail = toEmail ? toEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '[REDACTED]';
    logger.info(`[MOCK EMAIL] Dispatch to ${maskedEmail} | Subject: "${subject}"`);
    return { ok: true, mock: true };
  }

  try {
    await transporter.sendMail({
      from: env.email.from,
      to: toEmail,
      subject,
      text,
      html
    });
    logger.info(`[EMAIL SENT] Successfully dispatched to ${toEmail} | Subject: "${subject}"`);
    return { ok: true };
  } catch (error) {
    logger.error(`Failed to send email to ${toEmail}:`, error);
    return { ok: false, error: error.message };
  }
}

module.exports = {
  getAppBaseUrl,
  getAdminBaseUrl,
  formatPaymentMethodLabel,
  sendPasswordResetDirectEmail,
  sendPasswordResetApprovedEmail,
  sendPasswordResetRejectedEmail,
  sendAdminPasswordResetEmail,
  sendPasswordResetEmail: sendPasswordResetDirectEmail,
  sendOrderPlacedBuyerEmail,
  sendNewOrderSellerEmail,
  sendOrderStatusUpdateEmail
};
