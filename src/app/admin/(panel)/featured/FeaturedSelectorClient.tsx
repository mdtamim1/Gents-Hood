'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, Check, Search, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  sku?: string | null;
  isTrending: boolean;
  status: string;
  images: { url: string; alt?: string | null }[];
  variants: { size: string; color: string; stock: number }[];
}

interface FeaturedSelectorClientProps {
  initialProducts: ProductItem[];
  currentFeaturedId: string | null;
}

export function FeaturedSelectorClient({
  initialProducts,
  currentFeaturedId,
}: FeaturedSelectorClientProps) {
  const [activeFeaturedId, setActiveFeaturedId] = useState<string | null>(currentFeaturedId);
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const filteredProducts = initialProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
  );

  const currentProduct = initialProducts.find((p) => p.id === activeFeaturedId);

  const handleSetFeatured = async (productId: string, productName: string) => {
    setUpdatingId(productId);
    try {
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update featured product');
      }

      setActiveFeaturedId(productId);
      showToast(`"${productName}" is now the homepage main product!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error setting featured product';
      showToast(msg, 'danger');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Active Banner */}
      <div className="border-muted/30 border bg-[#1e1e20] p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-5">
            <div className="border-muted/30 bg-muted/10 relative h-24 w-20 shrink-0 overflow-hidden rounded-[1px] border">
              {currentProduct?.images[0]?.url ? (
                <Image
                  src={currentProduct.images[0].url}
                  alt={currentProduct.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted">
                  No Image
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                  Currently Live On Homepage
                </span>
              </div>
              <h2 className="heading-md mt-1 text-cream">
                {currentProduct ? currentProduct.name : 'No dress selected'}
              </h2>
              <p className="mt-1 text-xs text-muted">
                {currentProduct
                  ? `${formatPrice(currentProduct.price)} · ${currentProduct.variants.reduce(
                      (acc, v) => acc + v.stock,
                      0
                    )} units available across ${currentProduct.variants.length} sizes`
                  : 'Select an active item below to set as the primary landing dress.'}
              </p>
            </div>
          </div>

          <Link
            href="/"
            target="_blank"
            className="border-muted/40 bg-muted/10 hover:bg-muted/20 flex items-center justify-center gap-2 rounded-[1px] border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors"
          >
            Preview Live Landing
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Product Selection List */}
      <div className="space-y-4">
        <div className="border-muted/20 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="heading-sm text-cream">Select New Main Product</h3>
            <p className="text-xs text-muted">
              Clicking &quot;Set as Main Dress&quot; instantly updates the Hero cutout, NEW VIBES
              section, and homepage buy box.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search dress catalog..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-muted/30 placeholder:text-muted/50 w-full rounded-[1px] border bg-ink px-4 py-2 pl-9 text-xs text-cream focus:border-cream focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => {
            const isSelected = product.id === activeFeaturedId;
            const isBusy = updatingId === product.id;

            return (
              <div
                key={product.id}
                className={`relative flex flex-col justify-between border p-5 transition-all ${
                  isSelected
                    ? 'border-amber-400/80 bg-amber-500/5'
                    : 'border-muted/20 hover:border-muted/40 bg-[#1a1a1c]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="border-muted/20 bg-muted/10 relative h-20 w-16 shrink-0 overflow-hidden rounded-[1px] border">
                    {product.images[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted">
                        No Img
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-cream">{product.name}</p>
                    <p className="mt-1 font-mono text-xs font-semibold text-cream">
                      {formatPrice(product.price)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {product.variants.length} variant(s) · SKU: {product.sku || 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="border-muted/10 mt-5 border-t pt-4">
                  {isSelected ? (
                    <div className="flex items-center justify-center gap-1.5 rounded-[1px] bg-amber-500/20 py-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                      <Check className="h-4 w-4" />
                      Active Main Dress
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isBusy}
                      onClick={() => handleSetFeatured(product.id, product.name)}
                      className="border-muted/40 w-full py-2 text-xs uppercase tracking-wider text-cream hover:bg-cream hover:text-ink"
                    >
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                      Set as Main Dress
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
