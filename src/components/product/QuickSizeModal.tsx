'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Check } from 'lucide-react';
import { ProductWithRelations } from '@/types';
import { formatPrice } from '@/lib/utils/money';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/Toast';
import { trackAddToCart } from '@/lib/analytics';

interface QuickSizeModalProps {
  product: ProductWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

const STANDARD_SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

export function QuickSizeModal({ product, isOpen, onClose }: QuickSizeModalProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const setDirectBuyItem = useCartStore((state) => state.setDirectBuyItem);
  const setIsCartOpen = useCartStore((state) => state.setIsOpen);
  const { showToast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Extract unique colors
  const colors = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return [{ name: 'Standard', hex: '#171718' }];
    }
    const map = new Map<string, string>();
    product.variants.forEach((v) => {
      if (!map.has(v.color)) {
        map.set(v.color, v.colorHex || '#171718');
      }
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product]);

  // Extract unique sizes sorted in standard garment order
  const sizes = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return ['S', 'M', 'L', 'XL'];
    }
    const set = new Set<string>();
    product.variants.forEach((v) => set.add(v.size));
    return Array.from(set).sort((a, b) => {
      const idxA = STANDARD_SIZE_ORDER.indexOf(a);
      const idxB = STANDARD_SIZE_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [product]);

  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Reset state whenever modal opens for a new product
  useEffect(() => {
    if (isOpen) {
      const initColor = colors[0]?.name || '';
      setSelectedColor(initColor);
      const availVariant = (product.variants || []).find(
        (v) => v.color.toLowerCase() === initColor.toLowerCase() && v.stock > 0
      );
      setSelectedSize(availVariant ? availVariant.size : sizes[0] || 'M');
      setQuantity(1);
      setIsAdded(false);
    }
  }, [isOpen, colors, sizes, product.variants]);

  // Escape key handler & lock scroll
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const activeVariant = useMemo(() => {
    return product.variants?.find((v) => v.color === selectedColor && v.size === selectedSize);
  }, [product, selectedColor, selectedSize]);

  const stockRemaining = activeVariant ? activeVariant.stock : 10;
  const primaryImage = product.images[0]?.url || '/images/logo.png';

  const discountPercent = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Please select a size', 'danger');
      return;
    }

    setIsAdded(true);

    addItem({
      productId: product.id,
      variantId: activeVariant?.id,
      name: product.name,
      price: product.price,
      image: primaryImage,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });

    trackAddToCart({
      content_name: product.name,
      content_ids: [product.id],
      value: product.price * quantity,
    });

    showToast(`Added ${product.name} (${selectedSize}) to bag`, 'success');

