import mongoose, { Schema } from 'mongoose';

const orderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },

    pricing: {
      moneyPaid: { type: Number, default: 0 },
      coinsPaid: { type: Number, default: 0 },
      originalMoneyPrice: { type: Number },
      originalCoinPrice: { type: Number },
      couponApplied: { type: String, default: null },
      couponDiscount: { type: Number, default: 0 },
    },

    paymentMethod: {
      type: String,
      enum: ['money', 'coins', 'mixed', 'free', 'wallet'],
      required: true,
    },

    paymentId: { type: String, default: null },
    paymentGateway: { type: String, enum: ['razorpay', 'stripe', 'paypal', 'wallet', null], default: null },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },

    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'refunded'],
      default: 'pending',
    },

    downloadToken: { type: String, select: false },
    downloadCount: { type: Number, default: 0 },
    maxDownloads: { type: Number, default: 10 },

    refundReason: { type: String, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ productId: 1 });
orderSchema.index({ paymentStatus: 1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
