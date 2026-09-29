'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Modal } from '@/components/ui/Modal';
import { useToast, ToastProvider } from '@/components/ui/Toast';
import { useCartStore } from '@/store/cart';

function DesignCheckContent() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const { showToast } = useToast();
  const addItem = useCartStore((state) => state.addItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const totalCartItems = useCartStore((state) => state.getTotalItems());

  const handleAddSampleItem = () => {
    addItem({
      productId: 'sample-1',
      variantId: 'var-1',
      name: 'Signature Oversized Trench Coat',
      price: 4950,
      image: '/images/sample.jpg',
      size: 'L',
      color: 'Charcoal Black',
      quantity: 1,
    });
    showToast('Added sample item to cart!', 'success');
  };

  return (
    <div className="mx-auto max-w-[1200px] space-y-16 px-6 py-12 sm:px-10 lg:px-14">
      {/* Header */}
      <div className="border-b border-line pb-8">
        <span className="label-caps text-muted">Verification Sandbox</span>
        <h1 className="heading-lg mt-2 text-ink">Design Tokens & UI Shell</h1>
        <p className="mt-2 text-sm text-muted">
          Testing all tokens, accessibility, components, and layout shell for Gents Hood.
        </p>
      </div>

      {/* Color Palette */}
      <section className="space-y-4">
        <h2 className="heading-md">1. Color Palette Tokens</h2>
        <div className="grid grid-cols-2 gap-4 font-mono text-xs sm:grid-cols-4">
          <div className="border border-ink bg-ink p-4 text-cream">
            <p className="font-bold">--ink</p>
            <p className="text-[10px] text-muted-inv">#171718 (Near-black)</p>
          </div>
          <div className="border border-line bg-cream p-4 text-ink">
            <p className="font-bold">--cream</p>
            <p className="text-[10px] text-muted">#FFFFF3 (Off-white)</p>
          </div>
          <div className="border border-line bg-cream-soft p-4 text-ink">
            <p className="font-bold">--cream-soft</p>
            <p className="text-[10px] text-muted">#F4F4E6 (Section bg)</p>
          </div>
          <div className="border border-ink bg-ink-soft p-4 text-cream">
            <p className="font-bold">--ink-soft</p>
            <p className="text-[10px] text-muted-inv">#2A2A2C (Hover ink)</p>
          </div>
          <div className="bg-success/20 border-success/40 border p-4 text-success">
            <p className="font-bold">--success</p>
            <p className="text-[10px]">#2E7D5B</p>
          </div>
          <div className="bg-danger/20 border-danger/40 border p-4 text-danger">
            <p className="font-bold">--danger</p>
            <p className="text-[10px]">#B3382C</p>
          </div>
          <div className="border border-line bg-cream p-4 text-muted">
            <p className="font-bold">--muted</p>
            <p className="text-[10px]">#6B6B66</p>
          </div>
          <div className="border border-line-inv bg-ink p-4 text-muted-inv">
            <p className="font-bold">--muted-inv</p>
            <p className="text-[10px]">#B9B9AE</p>
          </div>
        </div>
      </section>

      {/* Typography Scale */}
      <section className="space-y-4">
        <h2 className="heading-md">2. Typography Scale</h2>
        <div className="space-y-4 border border-line bg-cream-soft p-6">
          <div>
            <span className="font-mono text-[10px] uppercase text-muted">
              .label-caps (11px, tracking 0.28em)
            </span>
            <p className="label-caps text-ink">Fashion That Moves With You</p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-muted">
              .nav-link (12px, tracking 0.12em)
            </span>
            <p className="nav-link text-ink">Trending Pieces &amp; New Arrivals</p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-muted">.heading-md</span>
            <p className="heading-md text-ink">New Season Collection</p>
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase text-muted">.heading-lg</span>
            <p className="heading-lg text-ink">New Vibes 2025</p>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h2 className="heading-md">3. Buttons</h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary" size="md">
            Primary Button
          </Button>
          <Button variant="outline" size="md">
            Outline Button
          </Button>
          <Button variant="secondary-link">Explore Collection →</Button>
          <Button variant="primary" size="sm">
            Small Button
          </Button>
          <Button variant="primary" size="lg">
            Large Button
          </Button>
          <Button variant="primary" isLoading>
            Loading Button
          </Button>
          <Button variant="primary" disabled>
            Disabled Button
          </Button>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h2 className="heading-md">4. Badges</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="default">New Arrival</Badge>
          <Badge variant="outline">Limited Stock</Badge>
          <Badge variant="success">In Stock</Badge>
          <Badge variant="danger">Sold Out</Badge>
        </div>
      </section>

      {/* Form Controls */}
      <section className="space-y-4">
        <h2 className="heading-md">5. Form Inputs &amp; Select</h2>
        <div className="grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
          <Input
            label="Full Name"
            placeholder="e.g. Md Tamim"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            helperText="Enter your recipient name for delivery."
          />
          <Input
            label="Phone Number"
            placeholder="017XXXXXXXX"
            error="Please enter a valid 11-digit Bangladeshi mobile number."
          />
          <Select
            label="Select District"
            placeholder="Choose your district..."
            options={[
              { label: 'Dhaka', value: 'dhaka' },
              { label: 'Chittagong', value: 'chittagong' },
              { label: 'Sylhet', value: 'sylhet' },
            ]}
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
          />
          <Input label="Disabled State" value="Immutable Value" disabled />
        </div>
      </section>

      {/* Interactive Cart State & Live Count */}
      <section className="space-y-4">
        <h2 className="heading-md">6. Cart State (Zustand + LocalStorage)</h2>
        <div className="space-y-4 border border-line bg-cream-soft p-6">
          <p className="text-sm">
            Current Cart Items Count:{' '}
            <strong className="font-bold text-ink">{totalCartItems}</strong>
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" onClick={handleAddSampleItem}>
              + Add Sample Dress to Cart
            </Button>
            <Button variant="outline" onClick={() => clearCart()}>
              Clear Cart
            </Button>
          </div>
          <p className="text-xs text-muted">
            Check the header top right cart button to observe live reactive update.
          </p>
        </div>
      </section>

      {/* Modal & Toast Interactive */}
      <section className="space-y-4">
        <h2 className="heading-md">7. Modal &amp; Toast</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open Test Modal
          </Button>
          <Button
            variant="outline"
            onClick={() => showToast('Order placed successfully!', 'success')}
          >
            Success Toast
          </Button>
          <Button
            variant="outline"
            onClick={() => showToast('Failed to connect server.', 'danger')}
          >
            Danger Toast
          </Button>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Size Guide & Measurements"
        >
          <div className="space-y-4 text-sm">
            <p>This is an accessible modal dialog adhering to WAI-ARIA standards.</p>
            <div className="space-y-2 border border-line bg-cream-soft p-4 text-xs">
              <p>
                <strong>Chest:</strong> 40 in (M) / 42 in (L) / 44 in (XL)
              </p>
              <p>
                <strong>Length:</strong> 30 in (M) / 31 in (L) / 32 in (XL)
              </p>
            </div>
            <div className="flex justify-end pt-4">
              <Button variant="primary" size="sm" onClick={() => setModalOpen(false)}>
                Close Window
              </Button>
            </div>
          </div>
        </Modal>
      </section>

      {/* Skeletons */}
      <section className="space-y-4">
        <h2 className="heading-md">8. Skeleton Loaders</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton variant="text" />
            <Skeleton variant="text" className="w-2/3" />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function DesignCheckPage() {
  return (
    <ToastProvider>
      <DesignCheckContent />
    </ToastProvider>
  );
}
