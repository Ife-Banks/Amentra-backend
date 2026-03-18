import nodemailer from 'nodemailer'
import logger from '../utils/logger.js'

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_FROM,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'A-Mentra'}" <${process.env.EMAIL_FROM}>`,
      to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, '') || subject,
    })

    logger.info(`Email sent successfully to ${to}`)
  } catch (error) {
    logger.error(`Email send error: ${error.message}`)
    throw error  // throw so caller knows it failed
  }
}

export default sendEmail