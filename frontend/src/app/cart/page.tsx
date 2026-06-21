'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default function CartPage() {
  const { items, hydrated, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();

  if (!hydrated) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#1e293b] rounded w-48" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-[#1e293b] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8 text-center">
        <svg className="mx-auto h-16 w-16 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h1 className="text-2xl font-bold text-white mb-2">Your cart is empty</h1>
        <p className="text-slate-400 mb-6">Add some components to get started</p>
        <div className="flex gap-3 justify-center">
          <Link href="/shop">
            <Button size="lg">Browse Shop</Button>
          </Link>
          <Link href="/pc-builder">
            <Button variant="secondary" size="lg">PC Builder</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Your Cart</h1>
          <p className="mt-1 text-slate-400">
            {totalItems} item{totalItems !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = item.variant?.price ?? item.product.price;
            const key = `${item.product.id}-${item.variant?.id ?? 'no-variant'}`;
            return (
              <Card key={key} className="flex gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                  {item.product.image_url ? (
                    <Image
                      src={item.product.image_url}
                      alt={item.product.name}
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg className="h-10 w-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">{item.product.brand}</p>
                      <Link
                        href={`/shop/${item.product.id}`}
                        className="font-semibold text-white hover:text-blue-400 transition-colors line-clamp-2 leading-snug"
                      >
                        {item.product.name}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-slate-400 mt-0.5">Option: {item.variant.label}</p>
                      )}
                    </div>
                    <button
                      onClick={() => removeItem(item.product.id, item.variant?.id)}
                      className="shrink-0 rounded p-1 text-slate-500 hover:bg-slate-700 hover:text-red-400 transition-colors"
                      aria-label="Remove item"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-auto flex-wrap gap-2">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.variant?.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white transition-colors"
                        aria-label="Increase quantity"
                      >
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <Badge variant={item.product.stock > 0 ? 'in-stock' : 'out-of-stock'} className="ml-1">
                        {item.product.stock > 0 ? 'In Stock' : 'Out'}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">${price.toFixed(2)} each</p>
                      <p className="text-base font-bold text-white">${(price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Order summary */}
        <div>
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Order Summary</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subtotal ({totalItems} items)</span>
                <span className="text-white font-medium">${totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Shipping</span>
                <span className="text-green-400 font-medium">Free</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Tax (estimated)</span>
                <span className="text-white font-medium">${(totalPrice * 0.1).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-700 pt-3 flex justify-between">
                <span className="text-base font-semibold text-white">Total</span>
                <span className="text-xl font-bold text-white">
                  ${(totalPrice * 1.1).toFixed(2)}
                </span>
              </div>
            </div>

            <Button size="lg" className="w-full mt-6">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Proceed to Checkout
            </Button>
            <p className="text-center text-xs text-slate-500 mt-3">
              Secure checkout — SSL encrypted
            </p>

            <div className="mt-4 border-t border-slate-700 pt-4">
              <Link href="/shop">
                <Button variant="secondary" size="sm" className="w-full">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
