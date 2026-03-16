import Queue from 'bull';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let bulkImportQueue = null;

export const getBulkImportQueue = () => {
  if (!bulkImportQueue) {
    bulkImportQueue = new Queue('amentra-bulk-import', redisUrl, { defaultJobOptions: { removeOnComplete: 100 } });
  }
  return bulkImportQueue;
};

export default getBulkImportQueue;
