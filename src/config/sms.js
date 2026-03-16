import axios from 'axios';

const TERMII_BASE = 'https://api.ng.termii.com/api';
const apiKey = process.env.TERMII_API_KEY;
const senderId = process.env.TERMII_SENDER_ID || 'AMentra';

export const sendSms = async (to, message) => {
  if (!apiKey) {
    console.warn('TERMII_API_KEY not set; SMS not sent');
    return;
  }
  await axios.post(`${TERMII_BASE}/sms/send`, {
    to: to.replace(/^0/, '234'),
    from: senderId,
    sms: message,
    type: 'plain',
    channel: 'generic',
    api_key: apiKey,
  });
};

export default { sendSms };
