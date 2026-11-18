const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

/**
 * Returns memoized or newly initialized SMTP transporter.
 * Specifically configured for Vercel/AWS Lambda serverless environments:
 * - Uses IPv4 explicitly (family: 4) to avoid IPv6 connection hanging
 * - Configures explicit connection, greeting, and socket timeouts
 * - Avoids connection pooling (pool: false) so serverless containers close sockets cleanly
 */
function getTransporter() {
  if (transporter) return transporter;
  if (env.env === 'test') return null;

  if (env.email.user && env.email.pass) {
    const port = Number(env.email.port) || 465;
    const isSecure = port === 465;

    const transportConfig = {
      host: env.email.host || 'smtp.gmail.com',
      port,
      secure: isSecure,
      requireTLS: !isSecure,
      family: 4, // Forces IPv4 to prevent AWS Lambda / Vercel IPv6 DNS hanging
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      pool: false, // Serverless functions must not retain idle connection pools
      auth: {
        user: env.email.user,
        pass: env.email.pass
      },
      tls: {
        rejectUnauthorized: true,
        minVersion: 'TLSv1.2'
      }
    };

    try {
      transporter = nodemailer.createTransport(transportConfig);
      logger.info(`[EMAIL SERVICE] SMTP transporter initialized for ${env.email.user} (${env.email.host}:${port}, IPv4, secure=${isSecure})`);
      return transporter;
    } catch (err) {
      logger.error(`[EMAIL SERVICE] Failed to create SMTP transporter: ${err.message}`);
      return null;
    }
  } else if (env.env !== 'test' && !env.email.resendApiKey) {
    logger.warn('[EMAIL SERVICE] SMTP credentials not set. Running in development bypass mode.');
  }

  return null;
}

// Initial transporter check on startup
getTransporter();

/**
 * Dispatches email using Resend HTTP API (via native fetch).
 * Highly reliable for Vercel Serverless since it uses standard HTTPS (port 443)
 * and is immune to SMTP port blocks and Google App Password expiration.
 */
