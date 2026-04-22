const sgMail = require("@sendgrid/mail");
const { env } = require("./env");

let configured = false;

function configureSendgrid() {
  if (configured) return true;
  if (!env.SENDGRID_API_KEY) return false;
  sgMail.setApiKey(env.SENDGRID_API_KEY);
  configured = true;
  return true;
}

function isSendgridConfigured() {
  return configureSendgrid();
}

async function sendEmail({ to, subject, text }) {
  if (!isSendgridConfigured()) return { ok: false, skipped: true };
  if (!env.EMAIL_FROM) throw new Error("EMAIL_FROM is required when SENDGRID_API_KEY is set");

  await sgMail.send({
    to,
    from: env.EMAIL_FROM,
    subject,
    text,
  });
  return { ok: true };
}

module.exports = { isSendgridConfigured, sendEmail };

