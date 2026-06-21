'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Product, ComponentCategory } from '@/types';
import { productsApi } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useCart } from '@/hooks/useCart';

const CATEGORIES = Object.values(ComponentCategory);

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
            <svg className="h-14 w-14 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
            </svg>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1 flex-1">
        <p className="text-xs text-slate-400">{product.brand}</p>
        <h3 className="font-semibold text-white line-clamp-2 leading-snug flex-1">{product.name}</h3>
        <div className="flex items-center justify-between mt-2">
          <span className="text-lg font-bold text-white">${product.price.toFixed(2)}</span>
          <Badge variant={product.stock > 0 ? 'in-stock' : 'out-of-stock'}>
            {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
          </Badge>
        </div>
        <Badge variant="category" className="w-fit mt-1">{product.category}</Badge>
      </div>
      <div className="flex gap-2">
        <Link href={`/shop/${product.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="w-full">View</Button>
        </Link>
        <Button
          size="sm"
          className="flex-1"
          disabled={product.stock === 0}
          onClick={() => addItem(product)}
        >
          Add to Cart
        </Button>
      </div>
    </Card>
  );
}

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || '');

  const fetchProducts = useCallback(async (category: string, search: string) => {
    setLoading(true);
    try {
      const data = await productsApi.getAll({
        category: category || undefined,
        search: search || undefined,
      });
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cat = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    setActiveCategory(cat);
    setSearchInput(search);
    fetchProducts(cat, search);
  }, [searchParams, fetchProducts]);

  const applyFilters = useCallback(
    (category: string, search: string) => {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      router.push(`/shop${params.toString() ? `?${params.toString()}` : ''}`);
    },
    [router]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters(activeCategory, searchInput);
  };

  const handleCategory = (cat: string) => {
    const next = cat === activeCategory ? '' : cat;
    setActiveCategory(next);
    applyFilters(next, searchInput);
  };

  const clearFilters = () => {
    setSearchInput('');
    setActiveCategory('');
    router.push('/shop');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Shop Components</h1>
        <p className="mt-1 text-slate-400">
          {products.length} product{products.length !== 1 ? 's' : ''}
          {activeCategory ? ` in ${activeCategory}` : ''}
          {searchInput ? ` matching "${searchInput}"` : ''}
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search products, brands..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Button type="submit" size="md">Search</Button>
        {(activeCategory || searchInput) && (
          <Button type="button" variant="secondary" size="md" onClick={clearFilters}>
            Clear
          </Button>
        )}
      </form>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <div className="rounded-xl bg-[#1e293b] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Categories
            </h2>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => handleCategory('')}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                    !activeCategory
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  All Categories
                </button>
              </li>
              {CATEGORIES.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => handleCategory(cat)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      activeCategory === cat
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-[#1e293b] p-4 animate-pulse">
                  <div className="aspect-square rounded-lg bg-slate-700 mb-4" />
                  <div className="h-4 bg-slate-700 rounded mb-2" />
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
                  <div className="h-6 bg-slate-700 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-[#1e293b] py-20 text-center">
              <svg className="mx-auto h-12 w-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-slate-400 font-medium">No products found</p>
              <p className="text-sm text-slate-500 mt-1">Try adjusting your search or category filter</p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    }>
      <ShopContent />
    </Suspense>
  );
}
