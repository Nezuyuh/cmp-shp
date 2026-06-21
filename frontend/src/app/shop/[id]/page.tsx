'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Product, ProductVariant } from '@/types';
import { productsApi } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/hooks/useCart';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { addItem } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [addedMsg, setAddedMsg] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [p, v] = await Promise.all([
          productsApi.getById(id),
          productsApi.getVariants(id).catch(() => [] as ProductVariant[]),
        ]);
        setProduct(p);
        setVariants(v);
        if (v.length > 0) setSelectedVariant(v[0]);
      } catch {
        setError('Product not found.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    addItem(product, selectedVariant ?? undefined);
    setAdding(false);
    setAddedMsg(true);
    setTimeout(() => setAddedMsg(false), 2500);
  };

  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const displayStock = selectedVariant?.stock ?? product?.stock ?? 0;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 animate-pulse">
          <div className="aspect-square rounded-2xl bg-[#1e293b]" />
          <div className="space-y-4">
            <div className="h-6 bg-[#1e293b] rounded w-1/3" />
            <div className="h-8 bg-[#1e293b] rounded" />
            <div className="h-8 bg-[#1e293b] rounded w-2/3" />
            <div className="h-10 bg-[#1e293b] rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <p className="text-slate-400 mb-4">{error || 'Product not found.'}</p>
        <Button variant="secondary" onClick={() => router.push('/shop')}>
          Back to Shop
        </Button>
      </div>
    );
  }

  const specs = product.specs as Record<string, string> | undefined;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
        <span>/</span>
        <span className="text-slate-300 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#1e293b]">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-contain p-8"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <svg className="h-24 w-24 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
              </svg>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="category">{product.category}</Badge>
              <Badge variant={displayStock > 0 ? 'in-stock' : 'out-of-stock'}>
                {displayStock > 0 ? `${displayStock} in stock` : 'Out of Stock'}
              </Badge>
            </div>
            <p className="text-sm text-slate-400 font-medium">{product.brand}</p>
            <h1 className="text-2xl font-bold text-white mt-1 leading-snug">{product.name}</h1>
            <p className="text-sm text-slate-500 mt-1">SKU: {selectedVariant?.sku ?? product.sku}</p>
          </div>

          <div className="text-3xl font-black text-white">${displayPrice.toFixed(2)}</div>

          {/* Variants */}
          {variants.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">Options</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedVariant?.id === v.id
                        ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                        : 'border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    {v.label}
                    <span className="ml-1 text-xs opacity-75">(${v.price.toFixed(2)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart */}
          <div className="flex gap-3 flex-wrap">
            <Button
              size="lg"
              onClick={handleAddToCart}
              loading={adding}
              disabled={displayStock === 0}
              className="flex-1 min-w-[140px]"
            >
              {addedMsg ? (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Added!
                </>
              ) : (
                'Add to Cart'
              )}
            </Button>
            <Link href="/cart">
              <Button variant="secondary" size="lg">View Cart</Button>
            </Link>
          </div>

          {/* Specs table */}
          {specs && Object.keys(specs).length > 0 && (
            <Card className="mt-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Specifications
              </h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-700">
                  {Object.entries(specs).map(([key, val]) => (
                    <tr key={key}>
                      <td className="py-2 pr-4 text-slate-400 font-medium capitalize w-1/2">
                        {key.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 text-white">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          {/* Variant attributes */}
          {selectedVariant && Object.keys(selectedVariant.attributes).length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Selected Option Details
              </h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-700">
                  {Object.entries(selectedVariant.attributes).map(([key, val]) => (
                    <tr key={key}>
                      <td className="py-2 pr-4 text-slate-400 font-medium capitalize w-1/2">
                        {key.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2 text-white">{String(val)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
