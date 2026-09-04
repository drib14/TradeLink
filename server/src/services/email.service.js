const nodemailer = require('nodemailer');
const env = require('../config/env');
const logger = require('../utils/logger');

let transporter = null;

// Initialize Gmail SMTP transporter
if (env.email.user && env.email.pass) {
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
 * Sends a password reset email with the approved verification code
 * @param {string} toEmail
 * @param {string} code
 * @param {string} userName
 */
async function sendPasswordResetApprovedEmail(toEmail, code, userName = 'Student') {
  const subject = `[TradeLink UC] Password Reset Approved - Verification Code: ${code}`;
  const text = `Hello ${userName},\n\nYour password reset request has been APPROVED by University of Cebu campus administration.\n\nYour TradeLink verification code is: ${code}\n\nThis code will expire in 30 minutes. Enter this code on the TradeLink reset password screen to complete resetting your password.\n\nIf you did not request this, please contact campus administration immediately.\n\nBest regards,\nUniversity of Cebu TradeLink Administration Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #002B7F; margin-bottom: 4px;">TradeLink UC</h2>
        <span style="display: inline-block; background-color: #DEF7EC; color: #03543F; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 12px;">
          ✓ Password Reset Approved
        </span>
      </div>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${userName}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">
        Your password reset request has been verified and <strong>approved</strong> by campus administration. Use the verification code below to set your new password:
      </p>
      <div style="background-color: #F8FAFC; border: 2px dashed #002B7F; font-size: 32px; font-weight: 800; letter-spacing: 8px; text-align: center; padding: 18px; border-radius: 12px; color: #002B7F; margin: 24px 0;">
        ${code}
      </div>
      <p style="font-size: 13px; color: #64748B; margin-bottom: 20px;">
        ⏱️ <strong>Valid for 30 minutes.</strong> Return to the TradeLink sign-in dialog, choose "Reset Password", and enter this code along with your new password.
      </p>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
        University of Cebu TradeLink · Safe & Verified Campus Marketplace
      </p>
    </div>
  `;

  return sendMail(toEmail, subject, text, html);
}

/**
 * Sends a notification email when a password reset request is refused/rejected by administration
 * @param {string} toEmail
 * @param {string} userName
 * @param {string} reason
 */
async function sendPasswordResetRejectedEmail(toEmail, userName = 'Student', reason = '') {
  const subject = `[TradeLink UC] Password Reset Request Status`;
  const text = `Hello ${userName},\n\nYour password reset request was reviewed by campus administration and was not approved.\n\nReason: ${reason || 'Identity verification could not be confirmed.'}\n\nIf you believe this is an error, please visit the campus moderation desk or contact admin@uc.edu.ph with your Student ID.\n\nBest regards,\nUniversity of Cebu TradeLink Administration Team`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 16px; background-color: #FFFFFF;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #002B7F; margin-bottom: 4px;">TradeLink UC</h2>
        <span style="display: inline-block; background-color: #FDE8E8; color: #9B1C1C; font-size: 12px; font-weight: bold; padding: 4px 10px; border-radius: 12px;">
          Notice: Request Not Approved
        </span>
      </div>
      <p style="color: #334155; font-size: 15px;">Hello <strong>${userName}</strong>,</p>
      <p style="color: #475569; font-size: 14px; line-height: 1.5;">
        Your password reset request was reviewed by campus administration and could not be approved at this time.
      </p>
      ${reason ? `<div style="background-color: #FFF5F5; border-left: 4px solid #E02424; padding: 12px 16px; border-radius: 4px; margin: 16px 0; color: #771D1D; font-size: 14px;"><strong>Admin Note:</strong> ${reason}</div>` : ''}
      <p style="font-size: 13px; color: #64748B; margin-top: 16px;">
        If you require assistance regaining access to your student account, please visit the campus moderation desk or email <a href="mailto:admin@uc.edu.ph" style="color: #002B7F;">admin@uc.edu.ph</a> with proof of enrollment.
      </p>
      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #94A3B8; text-align: center; margin: 0;">
        University of Cebu TradeLink · Safe & Verified Campus Marketplace
      </p>
    </div>
  `;

  return sendMail(toEmail, subject, text, html);
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
  sendPasswordResetApprovedEmail,
  sendPasswordResetRejectedEmail,
  sendPasswordResetEmail: sendPasswordResetApprovedEmail // Alias for backwards compatibility
};
