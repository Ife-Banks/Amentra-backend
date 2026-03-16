import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';

const sendgridKey = process.env.SENDGRID_API_KEY;
const emailFrom = process.env.EMAIL_FROM || 'noreply@amentra.com';
const emailFromName = process.env.EMAIL_FROM_NAME || 'A-Mentra';

if (sendgridKey) {
  sgMail.setApiKey(sendgridKey);
}

export const sendEmail = async ({ to, subject, html, text }) => {
  if (sendgridKey) {
    await sgMail.send({
      to,
      from: { email: emailFrom, name: emailFromName },
      subject,
      html: html || text,
      text,
    });
  } else {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
    });
    await transporter.sendMail({
      from: `"${emailFromName}" <${emailFrom}>`,
      to,
      subject,
      html: html || text,
      text,
    });
  }
};

export { emailFrom, emailFromName };
