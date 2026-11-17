'use strict';

const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../utils/logger');

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { host, port, secure, user, pass } = config.smtp;
  if (!host || !user || !pass) {
    throw new Error(
      'SMTP not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS in environment variables.'
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
  });

  return _transporter;
}

async function sendMail({ to, subject, html, text }) {
  const transporter = getTransporter();
  const from = config.smtp.from || config.smtp.user;

  const info = await transporter.sendMail({ from, to, subject, html, text });
  logger.info({ messageId: info.messageId, to, subject }, 'Email sent');
  return info;
}

async function sendInviteEmail({ toEmail, orgName, inviterName, inviteLink, role }) {
  const subject = `You've been invited to ${orgName} on OneOps`;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">You have been invited to <strong>${orgName}</strong></h2>
      <p>${inviterName} has invited you to join <strong>${orgName}</strong> as a <strong>${role}</strong>.</p>
      <p>Click the button below to accept the invitation and set up your account:</p>
      <p style="margin: 24px 0;">
        <a href="${inviteLink}"
           style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
          Accept Invitation
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;">
        This link expires in 7 days. If you did not expect this invitation, you can safely ignore this email.
      </p>
      <p style="color:#6b7280;font-size:13px;">
        Or copy this link into your browser:<br/>
        <a href="${inviteLink}" style="color:#4f46e5;">${inviteLink}</a>
      </p>
    </div>
  `;

  const text = `
You have been invited to join ${orgName} as a ${role} by ${inviterName}.

Accept your invitation here: ${inviteLink}

This link expires in 7 days.
  `.trim();

  return sendMail({ to: toEmail, subject, html, text });
}

async function sendMemberAddedEmail({ toEmail, orgName, inviterName, role }) {
  const subject = `You've been added to ${orgName} on OneOps`;

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Welcome to <strong>${orgName}</strong></h2>
      <p>${inviterName} has added you to <strong>${orgName}</strong> as a <strong>${role}</strong>.</p>
      <p>Log in to OneOps to get started:</p>
      <p style="margin: 24px 0;">
        <a href="${config.frontendUrl}/login"
           style="background:#4f46e5;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;">
          Go to OneOps
        </a>
      </p>
    </div>
  `;

  const text = `
You have been added to ${orgName} as a ${role} by ${inviterName}.

Log in here: ${config.frontendUrl}/login
  `.trim();

  return sendMail({ to: toEmail, subject, html, text });
}

module.exports = { sendInviteEmail, sendMemberAddedEmail };
