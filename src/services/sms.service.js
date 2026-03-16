import { sendSms } from '../config/sms.js';

export const sendNotificationSms = async (phone, message) => {
  if (!phone) return;
  await sendSms(phone, message);
};