async function sendViaResend(toEmail, subject, text, html) {
  if (!env.email.resendApiKey) return null;

  try {
    const fromAddress = env.email.from.includes('<')
      ? env.email.from
      : `TradeLink Marketplace <${env.email.from || 'onboarding@resend.dev'}>`;

    const payload = {
      from: fromAddress,
      to: [toEmail],
      subject,
      html,
      text
    };

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.email.resendApiKey}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (response.ok && data?.id) {
      logger.info(`[RESEND EMAIL SENT] Dispatched to ${toEmail} | MessageId: ${data.id} | Subject: "${subject}"`);
      return { ok: true, messageId: data.id, provider: 'resend' };
    }

    logger.error(`[RESEND ERROR] Failed to send via Resend API: ${data?.message || JSON.stringify(data)}`);
    return { ok: false, provider: 'resend', error: data?.message || 'Resend delivery failed' };
  } catch (err) {
    logger.error(`[RESEND EXCEPTION] Network error calling Resend API: ${err.message}`);
    return { ok: false, provider: 'resend', error: err.message };
  }
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
  if (process.env.APP_URL && process.env.APP_URL.trim() && process.env.APP_URL !== 'undefined') {
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
    return 'https://uc-tradelink.vercel.app';
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
  if (process.env.ADMIN_APP_URL && process.env.ADMIN_APP_URL.trim() && process.env.ADMIN_APP_URL !== 'undefined') {
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
                <td style="background-color: #002B7F; padding: 22px 24px; text-align: center;">
                  <div style="display: inline-block;">
                    ${TRADELINK_LOGO_SVG}
                  </div>
                </td>
              </tr>
              <!-- Gold accent line -->
              <tr>
                <td style="height: 3px; background-color: #FFC72C;"></td>
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
      <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #002B7F; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
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
      <a href="${appUrl}" target="_blank" style="display: inline-block; background-color: #002B7F; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
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
      <a href="${adminUrl}" target="_blank" style="display: inline-block; background-color: #002B7F; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
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
function sendOrderPlacedBuyerEmail(buyer, seller, transaction, listing, req = null, handshakeCode = null) {
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
  const handshakeText = handshakeCode
    ? `\nYour private 4-digit meetup code: ${handshakeCode}\nShow this code to the seller in person after inspecting the item. Never send it in chat.\n`
    : '';
  const handshakeHtml = handshakeCode ? `
    <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 18px; margin: 0 0 20px 0; text-align: center;">
      <p style="margin: 0 0 8px; color: #1D4ED8; font-size: 12px; font-weight: 800; text-transform: uppercase;">Your private meetup code</p>
      <p style="margin: 0; color: #1E3A8A; font-family: monospace; font-size: 30px; font-weight: 900; letter-spacing: 8px;">${handshakeCode}</p>
      <p style="margin: 10px 0 0; color: #1E40AF; font-size: 12px; line-height: 1.5;">Show this code to the seller in person after inspecting the item. Never send it in chat.</p>
    </div>
  ` : '';
  const text = `Hello ${buyer.name},\n\nYour order #${refNo} for "${listing.title}" has been created!\nSeller: ${seller.name} (${listing.campus})\nTotal: ${formattedAmount}\nPayment Method: ${formatPaymentMethodLabel(transaction.payment_method)}${handshakeText}\nView deal details and coordinate safe handover:\n${ctaUrl}\n\nTrade safely on campus,\nTradeLink Marketplace Team`;

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
    ${handshakeHtml}
    <div style="text-align: center; margin: 24px 0 20px 0;">
      <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #002B7F; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
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
      <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #002B7F; color: #FFFFFF; font-size: 14px; font-weight: bold; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
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

  const statusPresentation = {
    completed: { label: 'Deal Successfully Completed', background: '#DEF7EC', color: '#03543F' },
    cancelled: { label: 'Order Cancelled', background: '#FDE8E8', color: '#9B1C1C' },
    confirmed: { label: 'Order Confirmed', background: '#DBEAFE', color: '#1E40AF' },
    disputed: { label: 'Order Under Review', background: '#FEF3C7', color: '#92400E' },
    pending: { label: 'Order Update', background: '#E0E7FF', color: '#3730A3' },
    handover_confirmed: { label: 'Handover Confirmation Received', background: '#D1FAE5', color: '#065F46' }
  };
  const presentation = statusPresentation[status] || statusPresentation.pending;
  const badgeColor = presentation.background;
  const textColor = presentation.color;
  const titleText = presentation.label;

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
 * Dispatches email via Resend API (priority) or Nodemailer SMTP with development bypass resilience
 */
async function sendMail(toEmail, subject, text, html) {
  // 1. Priority: If Resend API Key is configured, use fast, reliable HTTP API
  if (env.email.resendApiKey) {
    const resendResult = await sendViaResend(toEmail, subject, text, html);
    if (resendResult && resendResult.ok) {
      return resendResult;
    }
    // If Resend failed and no SMTP fallback, return error or bypass
    if (!env.email.user || !env.email.pass) {
      if (env.email.bypassMode) {
        logger.warn(`[EMAIL BYPASS] Non-production bypass active for ${toEmail}`);
        return { ok: true, bypassed: true, error: resendResult?.error };
      }
      return resendResult || { ok: false, error: 'Resend delivery failed' };
    }
    logger.warn('[EMAIL SERVICE] Resend delivery failed, falling back to SMTP transporter...');
  }

  // 2. Direct dispatch via Nodemailer SMTP (explicit IPv4, port 465/587)
  const currentTransporter = getTransporter();
  if (currentTransporter) {
    try {
      const info = await currentTransporter.sendMail({
        from: env.email.from,
        to: toEmail,
        subject,
        text,
        html
      });
      logger.info(`[SMTP EMAIL SENT] Successfully dispatched to ${toEmail} | MessageId: ${info?.messageId || 'ok'} | Subject: "${subject}"`);
      return { ok: true, messageId: info?.messageId, provider: 'smtp' };
    } catch (smtpErr) {
      const isBadCreds = smtpErr.message && (smtpErr.message.includes('535') || smtpErr.message.includes('BadCredentials'));
      if (isBadCreds) {
        logger.error(`[SMTP AUTH FAILED] Mail server rejected login for ${env.email.user}. Google requires a 16-character App Password (generated at myaccount.google.com/apppasswords), not the standard Gmail password. Error: ${smtpErr.message}`);
      } else {
        logger.error(`[SMTP ERROR] Failed to send email to ${toEmail}: ${smtpErr.message}`);
      }

      if (env.email.bypassMode) {
        logger.warn(`[EMAIL BYPASS] Non-production bypass active. Handled delivery to ${toEmail} for: "${subject}"`);
        return { ok: true, bypassed: true, error: smtpErr.message, isBadCreds };
      }
      return { ok: false, error: smtpErr.message, isBadCreds };
    }
  }

  // 3. Bypass / Mock mode when SMTP is unconfigured or in development
  const maskedEmail = toEmail ? toEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '[REDACTED]';
  if (env.email.bypassMode) {
    logger.info(`[EMAIL BYPASS] Non-production bypass dispatch to ${maskedEmail} | Subject: "${subject}"`);
    return { ok: true, mock: true, bypassed: true };
  }

  logger.error(`[EMAIL ERROR] Neither SMTP nor Resend API is configured. Cannot dispatch email to ${maskedEmail}`);
  return { ok: false, error: 'Neither SMTP nor Resend API is configured' };
}

/**
 * Diagnostic tool to verify email connection and test live sending
 */
async function testEmailConnection(recipientEmail = null) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: env.env,
    configured: {
      smtpHost: env.email.host,
      smtpPort: env.email.port,
      smtpUser: env.email.user || null,
      hasSmtpPass: Boolean(env.email.pass && env.email.pass.length > 0),
      smtpPassLength: env.email.pass ? env.email.pass.length : 0,
      fromAddress: env.email.from,
      hasResendApiKey: Boolean(env.email.resendApiKey),
      bypassMode: env.email.bypassMode
    },
    smtpVerification: null,
    testSendResult: null
  };

  // Test SMTP connection verification
  const currentTransporter = getTransporter();
  if (currentTransporter) {
    try {
      await currentTransporter.verify();
      diagnostics.smtpVerification = {
        ok: true,
        message: 'SMTP handshake and credentials accepted by mail server.'
      };
    } catch (err) {
      const isBadCreds = err.message && (err.message.includes('535') || err.message.includes('BadCredentials'));
      diagnostics.smtpVerification = {
        ok: false,
        error: err.message,
        code: err.code || null,
        hint: isBadCreds
          ? 'Google rejected your password. In Gmail, ensure 2-Step Verification is enabled and generate a fresh 16-character App Password at myaccount.google.com/apppasswords. Do NOT use your regular Gmail password.'
          : 'Check host, port, or cloud network restrictions.'
      };
    }
  } else {
    diagnostics.smtpVerification = {
      ok: false,
      message: 'SMTP transporter not initialized (SMTP_USER or SMTP_PASS missing).'
    };
  }

  // Optionally perform a live test send
  if (recipientEmail) {
    const subject = '[TradeLink Diagnostic] Live Email Delivery Test';
    const text = `This is a diagnostic email from TradeLink deployed on ${env.env}. Delivered successfully!`;
    const html = `<div style="font-family: Arial, sans-serif; padding: 20px; color: #0F172A;">
      <h2 style="color: #002B7F; margin: 0 0 10px 0;">TradeLink Email Delivery Diagnostic</h2>
      <p>This email confirms that your email configuration is operating correctly in <strong>${env.env}</strong> mode.</p>
      <div style="background: #F1F5F9; border-left: 4px solid #059669; padding: 12px; margin: 15px 0; font-size: 13px;">
        <strong>Configuration Details:</strong><br/>
        Host: ${env.email.host}:${env.email.port}<br/>
        Sender: ${env.email.from}<br/>
        Time: ${new Date().toLocaleString()}
      </div>
    </div>`;

    diagnostics.testSendResult = await sendMail(recipientEmail, subject, text, html);
  }

  return diagnostics;
}


/** Escape untrusted values before placing them in HTML email templates. */
function escapeEmailHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}

