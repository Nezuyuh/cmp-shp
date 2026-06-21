'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Product, ComponentCategory, CompatibilityResult } from '@/types';
import { productsApi, pcBuilderApi } from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/hooks/useCart';

const STEPS: ComponentCategory[] = [
  ComponentCategory.CPU,
  ComponentCategory.Motherboard,
  ComponentCategory.RAM,
  ComponentCategory.GPU,
  ComponentCategory.Case,
  ComponentCategory.Cooler,
  ComponentCategory.Storage,
  ComponentCategory.PSU,
];

type Build = Partial<Record<ComponentCategory, Product>>;

function StepIndicator({
  steps,
  current,
  build,
  onSelect,
}: {
  steps: ComponentCategory[];
  current: number;
  build: Build;
  onSelect: (i: number) => void;
}) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-0">
        {steps.map((step, i) => {
          const selected = !!build[step];
          const isActive = i === current;
          const isPast = i < current;

          return (
            <div key={step} className="flex items-center">
              <button
                onClick={() => onSelect(i)}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-400' : isPast || selected ? 'text-slate-300 hover:text-white' : 'text-slate-500 hover:text-slate-400'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold border-2 transition-colors ${
                    selected
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : isActive
                      ? 'border-blue-500 text-blue-400 bg-blue-500/10'
                      : isPast
                      ? 'border-slate-500 text-slate-400 bg-slate-800'
                      : 'border-slate-600 text-slate-500 bg-slate-800'
                  }`}
                >
                  {selected ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-xs font-medium whitespace-nowrap">{step}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-8 transition-colors ${selected ? 'bg-blue-500' : 'bg-slate-700'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function PCBuilderPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [build, setBuild] = useState<Build>({});
  const [stepProducts, setStepProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [compatibility, setCompatibility] = useState<CompatibilityResult[]>([]);
  const [loadingCompat, setLoadingCompat] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const { addItem } = useCart();
  const compatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentCategory = STEPS[currentStep];

  // Load products for current step
  useEffect(() => {
    setLoadingProducts(true);
    productsApi
      .getAll({ category: currentCategory })
      .then(setStepProducts)
      .catch(() => setStepProducts([]))
      .finally(() => setLoadingProducts(false));
  }, [currentCategory]);

  // Run compatibility check when build changes
  const runCompat = useCallback((b: Build) => {
    const componentIds: Record<string, string> = {};
    for (const [cat, product] of Object.entries(b)) {
      if (product) componentIds[cat] = product.id;
    }
    if (Object.keys(componentIds).length < 2) {
      setCompatibility([]);
      return;
    }
    setLoadingCompat(true);
    pcBuilderApi
      .validate(componentIds)
      .then(setCompatibility)
      .catch(() => setCompatibility([]))
      .finally(() => setLoadingCompat(false));
  }, []);

  const selectComponent = (product: Product) => {
    const next = { ...build, [currentCategory]: product };
    setBuild(next);

    if (compatTimerRef.current) clearTimeout(compatTimerRef.current);
    compatTimerRef.current = setTimeout(() => runCompat(next), 600);

    if (currentStep < STEPS.length - 1) {
      setTimeout(() => setCurrentStep((s) => s + 1), 300);
    }
  };

  const removeComponent = (cat: ComponentCategory) => {
    const next = { ...build };
    delete next[cat];
    setBuild(next);
    if (compatTimerRef.current) clearTimeout(compatTimerRef.current);
    compatTimerRef.current = setTimeout(() => runCompat(next), 600);
  };

  const totalPrice = Object.values(build).reduce(
    (sum, p) => sum + (p?.price ?? 0),
    0
  );

  const hasCriticalError = compatibility.some((r) => !r.passed && r.rule === 'critical');
  const selectedCount = Object.values(build).filter(Boolean).length;

  const handleAddBuildToCart = () => {
    setAddingToCart(true);
    for (const product of Object.values(build)) {
      if (product) addItem(product);
    }
    setTimeout(() => setAddingToCart(false), 800);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">PC Builder</h1>
        <p className="mt-1 text-slate-400">Select components step by step. Compatibility is checked in real time.</p>
      </div>

      {/* Step indicator */}
      <div className="mb-6 rounded-xl bg-[#1e293b] p-4">
        <StepIndicator
          steps={STEPS}
          current={currentStep}
          build={build}
          onSelect={setCurrentStep}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Component selection */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">
              Select {currentCategory}
            </h2>
            {build[currentCategory] && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => removeComponent(currentCategory)}
              >
                Clear selection
              </Button>
            )}
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-xl bg-[#1e293b] p-4 animate-pulse">
                  <div className="h-32 bg-slate-700 rounded mb-3" />
                  <div className="h-4 bg-slate-700 rounded mb-2" />
                  <div className="h-4 bg-slate-700 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : stepProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {stepProducts.map((product) => {
                const isSelected = build[currentCategory]?.id === product.id;
                return (
                  <div
                    key={product.id}
                    onClick={() => selectComponent(product)}
                    className={`relative rounded-xl border-2 cursor-pointer transition-all duration-200 bg-[#1e293b] p-4 hover:bg-[#263348] ${
                      isSelected
                        ? 'border-blue-500 shadow-lg shadow-blue-500/10'
                        : 'border-transparent hover:border-slate-600'
                    }`}
                  >
                    {/* Checkmark overlay */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
                        <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-800">
                        {product.image_url ? (
                          <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            className="object-contain p-2"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <svg className="h-8 w-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-xs text-slate-400">{product.brand}</p>
                        <p className="text-sm font-semibold text-white line-clamp-2 leading-snug">
                          {product.name}
                        </p>
                        <p className="text-base font-bold text-white">${product.price.toFixed(2)}</p>
                        <Badge variant={product.stock > 0 ? 'in-stock' : 'out-of-stock'} className="w-fit">
                          {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                    </div>

                    {/* Key specs */}
                    {product.specs && Object.keys(product.specs).length > 0 && (
                      <div className="mt-3 grid grid-cols-2 gap-1 border-t border-slate-700 pt-3">
                        {Object.entries(product.specs as Record<string, string>)
                          .slice(0, 4)
                          .map(([k, v]) => (
                            <div key={k} className="text-xs">
                              <span className="text-slate-500 capitalize">{k.replace(/_/g, ' ')}: </span>
                              <span className="text-slate-300">{String(v)}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl bg-[#1e293b] py-16 text-center">
              <p className="text-slate-400">No {currentCategory} products available.</p>
            </div>
          )}

          {/* Step navigation */}
          <div className="mt-6 flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
              disabled={currentStep === 0}
            >
              ← Previous
            </Button>
            <Button
              onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={currentStep === STEPS.length - 1}
            >
              Next →
            </Button>
          </div>
        </div>

        {/* Build summary sidebar */}
        <div className="space-y-4">
          <Card>
            <h2 className="text-base font-semibold text-white mb-4">
              Your Build ({selectedCount}/{STEPS.length})
            </h2>
            <div className="space-y-2">
              {STEPS.map((step) => {
                const product = build[step];
                return (
                  <div
                    key={step}
                    className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${
                      currentStep === STEPS.indexOf(step) ? 'bg-blue-500/10' : 'hover:bg-slate-700/50'
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-xs font-bold ${
                        product ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {product ? '✓' : STEPS.indexOf(step) + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-500 font-medium">{step}</p>
                      {product ? (
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs text-slate-300 truncate">{product.name}</p>
                          <p className="text-xs font-semibold text-white shrink-0">${product.price.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-600 italic">Not selected</p>
                      )}
                    </div>
                    {product && (
                      <button
                        onClick={() => removeComponent(step)}
                        className="shrink-0 text-slate-500 hover:text-red-400 transition-colors"
                        aria-label={`Remove ${step}`}
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 border-t border-slate-700 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-300">Estimated Total</span>
                <span className="text-xl font-bold text-white">${totalPrice.toFixed(2)}</span>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full mt-4"
              loading={addingToCart}
              disabled={selectedCount === 0 || hasCriticalError}
              onClick={handleAddBuildToCart}
            >
              Add Build to Cart
            </Button>
          </Card>

          {/* Compatibility results */}
          {(loadingCompat || compatibility.length > 0) && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-base font-semibold text-white">Compatibility</h2>
                {loadingCompat && (
                  <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
              </div>
              <div className="space-y-2">
                {compatibility.map((result, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-lg p-2 text-xs ${
                      result.passed
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}
                  >
                    {result.passed ? (
                      <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    <span>{result.message}</span>
                  </div>
                ))}
              </div>
              {hasCriticalError && (
                <p className="mt-2 text-xs text-red-400 font-medium">
                  Resolve critical errors before adding to cart.
                </p>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
