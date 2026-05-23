import mongoose, { Schema } from 'mongoose';

const walletTransactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: {
      type: String,
      enum: ['deposit', 'purchase', 'refund', 'referral_bonus', 'admin_credit', 'admin_debit'],
      required: true,
    },
    currency: { type: String, default: 'INR' },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String },
    referenceId: { type: Schema.Types.ObjectId, default: null },
    referenceType: { type: String, default: null },
    paymentGateway: { type: String, default: null },
    gatewayTransactionId: { type: String, default: null },
    metadata: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1 });

const WalletTransaction = mongoose.model('WalletTransaction', walletTransactionSchema);
export default WalletTransaction;
