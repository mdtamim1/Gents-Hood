'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Truck, CheckCircle2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils/money';
import { BANGLADESH_DISTRICTS } from '@/lib/constants/districts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { trackInitiateCheckout } from '@/lib/analytics';

export function CheckoutForm() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { showToast } = useToast();

  const [idempotencyKey, setIdempotencyKey] = useState<string>('');
  const [shippingName, setShippingName] = useState<string>('');
  const [shippingPhone, setShippingPhone] = useState<string>('');
  const [shippingDistrict, setShippingDistrict] = useState<string>('Dhaka');
  const [shippingArea, setShippingArea] = useState<string>('');
  const [shippingAddress, setShippingAddress] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const subtotal = getSubtotal();

  // Generate unique idempotency key once on component mount & fire initiate_checkout event
  useEffect(() => {
    setIdempotencyKey(`IDEM-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    if (items.length > 0) {
      trackInitiateCheckout({
        num_items: items.reduce((sum, i) => sum + i.quantity, 0),
        value: subtotal,
      });
    }
  }, [items, subtotal]);

  // Determine delivery charge dynamically based on district selection & subtotal
  const isDhaka = shippingDistrict.toLowerCase().includes('dhaka');
  const isFreeDelivery = subtotal >= 1999;
  const deliveryCharge = isFreeDelivery ? 0 : isDhaka ? 70 : 130;
  const grandTotal = subtotal + deliveryCharge;

  const districtOptions = useMemo(() => {
    return BANGLADESH_DISTRICTS.map((d) => ({
      label: d.name,
      value: d.name,
    }));
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!shippingName.trim() || shippingName.trim().length < 2) {
      newErrors.shippingName = 'Please enter your full name.';
    }

    const cleanPhone = shippingPhone.replace(/[^\d]/g, '');
    if (!/^01\d{9}$/.test(cleanPhone)) {
      newErrors.shippingPhone =
        'Please enter a valid 11-digit BD mobile number (e.g. 017XXXXXXXX).';
    }

    if (!shippingDistrict) {
      newErrors.shippingDistrict = 'Please select your delivery district.';
    }

    if (!shippingArea.trim() || shippingArea.trim().length < 2) {
      newErrors.shippingArea = 'Please enter your area, thana, or police station.';
    }

    if (!shippingAddress.trim() || shippingAddress.trim().length < 5) {
      newErrors.shippingAddress = 'Please provide your full street address or house/road details.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Your shopping bag is empty. Please add items to order.', 'danger');
      return;
    }

    if (!validateForm()) {
      showToast('Please correct the highlighted fields in the form.', 'danger');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        shippingName: shippingName.trim(),
        shippingPhone: shippingPhone.trim().replace(/[^\d]/g, ''),
        shippingDistrict,
        shippingArea: shippingArea.trim(),
        shippingAddress: shippingAddress.trim(),
        note: note.trim() || undefined,
        idempotencyKey,
        paymentMethod: 'COD',
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          size: item.size,
          color: item.color,
          quantity: item.quantity,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place your order.');
      }

      // Order created successfully!
      clearCart();
      showToast('Order confirmed! Redirecting...', 'success');
      router.push(`/order-success/${data.order.orderNo}`);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : 'An error occurred while placing order.';
      showToast(errorMsg, 'danger');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-10 sm:px-10 sm:py-16 lg:px-14">
      {/* Distraction-Free Header Banner */}
      <div className="flex items-center justify-between border-b border-line pb-8">
        <Link
          href="/"
          className="text-xl font-extrabold uppercase tracking-[0.25em] text-ink sm:text-2xl"
        >
          GENTS HOOD
        </Link>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted">
          <Lock className="h-4 w-4 text-ink" />
          <span>Secure Checkout</span>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="space-y-6 py-20 text-center">
          <p className="text-xs uppercase tracking-widest text-muted">
            There are no items in your order.
          </p>
          <Link href="/trending">
            <Button variant="primary" size="md">
              Return to Catalog
            </Button>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handlePlaceOrder}
          className="mt-10 grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16"
        >
          {/* Left Column: Delivery Form */}
          <div className="space-y-8 lg:col-span-7">
            <div>
              <span className="label-caps text-muted">Step 1 of 2</span>
              <h2 className="mt-1 text-lg font-bold uppercase tracking-wider text-ink sm:text-xl">
                Delivery Details
              </h2>
              <p className="mt-1 text-xs text-muted">
                Please enter the recipient information where the parcel will be delivered.
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Full Name *"
                placeholder="e.g. Md Tamim"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                error={errors.shippingName}
              />

              <Input
                label="Phone Number (BD Mobile) *"
                placeholder="017XXXXXXXX"
                type="tel"
                value={shippingPhone}
                onChange={(e) => setShippingPhone(e.target.value)}
                error={errors.shippingPhone}
                helperText="We will call this number to confirm delivery."
              />

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  label="District *"
                  options={districtOptions}
                  value={shippingDistrict}
                  onChange={(e) => setShippingDistrict(e.target.value)}
                  error={errors.shippingDistrict}
                />

                <Input
                  label="Area / Thana *"
                  placeholder="e.g. Gulshan / Dhanmondi"
                  value={shippingArea}
                  onChange={(e) => setShippingArea(e.target.value)}
                  error={errors.shippingArea}
                />
              </div>

              <Input
                label="Full Street Address *"
                placeholder="House #, Road #, Sector / Village, Flat / Floor"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                error={errors.shippingAddress}
              />

              <Input
                label="Order Note / Special Instructions (Optional)"
                placeholder="Any landmark, building name, or special instructions for delivery rider..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-4 border-t border-line pt-6">
              <div>
                <span className="label-caps text-muted">Step 2 of 2</span>
                <h3 className="mt-1 text-sm font-bold uppercase tracking-wider text-ink">
                  Payment Method
                </h3>
              </div>

              <div className="flex items-start justify-between border-2 border-ink bg-cream-soft p-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-ink" />
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                  <p className="pl-6 text-[11px] leading-relaxed text-muted">
                    Pay in cash directly to the courier agent upon inspecting the package at your
                    doorstep.
                  </p>
                </div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-ink">
                  Recommended
                </span>
              </div>
            </div>

            {/* Trust Points */}
            <div className="grid grid-cols-1 gap-4 border-t border-line pt-4 text-xs text-muted sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-ink" />
                <span>100% Genuine Fabric Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-ink" />
                <span>Express Doorstep Dispatch</span>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Place Order */}
          <div className="space-y-6 border border-line bg-cream-soft p-6 sm:p-8 lg:sticky lg:top-12 lg:col-span-5">
            <h3 className="border-b border-line pb-4 text-sm font-bold uppercase tracking-wider text-ink">
              Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
            </h3>

            {/* Items List */}
            <div className="max-h-72 divide-y divide-line overflow-y-auto pr-1">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId || 'def'}`}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative h-14 w-12 flex-shrink-0 overflow-hidden border border-line bg-cream">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold uppercase tracking-wider text-ink">
                        {item.name}
                      </p>
                      <p className="text-[10px] uppercase text-muted">
                        {item.size && `Size: ${item.size}`} {item.color && `• ${item.color}`} • Qty:{' '}
                        {item.quantity}
                      </p>
                    </div>
                  </div>
                  <span className="flex-shrink-0 font-mono text-xs font-medium text-ink">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-2.5 border-t border-line pt-4 text-xs uppercase tracking-wider text-ink">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted">
                  Delivery Fee ({isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'})
                </span>
                <span className={isFreeDelivery ? 'font-semibold text-success' : ''}>
                  {isFreeDelivery ? 'FREE' : formatPrice(deliveryCharge)}
                </span>
              </div>

              {isFreeDelivery && (
                <p className="text-[10px] tracking-wide text-success">
                  ✓ Orders above ৳1,999 receive Free Delivery.
                </p>
              )}
            </div>

            {/* Grand Total */}
            <div className="flex items-baseline justify-between border-t border-line pt-4 text-sm font-bold uppercase tracking-wider">
              <span>Total Payable</span>
              <span className="text-xl font-extrabold text-ink">{formatPrice(grandTotal)}</span>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              className="w-full py-4 text-xs tracking-looser"
            >
              Place Order — {formatPrice(grandTotal)}
            </Button>

            <p className="text-center text-[10px] uppercase tracking-widest text-muted">
              By placing your order, you agree to our terms &amp; conditions.
            </p>
          </div>
        </form>
      )}
    </div>
  );
}
