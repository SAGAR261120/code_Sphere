import Product from './product.model.js';
import Category from './category.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { getRedis } from '../../config/redis.js';

const CACHE_TTL = 300; // 5 minutes

function buildQuery(filters) {
  const q = { status: 'active' };

  if (filters.category) q.category = filters.category;
  if (filters.search) q.$text = { $search: filters.search };
  if (filters.tags) {
    const tagArr = Array.isArray(filters.tags) ? filters.tags : [filters.tags];
    q.tags = { $in: tagArr };
  }
  if (filters.featured === true) q.isFeatured = true;

  if (filters.priceType === 'free') q['pricing.isFree'] = true;
  else if (filters.priceType === 'coins') q['pricing.coinPrice'] = { $gt: 0 };
  else if (filters.priceType === 'money') q['pricing.moneyPrice'] = { $gt: 0 };
  else if (filters.priceType === 'mixed') q['pricing.hasMixedPricing'] = true;

  return q;
}

function buildSort(sort) {
  const sorts = {
    newest: { createdAt: -1 },
    popular: { totalSales: -1 },
    price_asc: { 'pricing.moneyPrice': 1 },
    price_desc: { 'pricing.moneyPrice': -1 },
    coins_asc: { 'pricing.coinPrice': 1 },
    coins_desc: { 'pricing.coinPrice': -1 },
  };
  return sorts[sort] || { createdAt: -1 };
}

export async function listProducts(filters) {
  const { page = 1, limit = 12, sort = 'newest', ...rest } = filters;
  const skip = (page - 1) * limit;

  const redis = getRedis();
  const cacheKey = `products:${JSON.stringify({ filters, page, limit, sort })}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const query = buildQuery(rest);
  const sortObj = buildSort(sort);

  const [products, total] = await Promise.all([
    Product.find(query)
      .select('-fileKey -setupGuide -changeLog')
      .populate('category', 'name slug')
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .lean(),
    Product.countDocuments(query),
  ]);

  const result = {
    products,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
  return result;
}

export async function getProductBySlug(slug) {
  const redis = getRedis();
  const cacheKey = `product:${slug}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const product = await Product.findOne({ slug, status: 'active' })
    .select('-fileKey')
    .populate('category', 'name slug')
    .populate('uploadedBy', 'name avatar')
    .lean();

  if (!product) throw new ApiError(404, 'Product not found');

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(product));
  return product;
}

export async function createProduct(data, userId, isAdmin = false) {
  const status = isAdmin ? (data.status || 'draft') : 'pending';
  const product = await Product.create({ ...data, uploadedBy: userId, status });
  await invalidateProductCaches();
  return product;
}

export async function updateProduct(id, data) {
  const product = await Product.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!product) throw new ApiError(404, 'Product not found');
  await invalidateProductCaches(product.slug);
  return product;
}

export async function deleteProduct(id) {
  const product = await Product.findByIdAndDelete(id);
  if (!product) throw new ApiError(404, 'Product not found');
  await invalidateProductCaches(product.slug);
}

export async function changeProductStatus(id, status, rejectionReason) {
  const product = await Product.findByIdAndUpdate(
    id,
    { status, ...(rejectionReason && { rejectionReason }) },
    { new: true }
  );
  if (!product) throw new ApiError(404, 'Product not found');
  await invalidateProductCaches(product.slug);
  return product;
}

export async function incrementViews(slug) {
  await Product.findOneAndUpdate({ slug }, { $inc: { views: 1 } });
}

export async function getCategories() {
  const redis = getRedis();
  const cached = await redis.get('categories:all');
  if (cached) return JSON.parse(cached);

  const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
  await redis.setex('categories:all', 600, JSON.stringify(categories));
  return categories;
}

export async function getFeaturedProducts(limit = 6) {
  return Product.find({ status: 'active', isFeatured: true })
    .select('-fileKey -setupGuide -changeLog')
    .populate('category', 'name slug')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

async function invalidateProductCaches(slug) {
  const redis = getRedis();
  const keys = await redis.keys('products:*');
  if (keys.length) await redis.del(...keys);
  if (slug) await redis.del(`product:${slug}`);
}

export async function setProductFileKey(productId, fileKey, fileName, fileSize) {
  return Product.findByIdAndUpdate(productId, { fileKey, fileName, fileSize }, { new: true });
}
