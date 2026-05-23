import cron from 'node-cron';
import { expireTaskSessions } from './expireTaskSessions.job.js';
import { cleanupDownloadTokens } from './cleanupDownloadTokens.job.js';

export function startJobs() {
  // Every 10 minutes: expire stale task sessions
  cron.schedule('*/10 * * * *', () => {
    expireTaskSessions().catch((e) => console.error('Job error [expireTaskSessions]:', e));
  });

  // Every day at midnight: cleanup expired download tokens
  cron.schedule('0 0 * * *', () => {
    cleanupDownloadTokens().catch((e) => console.error('Job error [cleanupDownloadTokens]:', e));
  });

  console.log('Background jobs started');
}
