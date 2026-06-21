'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { productsApi } from '@/lib/api';
import { Product, ComponentCategory } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

const CATEGORIES = Object.values(ComponentCategory);

interface FormData {
  name: string;
  brand: string;
  category: ComponentCategory;
  price: string;
  stock: string;
  sku: string;
  image_url: string;
}

const EMPTY_FORM: FormData = {
  name: '',
  brand: '',
  category: CATEGORIES[0],
  price: '',
  stock: '',
  sku: '',
  image_url: '',
};

function ProductForm({
  initial,
  onSave,
  onCancel,
  saving,
  error,
}: {
  initial?: FormData;
  onSave: (data: FormData) => void;
  onCancel: () => void;
  saving: boolean;
  error: string;
}) {
  const [form, setForm] = useState<FormData>(initial ?? EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const set = (field: keyof FormData, val: string) => {
    setForm((p) => ({ ...p, [field]: val }));
    setFieldErrors((p) => ({ ...p, [field]: undefined }));
  };

  const validate = () => {
    const errs: Partial<Record<keyof FormData, string>> = {};
    if (!form.name.trim()) errs.name = 'Required';
    if (!form.brand.trim()) errs.brand = 'Required';
    if (!form.sku.trim()) errs.sku = 'Required';
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0)
      errs.price = 'Enter a valid price';
    if (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)
      errs.stock = 'Enter a valid stock quantity';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Product Name"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          error={fieldErrors.name}
          disabled={saving}
          required
        />
        <Input
          label="Brand"
          value={form.brand}
          onChange={(e) => set('brand', e.target.value)}
          error={fieldErrors.brand}
          disabled={saving}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-slate-300">Category</label>
          <select
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-slate-600 bg-[#0f172a] px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <Input
          label="Price ($)"
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => set('price', e.target.value)}
          error={fieldErrors.price}
          disabled={saving}
          required
        />
        <Input
          label="Stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={(e) => set('stock', e.target.value)}
          error={fieldErrors.stock}
          disabled={saving}
          required
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="SKU"
          value={form.sku}
          onChange={(e) => set('sku', e.target.value)}
          error={fieldErrors.sku}
          disabled={saving}
          required
        />
        <Input
          label="Image URL (optional)"
          type="url"
          value={form.image_url}
          onChange={(e) => set('image_url', e.target.value)}
          disabled={saving}
        />
      </div>
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button type="submit" size="md" loading={saving} className="flex-1">
          Save Product
        </Button>
        <Button type="button" variant="secondary" size="md" onClick={onCancel} disabled={saving} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || !isAdmin) {
      router.replace('/');
    }
  }, [user, isAdmin, authLoading, router]);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await productsApi.getAll({ search: search || undefined });
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (user && isAdmin) loadProducts();
  }, [user, isAdmin, loadProducts]);

  const handleSave = async (form: FormData) => {
    setSaving(true);
    setSaveError('');
    try {
      const payload = {
        name: form.name,
        brand: form.brand,
        category: form.category,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        sku: form.sku,
        image_url: form.image_url || undefined,
      };
      if (editProduct) {
        await productsApi.update(editProduct.id, payload);
      } else {
        await productsApi.create(payload as Omit<Product, 'id'>);
      }
      setModalOpen(false);
      setEditProduct(null);
      loadProducts();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await productsApi.delete(id);
      setProducts((p) => p.filter((item) => item.id !== id));
    } catch {
      alert('Failed to delete product.');
    } finally {
      setDeletingId(null);
    }
  };

  const openAdd = () => {
    setEditProduct(null);
    setSaveError('');
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setSaveError('');
    setModalOpen(true);
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const editInitial = editProduct
    ? {
        name: editProduct.name,
        brand: editProduct.brand,
        category: (CATEGORIES.includes(editProduct.category as ComponentCategory)
          ? editProduct.category
          : CATEGORIES[0]) as ComponentCategory,
        price: String(editProduct.price),
        stock: String(editProduct.stock),
        sku: editProduct.sku,
        image_url: editProduct.image_url ?? '',
      }
    : undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white">Products</h1>
          <p className="text-sm text-slate-400 mt-0.5">{products.length} total</p>
        </div>
        <Button onClick={openAdd}>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search by name, brand, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="secondary" onClick={loadProducts}>Search</Button>
      </div>

      {/* Table */}
      <div className="rounded-xl bg-[#1e293b] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <svg className="mx-auto h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No products found.</p>
            <Button className="mt-4" onClick={openAdd}>Add your first product</Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 text-left">Product</th>
                  <th className="px-4 py-3 text-left hidden sm:table-cell">Category</th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">SKU</th>
                  <th className="px-4 py-3 text-right">Price</th>
                  <th className="px-4 py-3 text-right hidden sm:table-cell">Stock</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white line-clamp-1">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.brand}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant="category">{p.category}</Badge>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-400 font-mono text-xs">
                      {p.sku}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-white">
                      ${p.price.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right hidden sm:table-cell">
                      <Badge variant={p.stock > 0 ? 'in-stock' : 'out-of-stock'}>
                        {p.stock}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-blue-400 transition-colors"
                          aria-label="Edit"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="rounded p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400 transition-colors disabled:opacity-50"
                          aria-label="Delete"
                        >
                          {deletingId === p.id ? (
                            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setSaveError(''); }}
        title={editProduct ? 'Edit Product' : 'Add Product'}
        maxWidth="lg"
      >
        <ProductForm
          key={editProduct?.id ?? 'new'}
          initial={editInitial}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setSaveError(''); }}
          saving={saving}
          error={saveError}
        />
      </Modal>
    </div>
  );
}
