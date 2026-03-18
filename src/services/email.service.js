import { sendEmail } from '../config/email.js';

const clientUrl = process.env.CLIENT_URL || 'http://localhost:8080';

export const sendVerificationEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: 'Verify your A-Mentra account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #10b981;">Verify Your A-Mentra Account</h2>
        <p>Enter this 6-digit code to verify your email address:</p>
        <div style="background: #f3f4f6; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #10b981;">
            ${otp}
          </span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">
          This code expires in <strong>30 minutes</strong>.
        </p>
        <p style="color: #6b7280; font-size: 14px;">
          If you didn't register for A-Mentra, ignore this email.
        </p>
      </div>
    `,
    text: `Your A-Mentra verification code is: ${otp}. This code expires in 30 minutes.`
  });
};

export const sendPasswordResetEmail = async (email, token) => {
  const link = `${clientUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: 'Reset your A-Mentra password',
    html: `Reset password: <a href="${link}">${link}</a>`,
    text: `Reset password: ${link}`,
  });
};

export const sendWelcomeEmail = async (email, name, tempPassword = null) => {
  const body = tempPassword
    ? `Welcome, ${name}. Your temporary password is: ${tempPassword}. Please change it after first login.`
    : `Welcome, ${name}. You can log in with your credentials.`;
  await sendEmail({
    to: email,
    subject: 'Welcome to A-Mentra',
    html: body,
    text: body,
  });
};
