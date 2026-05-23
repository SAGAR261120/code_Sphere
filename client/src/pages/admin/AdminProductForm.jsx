import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Plus, Trash2, Upload, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/admin.service.js';
import { useCategories } from '../../hooks/useProducts.js';

const schema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(20),
  shortDescription: z.string().max(300).optional(),
  categoryId: z.string().min(1, 'Category required'),
  techStack: z.array(z.object({ value: z.string() })).optional(),
  isFree: z.boolean().default(false),
  moneyPrice: z.coerce.number().min(0).default(0),
  coinPrice: z.coerce.number().min(0).default(0),
  hasMixedPricing: z.boolean().default(false),
  discountedMoneyPrice: z.coerce.number().min(0).optional(),
  status: z.enum(['draft', 'pending', 'active', 'archived']).default('draft'),
  isFeatured: z.boolean().default(false),
  demoUrl: z.string().url().optional().or(z.literal('')),
  setupGuide: z.string().optional(),
  changelog: z.string().optional(),
});

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [productFile, setProductFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');

  const { data: categories } = useCategories();

  const { data: product, isLoading: loadingProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => adminService.getProduct(id),
    select: (r) => r.data.data,
    enabled: isEdit,
  });

  const { register, handleSubmit, watch, reset, control, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { isFree: false, moneyPrice: 0, coinPrice: 0, hasMixedPricing: false, discountedMoneyPrice: 0, status: 'draft', isFeatured: false, techStack: [], categoryId: '' },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'techStack' });
  const isFree = watch('isFree');
  const hasMixedPricing = watch('hasMixedPricing');

  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        shortDescription: product.shortDescription,
        categoryId: product.category?._id || product.category,
        techStack: (product.techStack || []).map((v) => ({ value: v })),
        status: product.status,
        isFeatured: product.isFeatured,
        demoUrl: product.demoUrl || '',
        setupGuide: product.setupGuide,
        changelog: product.changelog,
        isFree: product.pricing?.isFree || false,
        moneyPrice: (product.pricing?.moneyPrice || 0) / 100,
        coinPrice: product.pricing?.coinPrice || 0,
        hasMixedPricing: product.pricing?.hasMixedPricing || false,
        discountedMoneyPrice: product.pricing?.discountedMoneyPrice ? product.pricing.discountedMoneyPrice / 100 : 0,
      });
      if (product.thumbnail) setThumbnailPreview(product.thumbnail);
    }
  }, [product, reset]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const { techStack, categoryId, isFree, moneyPrice, coinPrice, hasMixedPricing, discountedMoneyPrice, ...rest } = data;
      const payload = {
        ...rest,
        category: categoryId,
        techStack: techStack?.map((t) => t.value).filter(Boolean),
        pricing: {
          isFree,
          // Admin enters rupees; backend stores paise
          moneyPrice: Math.round((moneyPrice || 0) * 100),
          coinPrice: Math.round(coinPrice || 0),
          hasMixedPricing,
          discountedMoneyPrice: discountedMoneyPrice ? Math.round(discountedMoneyPrice * 100) : null,
        },
      };

      // Create or update product with JSON
      const res = isEdit
        ? await adminService.updateProduct(id, payload)
        : await adminService.createProduct(payload);
      const productId = res.data?.data?._id || id;

      // Upload thumbnail if changed
      if (thumbnailFile && productId) {
        const thumbForm = new FormData();
        thumbForm.append('thumbnail', thumbnailFile);
        await adminService.uploadProductThumbnail(productId, thumbForm);
      }

      // Upload product zip if provided
      if (productFile && productId) {
        const fileForm = new FormData();
        fileForm.append('file', productFile);
        await adminService.uploadProductFile(productId, fileForm);
      }

      return res;
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Product updated' : 'Product created');
      navigate('/admin/products');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleThumbnail = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnailFile(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  if (isEdit && loadingProduct) return <div className="flex items-center justify-center py-16"><Loader2 size={24} className="animate-spin text-primary" /></div>;

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate('/admin/products')} className="flex items-center gap-2 text-text-secondary hover:text-text-primary text-sm mb-6 transition-colors">
        <ArrowLeft size={16} /> Back to Products
      </button>

      <h1 className="text-2xl font-bold text-text-primary mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      <form onSubmit={handleSubmit(mutation.mutate)} className="space-y-6">
        {/* Basic info */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-text-primary">Basic Information</h3>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Name *</label>
            <input {...register('name')} className="input" />
            {errors.name && <p className="text-danger text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Short Description</label>
            <input {...register('shortDescription')} className="input" placeholder="One-liner shown in cards" />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Description *</label>
            <textarea {...register('description')} rows={5} className="input resize-none" />
            {errors.description && <p className="text-danger text-xs mt-1">{errors.description.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Category *</label>
              <select {...register('categoryId')} className="input">
                <option value="">Select category</option>
                {(categories || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className="text-danger text-xs mt-1">{errors.categoryId.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-1.5">Status</label>
              <select {...register('status')} className="input">
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" {...register('isFeatured')} className="w-4 h-4" />
              <span className="text-sm text-text-secondary">Featured product</span>
            </label>
          </div>
        </div>

        {/* Pricing */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-text-primary">Pricing</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" {...register('isFree')} className="w-4 h-4" />
            <span className="text-sm text-text-secondary">Free product</span>
          </label>
          {!isFree && (
            <>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('hasMixedPricing')} className="w-4 h-4" />
                <span className="text-sm text-text-secondary">Mixed pricing (money + coins)</span>
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Money Price (₹)</label>
                  <input type="number" step="0.01" {...register('moneyPrice')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Discounted Price (₹)</label>
                  <input type="number" step="0.01" {...register('discountedMoneyPrice')} className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-1.5">Coin Price</label>
                  <input type="number" {...register('coinPrice')} className="input" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Tech stack */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-text-primary">Tech Stack</h3>
            <button type="button" onClick={() => append({ value: '' })} className="btn-secondary text-xs py-1 px-2 flex items-center gap-1">
              <Plus size={12} /> Add
            </button>
          </div>
          {fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <input {...register(`techStack.${i}.value`)} className="input flex-1" placeholder="e.g. React, Node.js" />
              <button type="button" onClick={() => remove(i)} className="p-2 hover:bg-danger/10 text-danger rounded transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Files */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-text-primary">Files</h3>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Thumbnail Image</label>
            {thumbnailPreview && <img src={thumbnailPreview} className="w-32 h-20 object-cover rounded-lg mb-2" />}
            <label className="btn-secondary flex items-center gap-2 w-fit cursor-pointer text-sm">
              <Upload size={14} /> Upload Thumbnail
              <input type="file" accept="image/*" className="hidden" onChange={handleThumbnail} />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Product ZIP File {isEdit && '(leave empty to keep existing)'}</label>
            <label className="btn-secondary flex items-center gap-2 w-fit cursor-pointer text-sm">
              <Upload size={14} /> {productFile ? productFile.name : 'Upload ZIP'}
              <input type="file" accept=".zip" className="hidden" onChange={(e) => setProductFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Demo URL</label>
            <input {...register('demoUrl')} className="input" placeholder="https://..." />
          </div>
        </div>

        {/* Docs */}
        <div className="card space-y-4">
          <h3 className="font-semibold text-text-primary">Documentation</h3>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Setup Guide (Markdown)</label>
            <textarea {...register('setupGuide')} rows={6} className="input resize-none font-mono text-xs" placeholder="# Setup Guide..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Changelog (Markdown)</label>
            <textarea {...register('changelog')} rows={4} className="input resize-none font-mono text-xs" placeholder="## v1.0.0..." />
          </div>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary flex items-center gap-2">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
