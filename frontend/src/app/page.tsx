'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { productsApi } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/hooks/useCart';

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();

  return (
    <Card className="flex flex-col gap-3 group" hover>
      <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-slate-800">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-16 w-16 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-slate-400">{product.brand}</p>
            <h3 className="font-semibold text-white line-clamp-2 leading-snug">{product.name}</h3>
          </div>
          <Badge variant="category" className="shrink-0 mt-0.5">{product.category}</Badge>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-lg font-bold text-white">
            ${product.price.toFixed(2)}
          </span>
          <Badge variant={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
            {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
          </Badge>
        </div>
      </div>
      <div className="flex gap-2 mt-auto">
        <Link href={`/shop/${product.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">View</Button>
        </Link>
        <Button
          size="sm"
          onClick={() => addItem(product)}
          disabled={product.stock === 0}
          className="flex-1"
        >
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}

export default function HomePage() {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getAll({ limit: 4 })
      .then(setFeatured)
      .catch(() => setFeatured([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/5" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 h-72 w-72 rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-10 right-10 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-sm text-blue-400">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
              New components added weekly
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Build Your{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-600">
                Dream PC
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-xl">
              Shop top-tier components from leading brands. Use our smart PC Builder to assemble a fully compatible rig — no guesswork, no wasted money.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/shop">
                <Button size="lg">
                  Shop Now
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Button>
              </Link>
              <Link href="/pc-builder">
                <Button variant="secondary" size="lg">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                  Build a PC
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-14 flex flex-wrap gap-8">
              {[
                { label: 'Components', value: '500+' },
                { label: 'Brands', value: '50+' },
                { label: 'Happy Builders', value: '10k+' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="border-y border-slate-800 bg-[#0f172a]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-3 justify-center">
            {['CPU', 'GPU', 'Motherboard', 'RAM', 'Storage', 'PSU', 'Case', 'Cooler'].map((cat) => (
              <Link
                key={cat}
                href={`/shop?category=${cat}`}
                className="rounded-full border border-slate-700 bg-[#1e293b] px-4 py-2 text-sm font-medium text-slate-300 transition-all hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400"
              >
                {cat}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">Featured Products</h2>
            <p className="mt-1 text-slate-400">Top picks from our catalog</p>
          </div>
          <Link href="/shop" className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors">
            View all →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-[#1e293b] p-4 animate-pulse">
                <div className="aspect-square w-full rounded-lg bg-slate-700 mb-4" />
                <div className="h-4 bg-slate-700 rounded mb-2" />
                <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-6 bg-slate-700 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-[#1e293b] py-16 text-center">
            <svg className="mx-auto h-12 w-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-slate-400">No products available yet.</p>
            <p className="text-sm text-slate-500 mt-1">Check back soon or connect the backend.</p>
          </div>
        )}
      </section>

      {/* PC Builder CTA banner */}
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-8 sm:p-12">
          <div className="absolute top-0 right-0 h-full w-1/2 opacity-10">
            <svg viewBox="0 0 400 400" className="h-full w-full">
              <circle cx="300" cy="100" r="200" fill="white" />
            </svg>
          </div>
          <div className="relative max-w-xl">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Not sure what to pick?
            </h2>
            <p className="mt-3 text-blue-100 leading-relaxed">
              Try our compatibility-checked PC Builder. Pick parts step by step and we&apos;ll flag any conflicts before you buy.
            </p>
            <Link href="/pc-builder" className="mt-6 inline-block">
              <Button variant="secondary" size="lg" className="bg-white !text-blue-700 hover:bg-blue-50 border-0">
                Open PC Builder →
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
