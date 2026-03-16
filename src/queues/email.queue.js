import Queue from 'bull';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let emailQueue = null;

export const getEmailQueue = () => {
  if (!emailQueue) {
    emailQueue = new Queue('amentra-email', redisUrl, { defaultJobOptions: { removeOnComplete: 200, attempts: 3 } });
  }
  return emailQueue;
};

export default getEmailQueue;
