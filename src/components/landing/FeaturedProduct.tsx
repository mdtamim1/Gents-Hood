'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { ProductWithRelations } from '@/types';
import { trackAddToCart } from '@/lib/analytics';

interface FeaturedProductProps {
  initialProduct?: ProductWithRelations | null;
  freeDeliveryMin?: number;
}

export function FeaturedProduct({ initialProduct, freeDeliveryMin = 1999 }: FeaturedProductProps) {
  const router = useRouter();
  const { addItem, setIsOpen } = useCartStore();
  const { showToast } = useToast();

  // Extract colors from database variants or fallback
  const dbColors = React.useMemo(() => {
    if (!initialProduct?.variants || initialProduct.variants.length === 0) {
      return [
        { name: 'Charcoal Black', hex: '#171718' },
        { name: 'Deep Slate', hex: '#2A2E33' },
        { name: 'Muted Taupe', hex: '#5E5A54' },
      ];
    }
    const colorMap = new Map<string, string>();
    initialProduct.variants.forEach((v) => {
      if (!colorMap.has(v.color)) {
        colorMap.set(v.color, v.colorHex || '#171718');
      }
    });
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }));
  }, [initialProduct]);

  // Extract sizes from database variants or fallback
  const dbSizes = React.useMemo(() => {
    if (!initialProduct?.variants || initialProduct.variants.length === 0) {
      return ['S', 'M', 'L', 'XL', 'XXL'];
    }
    const sizeSet = new Set<string>();
    initialProduct.variants.forEach((v) => sizeSet.add(v.size));
    return Array.from(sizeSet);
  }, [initialProduct]);

  // Images from database or fallback
  const productImages = React.useMemo(() => {
    if (initialProduct?.images && initialProduct.images.length > 0) {
      return initialProduct.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt || initialProduct.name,
      }));
    }
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
  const [activeTab, setActiveTab] = useState<'details' | 'fabric' | 'fit' | 'delivery'>('details');
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const productName = initialProduct?.name || 'Structured City Overcoat';
  const productPrice = initialProduct?.price || 3650;
  const comparePrice = initialProduct?.comparePrice || 4500;
  const discountPercent = comparePrice
    ? Math.round(((comparePrice - productPrice) / comparePrice) * 100)
    : 0;

  // Selected variant for stock check
  const activeVariant = React.useMemo(() => {
    return initialProduct?.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    );
  }, [initialProduct, selectedColor, selectedSize]);

  const stockRemaining = activeVariant ? activeVariant.stock : 6;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Please select a size to add to cart.', 'danger');
      return;
    }

    addItem({
      productId: initialProduct?.id || 'new-vibes-main-product',
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
      content_ids: [initialProduct?.id || 'new-vibes-main-product'],
      value: productPrice * quantity,
    });

    showToast('Added to your shopping bag.', 'success');
  };

  const handleOrderNow = () => {
    if (!selectedSize) {
      showToast('Please select a size to proceed with order.', 'danger');
      return;
    }

    addItem({
      productId: initialProduct?.id || 'new-vibes-main-product',
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
      content_ids: [initialProduct?.id || 'new-vibes-main-product'],
      value: productPrice * quantity,
    });

    setIsOpen(false);
    router.push('/checkout');
  };

  return (
    <section id="new-vibes" className="w-full border-b border-line bg-cream-soft py-16 sm:py-24">
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left Column: Product Information & Purchase Form */}
          <div className="flex flex-col space-y-8 lg:col-span-6">
            <div>
              <span className="label-caps text-muted">New Season</span>
              <h2 className="heading-lg mt-1 text-ink">NEW VIBES</h2>
              <div className="mt-3 flex items-center gap-3">
                <h3 className="text-xl font-bold uppercase tracking-tight text-ink sm:text-2xl">
                  {productName}
                </h3>
              </div>

              {/* Price & Rating */}
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-extrabold text-ink">
                    {formatPrice(productPrice)}
                  </span>
                  {comparePrice && (
                    <span className="text-base text-muted line-through">
                      {formatPrice(comparePrice)}
                    </span>
                  )}
                </div>
                {discountPercent > 0 && (
                  <Badge variant="default" size="md">
                    Save {discountPercent}%
                  </Badge>
                )}
                <span className="ml-auto text-xs font-medium uppercase tracking-wider text-muted">
                  ★ 4.9 (42 verified reviews)
                </span>
              </div>

              <p className="mt-5 text-xs leading-relaxed text-muted sm:text-sm">
                {initialProduct?.shortDescription ||
                  'Designed for tailored modern versatility. Engineered from custom heavy-weight milled twill featuring relaxed drop shoulders, deep welt pockets, and an architectural storm collar.'}
              </p>
            </div>

            {/* Color Swatches */}
            <div className="space-y-3 border-t border-line pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-ink">
                  Color: <span className="font-normal text-muted">{selectedColor}</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                {dbColors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c.name)}
                    aria-label={`Select color ${c.name}`}
                    className={`relative h-8 w-8 rounded-full border-2 p-0.5 transition-all ${
                      selectedColor === c.name
                        ? 'scale-110 border-ink'
                        : 'border-transparent hover:scale-105'
                    }`}
                  >
                    <span
                      className="block h-full w-full rounded-full border border-line"
                      style={{ backgroundColor: c.hex }}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="space-y-3 border-t border-line pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold uppercase tracking-wider text-ink">
                  Select Size {selectedSize && <span className="text-muted">({selectedSize})</span>}
                </span>
                <button
                  type="button"
                  onClick={() => setIsSizeGuideOpen(true)}
                  className="text-[11px] uppercase tracking-looser text-ink underline underline-offset-4 hover:text-muted"
                >
                  Size Guide
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2.5">
                {dbSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`h-11 rounded-[1px] border text-xs font-semibold uppercase tracking-wider transition-all ${
                      selectedSize === size
                        ? 'border-ink bg-ink text-cream'
                        : 'border-line bg-transparent text-ink hover:border-ink'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {!selectedSize && (
                <p className="text-[11px] italic text-muted">
                  * Select a size to enable bag and instant checkout
                </p>
              )}
            </div>

            {/* Quantity Selector & Stock Indicator */}
            <div className="flex items-center justify-between border-t border-line pt-2">
              <div className="space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-ink">
                  Quantity
                </span>
                <div className="flex items-center border border-line bg-cream">
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                    className="px-3.5 py-2 text-sm text-ink hover:bg-cream-soft disabled:opacity-30"
                  >
                    −
                  </button>
                  <span className="px-4 font-mono text-xs font-medium text-ink">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((prev) => Math.min(stockRemaining, prev + 1))}
                    disabled={quantity >= stockRemaining}
                    className="px-3.5 py-2 text-sm text-ink hover:bg-cream-soft disabled:opacity-30"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="text-right">
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-danger">
                  ● {stockRemaining > 0 ? `Only ${stockRemaining} left in stock` : 'Out of stock'}
                </span>
                <p className="text-[10px] tracking-wide text-muted">High demand piece</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
              <Button
                variant="outline"
                size="lg"
                onClick={handleAddToCart}
                disabled={!selectedSize || stockRemaining === 0}
                className="w-full"
              >
                Add To Cart
              </Button>
              <Button
                variant="primary"
                size="lg"
                onClick={handleOrderNow}
                disabled={!selectedSize || stockRemaining === 0}
                className="w-full"
              >
                Order Now
              </Button>
            </div>

            {/* Trust Assurances */}
            <div className="space-y-2 border-t border-line pt-4 text-[11px] tracking-wide text-muted">
              <p className="flex items-center gap-2">
                <span>🚚</span>
                <span>
                  <strong>Fast Nationwide Delivery</strong> • Inside Dhaka 24-48 hrs, Outside Dhaka
                  48-72 hrs
                </span>
              </p>
              <p className="flex items-center gap-2">
                <span>🔄</span>
                <span>
                  <strong>7-Day Easy Exchange</strong> • Hassle-free size replacement at your
                  doorstep
                </span>
              </p>
            </div>

            {/* Tabs / Accordion Details */}
            <div className="border-t border-line pt-6">
              <div className="flex border-b border-line text-xs font-semibold uppercase tracking-wider">
                <button
                  type="button"
                  onClick={() => setActiveTab('details')}
                  className={`mr-6 border-b-2 pb-2.5 transition-colors ${
                    activeTab === 'details'
                      ? 'border-ink text-ink'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  Description
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('fabric')}
                  className={`mr-6 border-b-2 pb-2.5 transition-colors ${
                    activeTab === 'fabric'
                      ? 'border-ink text-ink'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  Fabric &amp; Care
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('fit')}
                  className={`mr-6 border-b-2 pb-2.5 transition-colors ${
                    activeTab === 'fit'
                      ? 'border-ink text-ink'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  Fit &amp; Size
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('delivery')}
                  className={`border-b-2 pb-2.5 transition-colors ${
                    activeTab === 'delivery'
                      ? 'border-ink text-ink'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  Delivery &amp; COD
                </button>
              </div>

              <div className="pt-4 text-xs leading-relaxed text-muted">
                {activeTab === 'details' && (
                  <p>
                    {initialProduct?.description ||
                      'Engineered with relaxed shoulders for seamless layering. Twin deep angled exterior welt pockets and interior passport pocket with concealed storm placket.'}
                  </p>
                )}
                {activeTab === 'fabric' && (
                  <div className="space-y-1">
                    <p>
                      <strong>Fabric:</strong>{' '}
                      {initialProduct?.fabric || '65% Combed Cotton, 35% Wool Blend'}
                    </p>
                    <p>
                      <strong>Care:</strong> {initialProduct?.care || 'Dry clean recommended.'}
                    </p>
                  </div>
                )}
                {activeTab === 'fit' && (
                  <p>{initialProduct?.fit || 'Relaxed contemporary cut. Fits true to size.'}</p>
                )}
                {activeTab === 'delivery' && (
                  <p>
                    Cash on Delivery available all across Bangladesh. Orders above ৳
                    {freeDeliveryMin} qualify for Free Delivery automatically.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Image Gallery with Hover Zoom */}
          <div className="flex flex-col-reverse gap-4 sm:flex-row lg:sticky lg:top-24 lg:col-span-6">
            {/* Thumbnail Selectors */}
            <div className="flex justify-center gap-3 sm:flex-col sm:justify-start">
              {productImages.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View photo ${idx + 1}`}
                  className={`relative h-20 w-16 flex-shrink-0 overflow-hidden border-2 bg-cream transition-all sm:h-24 sm:w-20 ${
                    activeImageIndex === idx
                      ? 'border-ink shadow-md'
                      : 'border-line opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img.url} alt={img.alt} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>

            {/* Main Big Image Canvas */}
            <div
              className="relative aspect-[3/4] flex-1 cursor-crosshair select-none overflow-hidden border border-line bg-cream"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={productImages[activeImageIndex]?.url || '/images/new-vibes-main.jpg'}
                alt={productImages[activeImageIndex]?.alt || productName}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 640px"
                className={`object-cover object-center transition-transform duration-200 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                      }
                    : undefined
                }
              />
              <div className="bg-ink/75 pointer-events-none absolute bottom-3 right-3 px-2.5 py-1 text-[9px] uppercase tracking-looser text-cream backdrop-blur-[2px]">
                {isZoomed ? 'Zoomed' : 'Hover to Zoom'}
              </div>
            </div>
          </div>
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
            All measurements are provided in inches. For the best fit, measure a similar garment
            that fits you well.
          </p>
          <div className="overflow-x-auto border border-line">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-cream-soft text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-3">Size</th>
                  <th className="p-3">Chest (in)</th>
                  <th className="p-3">Length (in)</th>
                  <th className="p-3">Shoulder (in)</th>
                  <th className="p-3">Sleeve (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="p-3 font-semibold">S</td>
                  <td className="p-3">40</td>
                  <td className="p-3">29.5</td>
                  <td className="p-3">18.5</td>
                  <td className="p-3">24.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">M</td>
                  <td className="p-3">42</td>
                  <td className="p-3">30.5</td>
                  <td className="p-3">19.2</td>
                  <td className="p-3">25.0</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">L</td>
                  <td className="p-3">44</td>
                  <td className="p-3">31.5</td>
                  <td className="p-3">20.0</td>
                  <td className="p-3">25.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">XL</td>
                  <td className="p-3">46</td>
                  <td className="p-3">32.5</td>
                  <td className="p-3">20.8</td>
                  <td className="p-3">26.0</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">XXL</td>
                  <td className="p-3">48</td>
                  <td className="p-3">33.5</td>
                  <td className="p-3">21.5</td>
                  <td className="p-3">26.5</td>
                </tr>
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
