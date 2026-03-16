import { getEmailQueue } from '../email.queue.js';
import { sendEmail } from '../../config/email.js';

const queue = getEmailQueue();

queue.process(async (job) => {
  const { to, subject, templateName, templateVars } = job.data;
  let body = subject;
  if (templateVars?.name) body = `Hello ${templateVars.name},\n\n${subject}`;
  await sendEmail({ to, subject, html: body, text: body });
});

export default queue;
