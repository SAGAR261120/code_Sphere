import TaskSession from '../modules/tasks/taskSession.model.js';

export async function expireTaskSessions() {
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
  const result = await TaskSession.updateMany(
    { status: 'pending', createdAt: { $lt: twoHoursAgo } },
    { status: 'failed', failureReason: 'Session expired' }
  );
  if (result.modifiedCount > 0) {
    console.log(`[Job] Expired ${result.modifiedCount} stale task sessions`);
  }
}
