const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

// Initialize transporter if credentials are provided, else fallback to mock logger
if (env.email.user && env.email.pass) {
  transporter = nodemailer.createTransport({
    host: env.email.host,
    port: env.email.port,
    secure: env.email.port === 465,
    auth: {
      user: env.email.user,
      pass: env.email.pass
    }
  });
}

/**
 * Sends a password reset email containing the 4-digit code
 * @param {string} toEmail
 * @param {string} code
 * @param {string} userName
 */
async function sendPasswordResetEmail(toEmail, code, userName = 'Student') {
  const subject = `[TradeLink UC] Password Reset Code: ${code}`;
  const text = `Hello ${userName},\n\nYour 4-digit TradeLink verification code is: ${code}\n\nThis code will expire in 15 minutes. If you did not request this, please disregard.\n\nBest,\nTradeLink Campus Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 12px;">
      <h2 style="color: #002B7F; text-align: center;">TradeLink Verification</h2>
      <p>Hello <strong>${userName}</strong>,</p>
      <p>Use the 4-digit code below to reset your TradeLink student password:</p>
      <div style="background-color: #F1F5F9; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; padding: 15px; border-radius: 8px; color: #002B7F; margin: 20px 0;">
        ${code}
      </div>
      <p style="font-size: 12px; color: #64748B;">This code is valid for 15 minutes. If you did not make this request, your account remains secure.</p>
    </div>
  `;

  if (!transporter) {
    const maskedEmail = toEmail ? toEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '[REDACTED]';
    logger.info(`[MOCK EMAIL] Password Reset dispatched to ${maskedEmail} | Code: [SECURE]`);
    return { ok: true, mock: true, code };
  }

  try {
    await transporter.sendMail({
      from: env.email.from,
      to: toEmail,
      subject,
      text,
      html
    });
    return { ok: true };
  } catch (error) {
    logger.error('Failed to send email:', error);
    return { ok: false, error: error.message };
  }
}

module.exports = {
  sendPasswordResetEmail
};
