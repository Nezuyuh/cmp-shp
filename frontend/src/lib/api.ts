import { Product, ProductVariant, CompatibilityResult, AdminStats, Order } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `Request failed with status ${res.status}`);
  }

  return res.json();
}

// Products
export const productsApi = {
  getAll: (params?: { category?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    if (params?.limit) query.set('limit', String(params.limit));
    const qs = query.toString();
    return request<Product[]>(`/api/products${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => request<Product>(`/api/products/${id}`),

  getVariants: (productId: string) =>
    request<ProductVariant[]>(`/api/products/${productId}/variants`),

  create: (data: Omit<Product, 'id'>) =>
    request<Product>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<Product>) =>
    request<Product>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    request<void>(`/api/products/${id}`, { method: 'DELETE' }),

  import: (rows: Record<string, unknown>[]) =>
    request<{ imported: number; skipped: { row: Record<string, unknown>; reason: string }[] }>(
      '/api/products/import',
      {
        method: 'POST',
        body: JSON.stringify({ rows }),
      }
    ),
};

// PC Builder
export const pcBuilderApi = {
  validate: (components: Record<string, string>) =>
    request<CompatibilityResult[]>('/api/pc-builder/validate', {
      method: 'POST',
      body: JSON.stringify({ components }),
    }),
};

// Orders
export const ordersApi = {
  getAll: () => request<Order[]>('/api/orders'),
  getById: (id: string) => request<Order>(`/api/orders/${id}`),
};

// Admin
export const adminApi = {
  getStats: () => request<AdminStats>('/api/admin/stats'),
};
