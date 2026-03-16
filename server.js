import 'dotenv/config';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { disconnectRedis } from './src/config/redis.js';
import { logger } from './src/utils/logger.js';
import './src/queues/workers/bulkImport.worker.js';
import './src/queues/workers/report.worker.js';
import './src/queues/workers/email.worker.js';

const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
    const shutdown = async () => {
      logger.info('Shutting down...');
      server.close();
      await disconnectRedis();
      process.exit(0);
    };
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    logger.error('Failed to start:', err);
    process.exit(1);
  }
};

start();
