import Queue from 'bull';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let reportQueue = null;

export const getReportQueue = () => {
  if (!reportQueue) {
    reportQueue = new Queue('amentra-report', redisUrl, { defaultJobOptions: { removeOnComplete: 50 } });
  }
  return reportQueue;
};

export default getReportQueue;
