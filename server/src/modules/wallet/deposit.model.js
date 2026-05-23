import mongoose, { Schema } from 'mongoose';

const depositSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, default: 'INR' },
    method: {
      type: String,
      enum: ['razorpay', 'stripe', 'paypal', 'manual', 'upi'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'approved', 'rejected', 'failed'],
      default: 'pending',
    },
    gatewayOrderId: { type: String, default: null },
    gatewayPaymentId: { type: String, default: null },
    gatewaySignature: { type: String, default: null },
    proofImageUrl: { type: String, default: null },
    adminNote: { type: String, default: null },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    processedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

depositSchema.index({ userId: 1, status: 1, createdAt: -1 });
depositSchema.index({ status: 1 });

const Deposit = mongoose.model('Deposit', depositSchema);
export default Deposit;