/**
 * Shared transactional notification template. Email delivery is best-effort:
 * callers should never roll back a completed marketplace action on mail failure.
 */
async function sendTransactionalNotification({
  toEmail, subject, preheader, greeting = 'Student', headline, message,
  ctaLabel = 'Open TradeLink', ctaUrl, details = [], req = null
}) {
  if (!toEmail) return { ok: false, skipped: true, error: 'Recipient email unavailable' };
  const safeName = escapeEmailHtml(greeting);
  const safeHeadline = escapeEmailHtml(headline);
  const safeMessage = escapeEmailHtml(message);
  const safeCta = escapeEmailHtml(ctaLabel);
  const safeUrl = escapeEmailHtml(ctaUrl || getAppBaseUrl(req));
  const rows = details.map(({ label, value }) =>
    '<tr><td style="padding:7px;color:#64748B;width:38%;">' +
    escapeEmailHtml(label) + '</td><td style="padding:7px;color:#0F172A;font-weight:600;">' +
    escapeEmailHtml(value) + '</td></tr>'
  ).join('');
  const body = `
    <div style="text-align:center;margin-bottom:16px;">
      <span style="display:inline-block;background:#EBF1FC;color:#002B7F;font-size:12px;font-weight:bold;padding:5px 14px;border-radius:20px;">TradeLink Notification</span>
    </div>
    <h2 style="margin:0 0 12px;color:#002B7F;font-size:20px;text-align:center;">${safeHeadline}</h2>
    <p style="color:#334155;font-size:15px;">Hello <strong>${safeName}</strong>,</p>
    <p style="color:#475569;font-size:14px;line-height:1.7;">${safeMessage}</p>
    ${rows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin:18px 0;">${rows}</table>` : ''}
    <div style="text-align:center;margin:24px 0;">
      <a href="${safeUrl}" style="display:inline-block;background:#002B7F;color:#FFFFFF;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 24px;border-radius:9px;">${safeCta}</a>
    </div>
    <p style="font-size:12px;color:#94A3B8;text-align:center;">If the button does not work, copy this link: <a href="${safeUrl}" style="color:#002B7F;">${safeUrl}</a></p>
  `;
  return sendMail(toEmail, subject, `${headline}\n\nHello ${greeting},\n\n${message}\n\n${ctaUrl || getAppBaseUrl(req)}`, buildEmailLayout(body, preheader || headline, getAppBaseUrl(req)));
}

async function sendWelcomeEmail(user, req = null) {
  const appUrl = getAppBaseUrl(req);
  return sendTransactionalNotification({
    toEmail: user?.email, greeting: user?.name, subject: '[TradeLink] Welcome to your campus marketplace',
    headline: 'Welcome to TradeLink!', message: 'Your student marketplace account is ready. Discover campus listings, connect with fellow students, and arrange safe meetups.',
    ctaLabel: 'Explore TradeLink', ctaUrl: appUrl, req
  });
}

async function sendChatMessageNotificationEmail(receiver, sender, conversationId, req = null) {
  const appUrl = getAppBaseUrl(req);
  return sendTransactionalNotification({
    toEmail: receiver?.email, greeting: receiver?.name, subject: `[TradeLink] New message from ${sender?.name || 'a student'}`,
    headline: 'You have a new message', message: `${sender?.name || 'A student'} sent you a message on TradeLink. Sign in to read and reply. For your privacy, message contents and attachments are not included in this email.`,
    ctaLabel: 'Open Messages', ctaUrl: `${appUrl}/messages?conversationId=${encodeURIComponent(conversationId || '')}`, req
  });
}

async function sendVerificationSubmittedEmail(user, verification, req = null) {
  const appUrl = getAppBaseUrl(req);
  return sendTransactionalNotification({
    toEmail: user?.email, greeting: user?.name, subject: '[TradeLink] Student verification received',
    headline: 'Your student verification was received',
    message: verification?.status === 'approved'
      ? 'Your student credentials passed the verification process and your verified student status is now active.'
      : 'Your student verification request has been received and is waiting for authorized campus administrator review. Your account will remain unverified until it is approved.',
    ctaLabel: 'View Verification Status', ctaUrl: `${appUrl}/profile`, req,
    details: [{ label: 'Review status', value: verification?.status === 'approved' ? 'Approved' : 'Pending review' },
      { label: 'Verification method', value: verification?.method === 'studyload_manual_kyc' ? 'Studyload document (manual review)' : 'Live selfie / student ID' }]
  });
}

async function sendAdminVerificationSubmittedEmail(admin, student, verification, req = null) {
  const adminUrl = getAdminBaseUrl(req);
  return sendTransactionalNotification({
    toEmail: admin?.email, greeting: admin?.name || 'Administrator',
    subject: '[TradeLink Admin] Student verification requires review',
    headline: 'New student verification request',
    message: `${student?.name || 'A student'} submitted student verification credentials. Please review the request in the administrator portal. Do not approve based on this email alone.`,
    ctaLabel: 'Review Verification', ctaUrl: `${adminUrl}/verifications`, req,
    details: [
      { label: 'Student', value: student?.name || 'Student' },
      { label: 'Campus', value: student?.campus || 'Not specified' },
      { label: 'Method', value: verification?.method === 'studyload_manual_kyc' ? 'Studyload manual review' : 'Live selfie / ID' },
      { label: 'Status', value: verification?.status || 'pending' }
    ]
  });
}

async function sendVerificationDecisionEmail(user, status, reason = '', req = null) {
  const appUrl = getAppBaseUrl(req);
  const approved = status === 'approved';
  return sendTransactionalNotification({
    toEmail: user?.email, greeting: user?.name,
    subject: approved ? '[TradeLink] Student verification approved' : '[TradeLink] Student verification needs attention',
    headline: approved ? 'Your student account is verified' : 'Your student verification was not approved',
    message: approved
      ? 'Your student credentials have been approved by campus administration. Your verified student status is now active.'
      : 'Campus administration could not approve your submitted credentials. Review the note below and submit updated documents if needed.',
    ctaLabel: 'View Verification Status', ctaUrl: `${appUrl}/profile`, req,
    details: [{ label: 'Decision', value: approved ? 'Approved' : 'Rejected' }, ...(reason ? [{ label: 'Administrator note', value: reason }] : [])]
  });
}

async function sendSwapProposalEmail(seller, proposer, swap, req = null) {
  const appUrl = getAppBaseUrl(req);
  return sendTransactionalNotification({
    toEmail: seller?.email, greeting: seller?.name,
    subject: '[TradeLink] New barter proposal for your listing',
    headline: 'You received a swap proposal',
    message: `${proposer?.name || 'A student'} proposed a barter exchange for your listing. Open TradeLink to review the offered item and respond.`,
    ctaLabel: 'Review Swap Proposal', ctaUrl: `${appUrl}/messages`, req,
    details: [{ label: 'Your listing', value: swap?.target_title || 'Campus listing' }, { label: 'Offered item', value: swap?.offered_item_title || 'Student item' }]
  });
}

async function sendSwapResponseEmail(proposer, seller, swap, status, req = null) {
  const appUrl = getAppBaseUrl(req);
  return sendTransactionalNotification({
    toEmail: proposer?.email, greeting: proposer?.name,
    subject: `[TradeLink] Your swap proposal was ${status}`,
    headline: status === 'accepted' ? 'Your swap proposal was accepted' : 'Your swap proposal was declined',
    message: `${seller?.name || 'The seller'} ${status === 'accepted' ? 'accepted' : 'declined'} your barter proposal. ${status === 'accepted' ? 'A transaction has been created; coordinate the handover in TradeLink.' : 'You can continue browsing other campus listings.'}`,
    ctaLabel: 'View Trade', ctaUrl: `${appUrl}/transactions`, req,
    details: [{ label: 'Listing', value: swap?.target_title || 'Campus listing' }, { label: 'Offered item', value: swap?.offered_item_title || 'Student item' }]
  });
}

async function sendFlashOfferEmail(requester, responder, flashRequest, req = null) {
  const appUrl = getAppBaseUrl(req);
  return sendTransactionalNotification({
    toEmail: requester?.email, greeting: requester?.name,
    subject: '[TradeLink] Someone responded to your Flash Market request',
    headline: 'You received a Flash Market offer',
    message: `${responder?.name || 'A student'} responded to your request. Open TradeLink to view the offer and continue the conversation.`,
    ctaLabel: 'View Offer', ctaUrl: `${appUrl}/flash-market`, req,
    details: [{ label: 'Requested item', value: flashRequest?.item_name || 'Campus item' }, { label: 'Campus', value: flashRequest?.target_campus || 'UC Campus' }]
  });
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
  sendOrderStatusUpdateEmail,
  sendTransactionalNotification,
  sendWelcomeEmail,
  sendChatMessageNotificationEmail,
  sendVerificationSubmittedEmail,
  sendAdminVerificationSubmittedEmail,
  sendVerificationDecisionEmail,
  sendSwapProposalEmail,
  sendSwapResponseEmail,
  sendFlashOfferEmail,
  testEmailConnection
};
