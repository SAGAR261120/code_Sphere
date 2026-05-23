import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import * as productService from './product.service.js';
import { productQuerySchema } from './product.validation.js';

export const listProducts = asyncHandler(async (req, res) => {
  const filters = productQuerySchema.parse(req.query);
  const data = await productService.listProducts(filters);
  res.json(new ApiResponse(200, data));
});

export const getProductBySlug = asyncHandler(async (req, res) => {
  await productService.incrementViews(req.params.slug);
  const product = await productService.getProductBySlug(req.params.slug);
  res.json(new ApiResponse(200, product));
});

export const getCategories = asyncHandler(async (_req, res) => {
  const categories = await productService.getCategories();
  res.json(new ApiResponse(200, categories));
});

export const getFeaturedProducts = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;
  const products = await productService.getFeaturedProducts(limit);
  res.json(new ApiResponse(200, products));
});

export const createProduct = asyncHandler(async (req, res) => {
  const isAdmin = ['admin', 'super_admin'].includes(req.user?.role);
  const product = await productService.createProduct(req.body, req.user._id, isAdmin);
  res.status(201).json(new ApiResponse(201, product, 'Product created'));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json(new ApiResponse(200, product, 'Product updated'));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.json(new ApiResponse(200, null, 'Product deleted'));
});

export const changeProductStatus = asyncHandler(async (req, res) => {
  const { status, rejectionReason } = req.body;
  const product = await productService.changeProductStatus(req.params.id, status, rejectionReason);
  res.json(new ApiResponse(200, product, `Product status changed to ${status}`));
});

export const uploadProductFile = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const fileKey = req.file.key || req.file.filename;
  const product = await productService.setProductFileKey(req.params.id, fileKey, req.file.originalname, req.file.size);
  res.json(new ApiResponse(200, product, 'File uploaded successfully'));
});

export const uploadProductThumbnail = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
  const thumbnailUrl = req.file.location || `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${req.file.key}`;
  const product = await productService.updateProduct(req.params.id, { thumbnail: thumbnailUrl });
  res.json(new ApiResponse(200, product, 'Thumbnail uploaded'));
});
