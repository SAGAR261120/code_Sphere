import { Router } from 'express';
import * as ctrl from './product.controller.js';
import { authenticate, optionalAuth } from '../../middleware/auth.middleware.js';
import { isAdmin } from '../../middleware/rbac.middleware.js';
import { validate } from '../../middleware/validate.middleware.js';
import { createProductSchema, updateProductSchema, productStatusSchema } from './product.validation.js';
import { uploadProductFile, uploadProductImage } from '../../middleware/upload.middleware.js';

const router = Router();

// Public
router.get('/', optionalAuth, ctrl.listProducts);
router.get('/categories', ctrl.getCategories);
router.get('/featured', ctrl.getFeaturedProducts);
router.get('/:slug', optionalAuth, ctrl.getProductBySlug);

// Admin
router.post('/', authenticate, isAdmin, validate(createProductSchema), ctrl.createProduct);
router.patch('/:id', authenticate, isAdmin, validate(updateProductSchema), ctrl.updateProduct);
router.delete('/:id', authenticate, isAdmin, ctrl.deleteProduct);
router.patch('/:id/status', authenticate, isAdmin, validate(productStatusSchema), ctrl.changeProductStatus);
router.post('/:id/file', authenticate, isAdmin, uploadProductFile, ctrl.uploadProductFile);
router.post('/:id/thumbnail', authenticate, isAdmin, uploadProductImage, ctrl.uploadProductThumbnail);

export default router;
