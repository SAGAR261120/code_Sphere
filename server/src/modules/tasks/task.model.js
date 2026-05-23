import mongoose, { Schema } from 'mongoose';

const taskSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String },
    thumbnail: { type: String, default: null },
    rewardCoins: { type: Number, required: true, min: 1 },

    originalUrl: { type: String, select: false },
    shortenedUrl: { type: String, required: true },
    linkProvider: {
      type: String,
      enum: ['shrinkme', 'adfly', 'custom', 'ouo', 'shorte'],
      default: 'custom',
    },

    taskType: {
      type: String,
      enum: ['visit', 'signup', 'watch', 'download', 'social'],
      default: 'visit',
    },
    verificationMethod: {
      type: String,
      enum: ['timer', 'callback', 'manual', 'api'],
      default: 'timer',
    },
    requiredDuration: { type: Number, default: 30 },

    maxCompletionsPerUser: { type: Number, default: 1 },
    totalCompletionLimit: { type: Number, default: null },
    totalCompletions: { type: Number, default: 0 },
    cooldownHours: { type: Number, default: 24 },

    status: {
      type: String,
      enum: ['active', 'paused', 'expired', 'draft'],
      default: 'active',
    },
    startsAt: { type: Date, default: null },
    expiresAt: { type: Date, default: null },

    category: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, expiresAt: 1 });
taskSchema.index({ createdAt: -1 });

const Task = mongoose.model('Task', taskSchema);
export default Task;
