import mongoose, { Schema } from 'mongoose';

const taskSessionSchema = new Schema(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    sessionToken: { type: String, required: true, unique: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },

    status: {
      type: String,
      enum: ['pending', 'verifying', 'completed', 'failed', 'fraud'],
      default: 'pending',
    },
    timeSpentSeconds: { type: Number, default: null },
    verificationCode: { type: String, default: null },

    ipAddress: { type: String },
    userAgent: { type: String },
    deviceFingerprint: { type: String },

    failureReason: { type: String, default: null },
    fraudFlags: [{ type: String }],

    coinsAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

taskSessionSchema.index({ taskId: 1, userId: 1 });
taskSessionSchema.index({ sessionToken: 1 });
taskSessionSchema.index({ ipAddress: 1, taskId: 1 });
taskSessionSchema.index({ userId: 1, status: 1 });
// TTL: auto-delete sessions older than 90 days
taskSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 * 90 });

const TaskSession = mongoose.model('TaskSession', taskSessionSchema);
export default TaskSession;
