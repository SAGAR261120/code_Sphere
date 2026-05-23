import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 150 },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 250 },

    thumbnail: { type: String, required: true },
    screenshots: [{ type: String }],
    demoUrl: { type: String, default: null },
    videoUrl: { type: String, default: null },

    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: String, trim: true, lowercase: true }],
    techStack: [{ type: String, trim: true }],
    version: { type: String, default: '1.0.0' },

    pricing: {
      moneyPrice: { type: Number, default: 0, min: 0 },
      coinPrice: { type: Number, default: 0, min: 0 },
      isFree: { type: Boolean, default: false },
      hasMixedPricing: { type: Boolean, default: false },
      mixedOptions: [
        {
          label: { type: String },
          moneyAmount: { type: Number, default: 0 },
          coinAmount: { type: Number, default: 0 },
        },
      ],
      discountedMoneyPrice: { type: Number, default: null },
      discountEndsAt: { type: Date, default: null },
    },

    fileKey: { type: String, select: false },
    fileName: { type: String },
    fileSize: { type: Number },
    setupGuide: { type: String },
    changeLog: { type: String },

    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['draft', 'pending', 'active', 'rejected', 'archived'],
      default: 'draft',
    },
    rejectionReason: { type: String, default: null },

    totalSales: { type: Number, default: 0 },
    totalRevenueMoney: { type: Number, default: 0 },
    totalRevenueCoins: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },

    isFeatured: { type: Boolean, default: false },
    featuredUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 });
productSchema.index({ status: 1, isFeatured: -1, createdAt: -1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

productSchema.pre('save', async function (next) {
  if (this.isModified('name') || !this.slug) {
    let base = slugify(this.name, { lower: true, strict: true });
    let slug = base;
    let count = 1;
    while (await mongoose.model('Product').exists({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${count++}`;
    }
    this.slug = slug;
  }
  next();
});

const Product = mongoose.model('Product', productSchema);
export default Product;
