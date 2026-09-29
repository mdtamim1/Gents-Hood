'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProductWithRelations } from '@/types';
import { formatPrice } from '@/lib/utils/money';
import { useCartStore } from '@/store/cart';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface ProductDetailsProps {
  product: ProductWithRelations;
}

export function ProductDetails({ product }: ProductDetailsProps) {
  const router = useRouter();
  const addItem = useCartStore((state) => state.addItem);
  const setIsCartOpen = useCartStore((state) => state.setIsOpen);
  const { showToast } = useToast();

  // Extract unique colors
  const colors = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return [{ name: 'Standard Charcoal', hex: '#171718' }];
    }
    const map = new Map<string, string>();
    product.variants.forEach((v) => {
      if (!map.has(v.color)) {
        map.set(v.color, v.colorHex || '#171718');
      }
    });
    return Array.from(map.entries()).map(([name, hex]) => ({ name, hex }));
  }, [product]);

  // Extract unique sizes
  const sizes = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return ['S', 'M', 'L', 'XL'];
    }
    const set = new Set<string>();
    product.variants.forEach((v) => set.add(v.size));
    return Array.from(set);
  }, [product]);

  const [selectedColor, setSelectedColor] = useState<string>(colors[0]?.name || '');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'desc' | 'fabric' | 'fit' | 'delivery'>('desc');
  const [isZoomed, setIsZoomed] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Selected variant for stock check
  const activeVariant = useMemo(() => {
    return product.variants.find((v) => v.color === selectedColor && v.size === selectedSize);
  }, [product, selectedColor, selectedSize]);

  const stockRemaining = activeVariant ? activeVariant.stock : 10;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      showToast('Please select a size to proceed', 'danger');
      return;
    }

    const currentImage =
      product.images[activeImageIndex]?.url ||
      product.images[0]?.url ||
      '/images/gallery-front.jpg';

    addItem({
      productId: product.id,
      variantId: activeVariant?.id,
      name: product.name,
      price: product.price,
      image: currentImage,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });

    showToast(`Added ${product.name} to bag`, 'success');
  };

  const handleOrderNow = () => {
    if (!selectedSize) {
      showToast('Please select a size to proceed', 'danger');
      return;
    }

    const currentImage =
      product.images[activeImageIndex]?.url ||
      product.images[0]?.url ||
      '/images/gallery-front.jpg';

    addItem({
      productId: product.id,
      variantId: activeVariant?.id,
      name: product.name,
      price: product.price,
      image: currentImage,
      size: selectedSize,
      color: selectedColor,
      quantity,
    });

    setIsCartOpen(false);
    router.push('/checkout');
  };

  const images =
    product.images.length > 0
      ? product.images
      : [{ id: '1', url: '/images/gallery-front.jpg', alt: product.name }];
  const discount = product.comparePrice
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <>
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-16">
        {/* Left Sticky Gallery (Vertical Thumbnails + Main Zoom Canvas) */}
        <div className="flex flex-col-reverse gap-4 sm:flex-row lg:sticky lg:top-24 lg:col-span-7">
          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 sm:flex-col sm:overflow-visible sm:pb-0">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View perspective ${idx + 1}`}
                  className={`relative h-20 w-16 flex-shrink-0 overflow-hidden border-2 bg-cream transition-all sm:h-24 sm:w-20 ${
                    activeImageIndex === idx
                      ? 'border-ink shadow-md'
                      : 'border-line opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={img.alt || product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Main Display Canvas */}
          <div
            className="relative aspect-[3/4] flex-1 cursor-crosshair select-none overflow-hidden border border-line bg-cream"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMove}
          >
            <Image
              src={images[activeImageIndex]?.url || images[0].url}
              alt={images[activeImageIndex]?.alt || product.name}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 720px"
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

            <div className="bg-ink/75 pointer-events-none absolute bottom-3 right-3 hidden px-2.5 py-1 text-[9px] uppercase tracking-looser text-cream backdrop-blur-[2px] sm:block">
              {isZoomed ? 'Zoomed' : 'Hover to Zoom'}
            </div>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="flex flex-col space-y-6 lg:col-span-5">
          {/* Breadcrumbs */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted"
          >
            <Link href="/" className="hover:text-ink">
              Home
            </Link>
            <span>/</span>
            <Link href="/trending" className="hover:text-ink">
              Collection
            </Link>
            <span>/</span>
            <span className="line-clamp-1 font-semibold text-ink">{product.name}</span>
          </nav>

          {/* Title & Price */}
          <div>
            <span className="label-caps text-muted">Signature Cut</span>
            <h1 className="mt-1 text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-3xl">
              {product.name}
            </h1>

            <div className="mt-3 flex items-center gap-3">
              <span className="text-2xl font-extrabold text-ink">{formatPrice(product.price)}</span>
              {product.comparePrice && (
                <span className="font-mono text-sm text-muted line-through">
                  {formatPrice(product.comparePrice)}
                </span>
              )}
              {discount > 0 && (
                <Badge variant="default" size="sm">
                  Save {discount}%
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <p className="text-xs leading-relaxed text-muted sm:text-sm">
            {product.description || product.shortDescription}
          </p>

          {/* Color Selector */}
          <div className="space-y-2.5 border-t border-line pt-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink">
              Color: <span className="font-normal text-muted">{selectedColor}</span>
            </div>
            <div className="flex items-center gap-3">
              {colors.map((c) => (
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
          <div className="space-y-2.5 border-t border-line pt-2">
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
              {sizes.map((size) => (
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
                * Please choose your size to enable purchase
              </p>
            )}
          </div>

          {/* Quantity & Stock Status */}
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
                ● {stockRemaining > 0 ? `Only ${stockRemaining} pieces left` : 'Sold out'}
              </span>
              <p className="text-[10px] tracking-wide text-muted">High velocity demand</p>
            </div>
          </div>

          {/* Desktop Purchase Action Buttons */}
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

          {/* Service Guarantees */}
          <div className="space-y-2 border-t border-line pt-4 text-[11px] text-muted">
            <p>
              🚚 <strong>Cash on Delivery:</strong> Available nationwide (Dhaka ৳70, Outside ৳130).
            </p>
            <p>
              🔄 <strong>Exchange Guarantee:</strong> 7 days hassle-free doorstep size exchange.
            </p>
          </div>

          {/* Detailed Accordion Tabs */}
          <div className="border-t border-line pt-4">
            <div className="flex border-b border-line text-xs font-semibold uppercase tracking-wider">
              <button
                type="button"
                onClick={() => setActiveTab('desc')}
                className={`mr-6 border-b-2 pb-2 transition-colors ${
                  activeTab === 'desc' ? 'border-ink text-ink' : 'border-transparent text-muted'
                }`}
              >
                Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fabric')}
                className={`mr-6 border-b-2 pb-2 transition-colors ${
                  activeTab === 'fabric' ? 'border-ink text-ink' : 'border-transparent text-muted'
                }`}
              >
                Fabric &amp; Care
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('fit')}
                className={`mr-6 border-b-2 pb-2 transition-colors ${
                  activeTab === 'fit' ? 'border-ink text-ink' : 'border-transparent text-muted'
                }`}
              >
                Fit &amp; Size
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('delivery')}
                className={`border-b-2 pb-2 transition-colors ${
                  activeTab === 'delivery' ? 'border-ink text-ink' : 'border-transparent text-muted'
                }`}
              >
                Shipping &amp; COD
              </button>
            </div>

            <div className="pt-3 text-xs leading-relaxed text-muted">
              {activeTab === 'desc' && (
                <p>
                  {product.description ||
                    'Precision crafted with attention to drape, proportion, and longevity.'}
                </p>
              )}
              {activeTab === 'fabric' && (
                <div className="space-y-1">
                  <p>
                    <strong>Fabric:</strong>{' '}
                    {product.fabric || '100% Premium Heavyweight Cotton / Blend'}
                  </p>
                  <p>
                    <strong>Care:</strong> {product.care || 'Gentle cold wash with like colors.'}
                  </p>
                </div>
              )}
              {activeTab === 'fit' && (
                <p>{product.fit || 'Relaxed contemporary fit. True to size.'}</p>
              )}
              {activeTab === 'delivery' && (
                <p>
                  Delivery time: Inside Dhaka within 24-48 hours. Outside Dhaka within 48-72 hours.
                  Cash on delivery available nationwide.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar for Mobile Viewport */}
      <div className="bg-cream/95 fixed inset-x-0 bottom-0 z-40 border-t border-line p-3 shadow-lg backdrop-blur-[4px] sm:hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <span className="block text-xs font-bold text-ink">{formatPrice(product.price)}</span>
            <span className="line-clamp-1 block text-[10px] text-muted">
              {selectedSize ? `Size: ${selectedSize}` : 'Choose size above'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              disabled={!selectedSize || stockRemaining === 0}
              className="px-3 py-2 text-[10px]"
            >
              Add To Cart
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOrderNow}
              disabled={!selectedSize || stockRemaining === 0}
              className="px-4 py-2 text-[10px]"
            >
              Order Now
            </Button>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      <Modal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        title="Size Measurement Guide"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-ink">
          <p className="text-muted">
            Measurements in inches. Measure a similar garment flat for optimal sizing.
          </p>
          <div className="overflow-x-auto border border-line">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-line bg-cream-soft text-[11px] font-semibold uppercase tracking-wider">
                  <th className="p-3">Size</th>
                  <th className="p-3">Chest (in)</th>
                  <th className="p-3">Length (in)</th>
                  <th className="p-3">Shoulder (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="p-3 font-semibold">S</td>
                  <td className="p-3">40</td>
                  <td className="p-3">29.5</td>
                  <td className="p-3">18.5</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">M</td>
                  <td className="p-3">42</td>
                  <td className="p-3">30.5</td>
                  <td className="p-3">19.2</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">L</td>
                  <td className="p-3">44</td>
                  <td className="p-3">31.5</td>
                  <td className="p-3">20.0</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold">XL</td>
                  <td className="p-3">46</td>
                  <td className="p-3">32.5</td>
                  <td className="p-3">20.8</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex justify-end pt-2">
            <Button variant="primary" size="sm" onClick={() => setIsSizeGuideOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
