import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service.js';

export function useProducts(filters = {}) {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => productService.getProducts(filters).then((r) => r.data.data),
  });
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => productService.getProduct(slug).then((r) => r.data.data),
    enabled: !!slug,
  });
}

export function useFeaturedProducts(limit = 6) {
  return useQuery({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productService.getFeatured(limit).then((r) => r.data.data),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => productService.getCategories().then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });
}
