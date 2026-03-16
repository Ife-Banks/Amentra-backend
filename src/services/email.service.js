import { sendEmail } from '../config/email.js';

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

export const sendVerificationEmail = async (email, token, isOTP = false) => {
  if (isOTP) {
    // OTP email
    await sendEmail({
      to: email,
      subject: 'A-Mentra - Email Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #0f766e; margin-bottom: 20px;">A-Mentra Email Verification</h2>
          <p style="color: #374151; font-size: 16px; margin-bottom: 20px;">
            Your 6-digit verification code is:
          </p>
          <div style="background-color: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; color: #0f766e; letter-spacing: 4px;">${token}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-bottom: 20px;">
            This code will expire in 10 minutes. Do not share this code with anyone.
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `,
      text: `Your A-Mentra verification code is: ${token}. This code will expire in 10 minutes.`,
    });
  } else {
    // Regular email verification
    const link = `${clientUrl}/verify-email?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'Verify your A-Mentra email',
      html: `Click to verify: <a href="${link}">${link}</a>`,
      text: `Verify your email: ${link}`,
    });
  }
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
