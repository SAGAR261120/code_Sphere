import mongoose, { Schema } from 'mongoose';

const couponSchema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    maxUses: { type: Number, default: null },
    currentUses: { type: Number, default: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    appliesTo: {
      type: String,
      enum: ['all', 'money_only', 'coins_only'],
      default: 'all',
    },
  },
  { timestamps: true }
);

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1, expiresAt: 1 });

couponSchema.methods.isValid = function () {
  if (!this.isActive) return false;
  if (this.expiresAt && this.expiresAt < new Date()) return false;
  if (this.maxUses !== null && this.currentUses >= this.maxUses) return false;
  return true;
};

couponSchema.methods.calculateDiscount = function (orderAmount) {
  if (this.discountType === 'percentage') {
    return Math.floor((orderAmount * this.discountValue) / 100);
  }
  return Math.min(this.discountValue, orderAmount);
};

const Coupon = mongoose.model('Coupon', couponSchema);
export default Coupon;