    // Smooth timeout to let the user see the 3D gaming glow and cyber beam
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 700);
  };

  const handleOrderNow = () => {
    if (!selectedSize) {
      showToast('Please select a size', 'danger');
      return;
    }

    // Direct buy item isolated from cart
    setDirectBuyItem({
      productId: product.id,
      variantId: activeVariant?.id,
      name: product.name,
      price: product.price,
      image: primaryImage,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });

    trackAddToCart({
      content_name: product.name,
      content_ids: [product.id],
      value: product.price * quantity,
    });

    setIsCartOpen(false);
    onClose();
    router.push('/checkout?direct=true');
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-size-modal-title"
      className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4"
    >
      {/* Backdrop with dark blur */}
      <div
        className="bg-ink/75 fixed inset-0 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Card with Premium Floating Entrance Animation */}
      <div
        className="animate-modal-slide-up sm:animate-premium-modal relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-line bg-cream shadow-2xl sm:rounded-[3px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Brand Burgundy Top Hairline */}
        <div className="h-1 w-full bg-[#4A0E17]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#4A0E17]">✦</span>
            <span
              id="quick-size-modal-title"
              className="text-[11px] font-extrabold uppercase tracking-widest text-ink"
            >
              Select Size &amp; Add To Bag
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-cream-soft hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {/* Product Summary Preview */}
          <div className="border-line/60 flex items-center gap-4 rounded-[2px] border bg-cream-soft p-3">
            <div className="relative h-20 w-16 flex-shrink-0 overflow-hidden border border-line bg-cream">
              <Image
                src={primaryImage}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover object-center"
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="line-clamp-1 text-xs font-bold tracking-wider text-ink sm:text-sm">
                {product.name}
              </h4>

              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-extrabold text-ink">
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && (
                  <span className="font-mono text-xs text-muted line-through">
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-[#4A0E17] px-1.5 py-0.5 text-[9px] font-semibold text-cream">
                    -{discountPercent}%
                  </span>
                )}
              </div>

              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {stockRemaining > 0
                    ? stockRemaining <= 5
                      ? `Only ${stockRemaining} left in stock`
                      : 'In Stock · Ready to ship'
                    : 'Out of stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Size Selector */}
          <div>
            <div className="mb-2.5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                Choose Size
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4A0E17]">
                Selected: <span className="font-extrabold">{selectedSize}</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {sizes.map((size) => {
                const isSelected = selectedSize === size;
                const variantForSize = product.variants?.find(
                  (v) =>
                    v.color.toLowerCase() === selectedColor.toLowerCase() &&
                    v.size.toLowerCase() === size.toLowerCase()
                );
                const isOutOfStock = !variantForSize || variantForSize.stock <= 0;

                return (
                  <button
                    key={size}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => setSelectedSize(size)}
                    className={`group relative flex h-11 items-center justify-center overflow-hidden rounded-[2px] text-xs font-bold uppercase tracking-wider transition-all duration-300 active:scale-95 ${
                      isSelected
                        ? 'animate-gaming-glow scale-[1.03] border-2 border-[#4A0E17] bg-[#4A0E17] text-cream shadow-[0_0_16px_rgba(74,14,23,0.65)]'
                        : isOutOfStock
                          ? 'border-line/50 bg-cream/40 text-muted/40 cursor-not-allowed border line-through'
                          : 'border border-line bg-cream text-ink hover:border-[#4A0E17] hover:text-[#4A0E17]'
                    }`}
                  >
                    <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <span className="relative z-10">{size}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Multiple Colors (if applicable) */}
          {colors.length > 1 && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
                  Color: <span className="font-normal text-muted">{selectedColor}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => {
                  const isColorSelected = selectedColor === color.name;
                  return (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color.name);
                        const colorVariants = (product.variants || []).filter(
                          (v) => v.color.toLowerCase() === color.name.toLowerCase()
                        );
                        const hasCurrent = colorVariants.some(
                          (v) => v.size.toLowerCase() === selectedSize.toLowerCase() && v.stock > 0
                        );
                        if (!hasCurrent) {
                          const firstAvail = colorVariants.find((v) => v.stock > 0);
                          setSelectedSize(firstAvail ? firstAvail.size : '');
                        }
                      }}
                      className={`flex items-center gap-2 rounded-[2px] border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                        isColorSelected
                          ? 'border-[#4A0E17] bg-[#4A0E17]/10 font-bold text-[#4A0E17]'
                          : 'border-line bg-cream text-ink hover:border-ink'
                      }`}
                    >
                      <span
                        className="h-3 w-3 rounded-full border border-black/20"
                        style={{ backgroundColor: color.hex }}
                      />
                      <span>{color.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity & Stock row */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink">
              Quantity
            </span>

            <div className="flex items-center border border-line bg-cream">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="flex h-8 w-8 items-center justify-center text-xs font-bold text-ink transition-colors hover:bg-cream-soft disabled:opacity-40"
              >
                −
              </button>
              <span className="flex h-8 w-10 items-center justify-center text-xs font-bold text-ink">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(stockRemaining, quantity + 1))}
                disabled={quantity >= stockRemaining}
                className="flex h-8 w-8 items-center justify-center text-xs font-bold text-ink transition-colors hover:bg-cream-soft disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="space-y-2.5 border-t border-line bg-cream-soft p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2.5">
            {/* ADD TO BAG Button with 3D Gaming Glow & Cyber-beam */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`group/btn relative flex items-center justify-center gap-2 overflow-hidden rounded-[2px] py-3 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 ${
                isAdded
                  ? 'animate-gaming-glow bg-[#4A0E17] text-cream shadow-[0_0_24px_rgba(74,14,23,0.9)]'
                  : 'hover:animate-gaming-glow bg-[#4A0E17] text-cream shadow-[0_2px_10px_rgba(74,14,23,0.3)] hover:bg-[#380b12] hover:shadow-[0_0_20px_rgba(74,14,23,0.7)]'
              }`}
            >
              {isAdded ? (
                <span className="animate-cyber-beam pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              ) : (
                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {isAdded ? (
                  <>
                    <Check className="h-4 w-4 animate-bounce text-cream" />
                    <span>Added To Bag</span>
                  </>
                ) : (
                  <span>Add To Bag</span>
                )}
              </span>
            </button>

            {/* ORDER NOW Instant Checkout Button with Gaming Animation */}
            <button
              type="button"
              onClick={handleOrderNow}
              className="group/btn hover:animate-gaming-glow relative flex items-center justify-center overflow-hidden rounded-[2px] border border-ink bg-ink py-3 text-[11px] font-bold uppercase tracking-widest text-cream transition-all duration-300 hover:border-[#4A0E17] hover:bg-[#4A0E17] hover:shadow-[0_0_20px_rgba(74,14,23,0.7)] active:scale-95"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
              <span className="relative z-10">Order Now</span>
            </button>
          </div>

          <div className="pt-1 text-center">
            <Link
              href={`/product/${product.slug}`}
              onClick={onClose}
              className="text-[10px] font-bold uppercase tracking-wider text-muted underline underline-offset-4 transition-colors hover:text-[#4A0E17]"
            >
              View Full Product Details &amp; Size Guide →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
