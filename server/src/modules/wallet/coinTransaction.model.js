import mongoose, { Schema } from 'mongoose';

const coinTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: [
        'task_reward',
        'purchase_spend',
        'referral_bonus',
        'admin_credit',
        'admin_debit',
        'refund_credit',
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    referenceType: { type: String, default: null },
  },
  { timestamps: true }
);

coinTransactionSchema.index({ userId: 1, createdAt: -1 });
coinTransactionSchema.index({ type: 1 });

const CoinTransaction = mongoose.model('CoinTransaction', coinTransactionSchema);
export default CoinTransaction;
