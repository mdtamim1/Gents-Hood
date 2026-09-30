'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ProductWithRelations } from '@/types';
import { trackAddToCart } from '@/lib/analytics';

interface FeaturedProductProps {
  initialProduct?: ProductWithRelations | null;
}

export function FeaturedProduct({ initialProduct }: FeaturedProductProps) {
  const router = useRouter();
  const { addItem, setIsOpen } = useCartStore();
  const { showToast } = useToast();
  const orderBtnRef = useRef<HTMLButtonElement>(null);

  const dbColors = React.useMemo(() => {
    if (!initialProduct?.variants || initialProduct.variants.length === 0)
      return [
        { name: 'Charcoal Black', hex: '#171718' },
        { name: 'Deep Slate', hex: '#2A2E33' },
        { name: 'Muted Taupe', hex: '#5E5A54' },
      ];
    const colorMap = new Map<string, string>();
    initialProduct.variants.forEach((v) => {
      if (!colorMap.has(v.color)) colorMap.set(v.color, v.colorHex || '#171718');
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [initialProduct]);

  const dbSizes = React.useMemo(() => {
    if (!initialProduct?.variants || initialProduct.variants.length === 0)
      return ['S', 'M', 'L', 'XL', 'XXL'];
    const sizeSet = new Set<string>();
    initialProduct.variants.forEach((v) => sizeSet.add(v.size));
    return Array.from(sizeSet);
  }, [initialProduct]);

  const productImages = React.useMemo(() => {
    if (initialProduct?.images && initialProduct.images.length > 0)
      return initialProduct.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt || initialProduct.name,
      }));
    return [
      { id: '1', url: '/images/new-vibes-main.jpg', alt: 'Front Profile' },
      { id: '2', url: '/images/gallery-detail.jpg', alt: 'Fabric & Texture' },
      { id: '3', url: '/images/gallery-lifestyle.jpg', alt: 'Lifestyle Silhouette' },
    ];
  }, [initialProduct]);

  const [selectedColor, setSelectedColor] = useState<string>(dbColors[0]?.name || 'Charcoal Black');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [openSection, setOpenSection] = useState<string | null>('details');
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);

  const productName = initialProduct?.name || 'Structured City Overcoat';
  const productPrice = initialProduct?.price || 3650;
  const comparePrice = initialProduct?.comparePrice || 4500;
  const discountPercent = comparePrice
    ? Math.round(((comparePrice - productPrice) / comparePrice) * 100)
    : 0;

  const activeVariant = React.useMemo(
    () =>
      initialProduct?.variants.find((v) => v.color === selectedColor && v.size === selectedSize),
    [initialProduct, selectedColor, selectedSize]
  );
  const stockRemaining = activeVariant ? activeVariant.stock : 6;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    setMousePos({ x: ((e.clientX - left) / width) * 100, y: ((e.clientY - top) / height) * 100 });
  };
  const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 40) setActiveImageIndex((p) => (p + 1) % productImages.length);
    else if (diff < -40)
      setActiveImageIndex((p) => (p - 1 + productImages.length) % productImages.length);
    setTouchStartX(null);
  };

  const triggerRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 700);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Please select a size to add to cart.', 'danger');
      return;
    }
    addItem({
      productId: initialProduct?.id || 'nvmp',
      variantId: activeVariant?.id || `${selectedColor}-${selectedSize}`,
      name: productName,
      price: productPrice,
      image: productImages[activeImageIndex]?.url || '/images/new-vibes-main.jpg',
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    trackAddToCart({
      content_name: productName,
      content_ids: [initialProduct?.id || 'nvmp'],
      value: productPrice * quantity,
    });
    showToast('Added to your shopping bag.', 'success');
  };
  const handleOrderNow = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!selectedSize) {
      showToast('Please select a size to proceed with order.', 'danger');
      return;
    }
    triggerRipple(e);
    addItem({
      productId: initialProduct?.id || 'nvmp',
      variantId: activeVariant?.id || `${selectedColor}-${selectedSize}`,
      name: productName,
      price: productPrice,
      image: productImages[activeImageIndex]?.url || '/images/new-vibes-main.jpg',
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    trackAddToCart({
      content_name: productName,
      content_ids: [initialProduct?.id || 'nvmp'],
      value: productPrice * quantity,
    });
    setIsOpen(false);
    setTimeout(() => router.push('/checkout'), 300);
  };

  const stockPct = Math.min(100, Math.round((stockRemaining / 10) * 100));
  const isLowStock = stockRemaining <= 3;

  return (
    <section id="new-vibes" className="w-full border-b border-line bg-cream-soft py-10 sm:py-16">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-14">
        {/* ═══ SECTION HEADER: OUR SIGNATURE PRODUCT ═══ */}
        <div className="mb-8 text-center sm:mb-12">
          <div className="mb-2.5 inline-flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-gradient-to-r from-transparent to-[#4A0E17] sm:w-14" />
            <span className="font-mono text-[10px] font-black uppercase tracking-[0.35em] text-[#4A0E17] sm:text-xs">
              ◆ ICONIC MASTERPIECE · BESPOKE EDITION ◆
            </span>
            <span className="h-px w-8 bg-gradient-to-l from-transparent to-[#4A0E17] sm:w-14" />
          </div>
          <h2
            className="text-3xl font-black uppercase tracking-tight text-ink sm:text-4xl lg:text-5xl"
            style={{ fontVariant: 'small-caps', letterSpacing: '0.04em' }}
          >
            Signature Product
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="bg-ink/15 h-px w-12" />
            <span className="h-1.5 w-1.5 rotate-45 bg-[#4A0E17]" />
            <span className="bg-ink/15 h-px w-12" />
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-14">
          {/* ── LEFT: Image Gallery ── */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row lg:sticky lg:top-24 lg:col-span-6">
            <div className="flex gap-2 overflow-x-auto sm:flex-col sm:overflow-visible">
              {productImages.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View photo ${idx + 1}`}
                  className={`relative h-[68px] w-[54px] flex-shrink-0 overflow-hidden transition-all duration-300 active:scale-95 sm:h-20 sm:w-16 ${
                    activeImageIndex === idx
                      ? 'scale-105 shadow-[0_0_14px_rgba(74,14,23,0.4)] ring-2 ring-[#4A0E17] ring-offset-1'
                      : 'opacity-60 hover:opacity-90 hover:ring-1 hover:ring-[#4A0E17]/50'
                  }`}
                >
                  <Image src={img.url} alt={img.alt} fill sizes="64px" className="object-cover" />
                </button>
              ))}
            </div>
            <div
              className="relative aspect-[3/4] flex-1 cursor-crosshair touch-pan-y select-none overflow-hidden bg-cream shadow-lg"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div
                key={activeImageIndex}
                className="animate-photo-3d relative h-full w-full overflow-hidden"
              >
                <Image
                  src={productImages[activeImageIndex]?.url || '/images/new-vibes-main.jpg'}
                  alt={productImages[activeImageIndex]?.alt || productName}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 640px"
                  className={`object-cover object-center transition-transform duration-200 ${isZoomed ? 'scale-150' : 'scale-100'}`}
                  style={
                    isZoomed ? { transformOrigin: `${mousePos.x}% ${mousePos.y}%` } : undefined
                  }
                />
              </div>
              <div className="bg-ink/75 pointer-events-none absolute bottom-3 right-3 px-2.5 py-1 text-[9px] uppercase tracking-widest text-cream backdrop-blur-sm">
                {isZoomed ? 'Zoomed' : 'Hover to Zoom'}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Product Info ── */}
          <div className="flex flex-col gap-0 lg:col-span-6">
            {/* ═══ HERO TEXT BLOCK ═══ */}
            <div className="border-ink/10 border-b-2 pb-5 sm:pb-6">
              <h2 className="font-cinzel text-xl font-bold uppercase leading-snug tracking-[0.04em] text-ink sm:text-2xl lg:text-3xl">
                {productName}
              </h2>

              {/* Price */}
              <div className="mt-3.5 flex flex-wrap items-baseline gap-2.5 sm:mt-4 sm:gap-3">
                <span
                  className="font-cinzel text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                  style={{ fontFeatureSettings: '"tnum"' }}
                >
                  {formatPrice(productPrice)}
                </span>
                {comparePrice && (
                  <span className="text-ink/35 text-sm font-medium line-through sm:text-base">
                    {formatPrice(comparePrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span
                    className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream"
                    style={{
                      background: 'linear-gradient(135deg, #4A0E17, #7A1726)',
                      boxShadow: '0 2px 8px rgba(74,14,23,0.3)',
                      letterSpacing: '0.12em',
                    }}
                  >
                    SAVE {discountPercent}%
                  </span>
                )}
              </div>
            </div>

            {/* ═══ COLOR SELECTION ═══ */}
            <div className="border-ink/10 border-b py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-ink/40 text-[10px] font-black uppercase tracking-[0.3em]">
                  Color
                </span>
                <span className="text-xs font-semibold text-ink">{selectedColor}</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {dbColors.map((c) => {
                  const isActive = selectedColor === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c.name)}
                      aria-label={`Select ${c.name}`}
                      className="group flex flex-col items-center gap-1.5 transition-all duration-200"
                    >
                      <span
                        className="block h-10 w-10 transition-all duration-300"
                        style={{
                          backgroundColor: c.hex,
                          boxShadow: isActive
                            ? `0 0 0 2px #fff, 0 0 0 4px ${c.hex}, 0 8px 20px ${c.hex}60`
                            : '0 2px 8px rgba(0,0,0,0.15)',
                          transform: isActive ? 'scale(1.12) translateY(-2px)' : 'scale(1)',
                        }}
                      />
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider transition-colors ${isActive ? 'text-ink' : 'text-ink/30'}`}
                      >
                        {c.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ═══ SIZE SELECTION ═══ */}
            <div className="border-ink/10 border-b py-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-ink/40 text-[10px] font-black uppercase tracking-[0.3em]">
                  Size
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-ink/40 group flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors hover:text-[#4A0E17]"
                >
                  Measure Guide
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="h-3 w-3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>

              {/* Size chips — tall editorial style */}
              <div className="flex flex-wrap gap-2">
                {dbSizes.map((size) => {
                  const isSelected = selectedSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className="group relative overflow-hidden transition-all duration-300 active:scale-95"
                      style={{
                        minWidth: '52px',
                        height: '52px',
                        padding: '0 12px',
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: 900,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: isSelected ? '#fff' : '#1a1a1a',
                        background: isSelected
                          ? 'linear-gradient(135deg, #2a0a10 0%, #4A0E17 40%, #7f1128 100%)'
                          : 'transparent',
                        border: isSelected ? '1.5px solid #4A0E17' : '1.5px solid rgba(0,0,0,0.15)',
                        boxShadow: isSelected
                          ? '0 8px 24px rgba(74,14,23,0.45), inset 0 1px 0 rgba(255,255,255,0.12)'
                          : '0 1px 4px rgba(0,0,0,0.06)',
                        transform: isSelected ? 'translateY(-3px)' : 'translateY(0)',
                      }}
                    >
                      {/* Shine effect */}
                      <span
                        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full"
                        aria-hidden="true"
                      />
                      <span className="relative z-10">{size}</span>
                      {/* Bottom glow bar */}
                      {isSelected && (
                        <span
                          className="absolute inset-x-0 bottom-0 h-[2px]"
                          style={{
                            background: 'linear-gradient(90deg,transparent,#ff5c6e,transparent)',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              {!selectedSize && (
                <p className="text-ink/35 mt-3 text-[10px] italic">
                  ↑ Select a size to unlock checkout
                </p>
              )}
            </div>

            {/* ═══ QUANTITY + STOCK ROW ═══ */}
            <div className="border-ink/10 flex items-center justify-between gap-4 border-b py-5">
              {/* Qty stepper — minimal inline */}
              <div className="flex items-center gap-0">
                <span className="text-ink/40 mr-3 text-[10px] font-black uppercase tracking-[0.3em]">
                  Qty
                </span>
                <div className="border-ink/15 flex items-center border bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((p) => Math.max(1, p - 1))}
                    disabled={quantity <= 1}
                    className="hover:bg-ink/5 flex h-10 w-10 items-center justify-center text-lg font-light text-ink transition-colors disabled:opacity-25"
                  >
                    −
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-black text-ink">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((p) => Math.min(stockRemaining, p + 1))}
                    disabled={quantity >= stockRemaining}
                    className="hover:bg-ink/5 flex h-10 w-10 items-center justify-center text-lg font-light text-ink transition-colors disabled:opacity-25"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Stock bar */}
              <div className="flex min-w-[120px] flex-col items-end gap-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: isLowStock ? '#E50914' : '#16a34a',
                      boxShadow: isLowStock ? '0 0 6px #E50914' : '0 0 6px #16a34a',
                      animation: isLowStock ? 'hudDot 1.2s ease-in-out infinite' : 'none',
                    }}
                  />
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider ${isLowStock ? 'text-[#E50914]' : 'text-[#16a34a]'}`}
                  >
                    {stockRemaining > 0 ? `${stockRemaining} left` : 'Sold out'}
                  </span>
                </div>
                <div className="bg-ink/8 h-1 w-28 overflow-hidden rounded-full">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${stockPct}%`,
                      background: isLowStock
                        ? 'linear-gradient(90deg,#E50914,#ff5c6e)'
                        : 'linear-gradient(90deg,#15803d,#4ade80)',
                    }}
                  />
                </div>
                <p className="text-ink/25 text-[9px] font-medium uppercase tracking-wider">
                  High demand piece
                </p>
              </div>
            </div>

            {/* ═══ ACTION BUTTONS ═══ */}
            <div className="flex flex-col gap-3 py-5">
              {/* ORDER NOW — Hero CTA */}
              <button
                ref={orderBtnRef}
                type="button"
                id="btn-order-now"
                onClick={handleOrderNow}
                disabled={!selectedSize || stockRemaining === 0}
                className="group relative w-full overflow-hidden py-5 transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  background:
                    'linear-gradient(110deg, #1a0308 0%, #4A0E17 35%, #7f1128 65%, #4A0E17 100%)',
                  backgroundSize: '200% 100%',
                  boxShadow: selectedSize
                    ? '0 12px 40px rgba(74,14,23,0.5), 0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
                    : '0 4px 12px rgba(0,0,0,0.15)',
                  animation: selectedSize ? 'orderBtnShift 4s ease-in-out infinite' : 'none',
                }}
              >
                {/* Ripple */}
                {ripple && (
                  <span
                    className="pointer-events-none absolute block rounded-full bg-white/20"
                    style={{
                      width: 20,
                      height: 20,
                      left: ripple.x - 10,
                      top: ripple.y - 10,
                      animation: 'rippleOut 0.7s ease-out forwards',
                    }}
                    aria-hidden="true"
                  />
                )}
                {/* Shine */}
                <span
                  className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                  aria-hidden="true"
                />
                <span className="relative z-10 flex items-center justify-between px-6">
                  <span className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="white"
                      className="h-5 w-5 opacity-80"
                      aria-hidden="true"
                    >
                      <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                    </svg>
                    <span className="text-sm font-black uppercase tracking-[0.25em] text-white">
                      Order Now
                    </span>
                  </span>
                  <span
                    className="text-lg font-black text-white/90"
                    style={{ fontFeatureSettings: '"tnum"' }}
                  >
                    {formatPrice(productPrice * quantity)}
                  </span>
                </span>
              </button>

              {/* ADD TO CART — Ghost */}
              <button
                type="button"
                id="btn-add-to-cart"
                onClick={handleAddToCart}
                disabled={!selectedSize || stockRemaining === 0}
                className="group relative w-full overflow-hidden py-3.5 transition-all duration-300 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                style={{
                  border: '1.5px solid rgba(0,0,0,0.15)',
                  background: 'transparent',
                }}
              >
                <span
                  className="bg-ink/5 pointer-events-none absolute inset-0 translate-y-full transition-transform duration-300 group-hover:translate-y-0"
                  aria-hidden="true"
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="text-ink/60 h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.669 0-1.189-.578-1.119-1.243l1.263-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z"
                    />
                  </svg>
                  <span className="text-ink/70 text-xs font-bold uppercase tracking-[0.2em]">
                    Add to Cart
                  </span>
                </span>
              </button>

              {/* ── Trust Badges ── */}
              <div
                className="mt-1 grid grid-cols-3 gap-0 overflow-hidden"
                style={{ border: '1px solid rgba(0,0,0,0.08)' }}
              >
                {[
                  {
                    label: 'Secure Pay',
                    sub: 'SSL Encrypted',
                    svg: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Fast Delivery',
                    sub: 'Dhaka 24h',
                    svg: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                      </svg>
                    ),
                  },
                  {
                    label: 'Easy Returns',
                    sub: '7-Day Policy',
                    svg: (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                      </svg>
                    ),
                  },
                ].map(({ label, sub, svg }, i) => (
                  <div
                    key={label}
                    className="hover:bg-ink/[0.03] flex flex-col items-center gap-1.5 px-2 py-3 transition-colors"
                    style={{
                      borderRight: i < 2 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <span className="text-[#4A0E17]/70">{svg}</span>
                    <span className="text-ink/70 text-center text-[10px] font-black uppercase leading-tight tracking-wider">
                      {label}
                    </span>
                    <span className="text-ink/30 text-center text-[8px] font-medium uppercase tracking-wider">
                      {sub}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ═══ PRODUCT SPECS — Tab Panel ═══ */}
            <div className="border-ink/10 border-t pt-5">
              {/* Tab pills */}
              <div
                className="mb-0 flex gap-0 overflow-hidden"
                style={{ border: '1px solid rgba(0,0,0,0.1)' }}
              >
                {[
                  { id: 'details', label: 'Details' },
                  { id: 'fabric', label: 'Fabric' },
                  { id: 'fit', label: 'Fit' },
                ].map(({ id, label }, i) => {
                  const isActive = openSection === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setOpenSection(isActive ? null : id)}
                      className="flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300"
                      style={{
                        background: isActive
                          ? 'linear-gradient(135deg,#2a0a10,#4A0E17)'
                          : 'transparent',
                        color: isActive ? '#fff' : 'rgba(0,0,0,0.4)',
                        borderRight: i < 2 ? '1px solid rgba(0,0,0,0.1)' : 'none',
                        boxShadow: isActive ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
                        letterSpacing: '0.18em',
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Tab content panel */}
              {openSection === 'details' && (
                <div
                  className="animate-in fade-in slide-in-from-top-1 p-4 duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderTop: 'none',
                  }}
                >
                  <p className="text-ink/60 mb-4 text-xs leading-[1.9]">
                    {initialProduct?.description ||
                      'Engineered with relaxed shoulders for seamless layering. Twin deep angled exterior welt pockets and interior passport pocket with concealed storm placket.'}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Cut & Drape', value: 'Relaxed Drop Shoulder', icon: '↗' },
                      { label: 'Hardware', value: 'Concealed Storm Placket', icon: '⚙' },
                    ].map(({ label, value, icon }) => (
                      <div
                        key={label}
                        className="relative overflow-hidden p-3 transition-all duration-200 hover:bg-[#4A0E17]/5"
                        style={{
                          border: '1px solid rgba(74,14,23,0.12)',
                          background: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        <span className="absolute right-2 top-2 text-[14px] font-black text-[#4A0E17]/10">
                          {icon}
                        </span>
                        <span className="mb-1 block text-[8px] font-black uppercase tracking-[0.25em] text-[#4A0E17]/60">
                          {label}
                        </span>
                        <span className="text-[11px] font-bold leading-tight text-ink">
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {openSection === 'fabric' && (
                <div
                  className="animate-in fade-in slide-in-from-top-1 p-4 duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderTop: 'none',
                  }}
                >
                  <div className="space-y-3">
                    {[
                      {
                        label: 'Material Composition',
                        value: initialProduct?.fabric || '65% Combed Cotton, 35% Wool Blend',
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                            />
                          </svg>
                        ),
                      },
                      {
                        label: 'Garment Care',
                        value:
                          initialProduct?.care ||
                          'Dry clean recommended. Gentle cold machine wash.',
                        icon: (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-4 w-4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                            />
                          </svg>
                        ),
                      },
                    ].map(({ label, value, icon }) => (
                      <div
                        key={label}
                        className="flex items-start gap-3 p-3"
                        style={{
                          border: '1px solid rgba(74,14,23,0.12)',
                          background: 'rgba(255,255,255,0.6)',
                        }}
                      >
                        <span className="mt-0.5 flex-shrink-0 text-[#4A0E17]/60">{icon}</span>
                        <div>
                          <span className="mb-1 block text-[8px] font-black uppercase tracking-[0.25em] text-[#4A0E17]/60">
                            {label}
                          </span>
                          <p className="text-ink/75 text-[11px] font-semibold leading-relaxed">
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {openSection === 'fit' && (
                <div
                  className="animate-in fade-in slide-in-from-top-1 p-4 duration-200"
                  style={{
                    background: 'rgba(0,0,0,0.02)',
                    border: '1px solid rgba(0,0,0,0.07)',
                    borderTop: 'none',
                  }}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-ink">
                      Silhouette & Fit
                    </span>
                    <span
                      className="px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.2em]"
                      style={{
                        background: 'linear-gradient(135deg,#2a0a10,#4A0E17)',
                        color: '#fff',
                        boxShadow: '0 4px 10px rgba(74,14,23,0.3)',
                      }}
                    >
                      True to Size
                    </span>
                  </div>
                  <p className="text-ink/60 mb-4 text-xs leading-[1.9]">
                    {initialProduct?.fit ||
                      'Relaxed contemporary cut. Fits true to size with room for effortless layering.'}
                  </p>
                  {/* Mini size chart preview */}
                  <div className="overflow-hidden" style={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                    <div
                      className="grid grid-cols-5"
                      style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
                    >
                      {['S', 'M', 'L', 'XL', 'XXL'].map((s) => (
                        <div
                          key={s}
                          className="py-2 text-center"
                          style={{
                            background:
                              selectedSize === s
                                ? 'linear-gradient(135deg,#2a0a10,#4A0E17)'
                                : 'rgba(255,255,255,0.6)',
                            borderRight: '1px solid rgba(0,0,0,0.08)',
                          }}
                        >
                          <span
                            className={`text-[10px] font-black uppercase ${selectedSize === s ? 'text-white' : 'text-ink/50'}`}
                          >
                            {s}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-5">
                      {['40"', '42"', '44"', '46"', '48"'].map((chest) => (
                        <div
                          key={chest}
                          className="bg-white/40 py-2 text-center"
                          style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}
                        >
                          <span className="text-ink/40 text-[9px] font-semibold">{chest}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSizeGuideOpen(true)}
                    className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[#4A0E17] underline-offset-4 transition-colors hover:underline"
                  >
                    Full Measurement Chart
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                      className="h-3 w-3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8.25 4.5l7.5 7.5-7.5 7.5"
                      />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* /right col */}
        </div>
      </div>

      {/* Size Guide Modal */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Gents Hood Size Chart & Measurement"
        maxWidth="lg"
      >
        <div className="space-y-5 text-xs text-ink">
          <p className="text-muted">
            All measurements in inches. Measure a similar garment that fits you well.
          </p>
          <div className="overflow-x-auto border border-line">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-cream-soft text-[11px] font-semibold uppercase tracking-wider">
                  {['Size', 'Chest (in)', 'Length (in)', 'Shoulder (in)', 'Sleeve (in)'].map(
                    (h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {[
                  ['S', '40', '29.5', '18.5', '24.5'],
                  ['M', '42', '30.5', '19.2', '25.0'],
                  ['L', '44', '31.5', '20.0', '25.5'],
                  ['XL', '46', '32.5', '20.8', '26.0'],
                  ['XXL', '48', '33.5', '21.5', '26.5'],
                ].map(([size, ...vals]) => (
                  <tr key={size}>
                    <td className="p-3 font-semibold">{size}</td>
                    {vals.map((v, i) => (
                      <td key={i} className="p-3">
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setIsSizeGuideOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}
