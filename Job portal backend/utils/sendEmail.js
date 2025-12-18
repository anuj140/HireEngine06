require("dotenv").config();
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const EmailTemplate = require("../models/EmailTemplate");

/**
 * Send email using a stored template
 * @param {String} to - recipient
 * @param {String} template - template name
 * @param {Object} variables - placeholder replacements
 */
async function sendEmail({ to, template, variables = {} }) {
  const tpl = await EmailTemplate.findOne({ name: template });
  if (!tpl) throw new Error(`Template "${template}" not found`);

  let subject = tpl.subject;
  let body = tpl.body;

  // replace {{placeholders}}
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, "g");
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  });

  const msg = {
    to,
    from: process.env.SENDGRID_FROM, // must be a verified sender in SendGrid
    subject,
    html: body,
  };

  await sgMail.send(msg);
}

module.exports = sendEmail;
