'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Truck,
  CheckCircle2,
  RotateCcw,
  PackageCheck,
  Pencil,
  ArrowRight,
  ArrowLeft,
  Check,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatPrice } from '@/lib/utils/money';
import { BD_DISTRICTS, getUpazilas } from '@/lib/constants/bd-locations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { trackInitiateCheckout } from '@/lib/analytics';

/**
 * Normalizes all Bangladeshi mobile number formats (+8801..., 8801..., 01..., spaces/dashes)
 * to a standardized 11-digit format (01XXXXXXXXX) and formats it for presentation.
 */
function normalizeBdPhone(phone: string): {
  isValid: boolean;
  normalized: string;
  formatted: string;
} {
  const digits = phone.replace(/[^\d]/g, '');
  let normalized = digits;

  if (digits.startsWith('8801') && digits.length === 13) {
    normalized = digits.slice(2);
  } else if (digits.startsWith('880') && digits.length === 13) {
    normalized = digits.slice(2);
  } else if (digits.startsWith('1') && digits.length === 10) {
    normalized = '0' + digits;
  }

  const isValid = /^01[3-9]\d{8}$/.test(normalized);
  const formatted = isValid ? `+880 ${normalized.slice(1, 5)}-${normalized.slice(5)}` : phone;

  return { isValid, normalized, formatted };
}

const STORAGE_KEY = 'gh_checkout_data_v4';

export function CheckoutForm() {
  const router = useRouter();
  const { items, getSubtotal, clearCart } = useCartStore();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState<'details' | 'payment'>('details');
  const [showDeliveryDetails, setShowDeliveryDetails] = useState<boolean>(false);
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

  // Load saved form values from sessionStorage if available
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.shippingName) setShippingName(parsed.shippingName);
        if (parsed.shippingPhone) setShippingPhone(parsed.shippingPhone);
        if (parsed.shippingDistrict) setShippingDistrict(parsed.shippingDistrict);
        if (parsed.shippingArea) setShippingArea(parsed.shippingArea);
        if (parsed.shippingAddress) setShippingAddress(parsed.shippingAddress);
        if (parsed.note) setNote(parsed.note);

        const params = new URLSearchParams(window.location.search);
        if (params.get('step') === 'payment' && parsed.shippingName && parsed.shippingPhone) {
          setCurrentStep('payment');
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Listen to popstate (browser back/forward button)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      if (params.get('step') === 'payment') {
        setCurrentStep('payment');
      } else {
        setCurrentStep('details');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Determine delivery charge dynamically based on district selection
  const isDhaka = shippingDistrict.toLowerCase().includes('dhaka');
  const deliveryCharge = isDhaka ? 70 : 130;
  const grandTotal = subtotal + deliveryCharge;

  const districtOptions = useMemo(() => {
    return BD_DISTRICTS.map((d) => ({ label: d, value: d }));
  }, []);

  const thanaOptions = useMemo(() => {
    return getUpazilas(shippingDistrict).map((u) => ({ label: u, value: u }));
  }, [shippingDistrict]);

  // Phone validation status
  const phoneValidation = useMemo(() => {
    return normalizeBdPhone(shippingPhone);
  }, [shippingPhone]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!shippingName.trim() || shippingName.trim().length < 2) {
      newErrors.shippingName = 'Please enter your full name.';
    }

    if (!phoneValidation.isValid) {
      newErrors.shippingPhone =
        'Please enter a valid Bangladeshi mobile number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX).';
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

  const saveToStorage = () => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          shippingName,
          shippingPhone,
          shippingDistrict,
          shippingArea,
          shippingAddress,
          note,
        })
      );
    } catch {
      // Ignore
    }
  };

  // Step 1 -> Step 2
  const handleContinueToPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Your shopping bag is empty. Please add items to order.', 'danger');
      return;
    }

    if (!validateForm()) {
      showToast('Please fill in all required delivery fields.', 'danger');
      return;
    }

    saveToStorage();
    setCurrentStep('payment');
    if (typeof window !== 'undefined') {
      window.history.pushState({ step: 'payment' }, '', '/checkout?step=payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 2 -> Step 1 (Edit Information)
  const handleEditDetails = () => {
    setCurrentStep('details');
    if (typeof window !== 'undefined') {
      window.history.pushState({ step: 'details' }, '', '/checkout');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Confirm Order in Step 2
  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (items.length === 0) {
      showToast('Your shopping bag is empty. Please add items to order.', 'danger');
      return;
    }

    if (!validateForm()) {
      showToast('Please complete your delivery details.', 'danger');
      setCurrentStep('details');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        shippingName: shippingName.trim(),
        shippingPhone: phoneValidation.normalized,
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
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {}
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

  // Empty cart view
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-[1280px] px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-widest text-muted">
          There are no items in your order.
        </p>
        <Link href="/trending" className="mt-6 inline-block">
          <Button variant="primary" size="md">
            Return to Catalog
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-8 sm:px-10 sm:py-12 lg:px-14">
      {/* 
        ================================================================
        STEP 1: DELIVERY INFORMATION
        (Clean, centered form. Order Summary is REMOVED from this page)
        ================================================================
      */}
      {currentStep === 'details' && (
        <div className="mx-auto max-w-2xl">
          {/* Step Progress Stepper */}
          <div className="mb-8 flex items-center justify-between border-b border-line pb-4 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-cream">
                1
              </span>
              <span>1. Delivery Information</span>
            </div>

            <span className="text-muted/40">—</span>

            <div className="text-muted/60 flex items-center gap-2 font-medium uppercase tracking-wider">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line bg-cream text-[10px] text-muted">
                2
              </span>
              <span>2. Payment &amp; Confirmation</span>
            </div>
          </div>

          <form onSubmit={handleContinueToPayment} className="space-y-6">
            <div>
              <span className="label-caps text-muted">Step 1 of 2</span>
              <h1 className="mt-1 text-xl font-bold uppercase tracking-wider text-ink sm:text-2xl">
                Delivery Details
              </h1>
              <p className="mt-1 text-xs text-muted">
                Please enter the recipient information where your parcel will be delivered.
              </p>
            </div>

            <div className="space-y-5">
              <Input
                label="Full Name *"
                placeholder="Enter your full name"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                error={errors.shippingName}
                autoComplete="name"
              />

              {/* Phone Input with BD Country Code Support */}
              <div className="space-y-1.5">
                <Input
                  label="Phone Number (BD Mobile) *"
                  placeholder="e.g. 01XXXXXXXXX or +8801XXXXXXXXX"
                  type="tel"
                  value={shippingPhone}
                  onChange={(e) => {
                    // Allow numbers, spaces, +, -, parentheses up to 18 characters
                    const val = e.target.value.replace(/[^\d\s\-+()]/g, '').slice(0, 18);
                    setShippingPhone(val);
                    if (errors.shippingPhone) {
                      setErrors((prev) => {
                        const copy = { ...prev };
                        delete copy.shippingPhone;
                        return copy;
                      });
                    }
                  }}
                  error={errors.shippingPhone}
                  autoComplete="tel"
                />

                {/* Helper text / detection indicator */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">
                    Accepts standard 01..., 8801... or +8801... formats
                  </span>
                  {phoneValidation.isValid && (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <Check className="h-3.5 w-3.5" />
                      <span>{phoneValidation.formatted}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Select
                  label="District *"
                  options={districtOptions}
                  value={shippingDistrict}
                  onChange={(e) => {
                    setShippingDistrict(e.target.value);
                    setShippingArea('');
                  }}
                  error={errors.shippingDistrict}
                />

                <Select
                  label="Thana / Upazila *"
                  options={thanaOptions}
                  value={shippingArea}
                  onChange={(e) => setShippingArea(e.target.value)}
                  error={errors.shippingArea}
                  disabled={!shippingDistrict || thanaOptions.length === 0}
                  placeholder={shippingDistrict ? 'Select Thana' : 'Select district first'}
                />
              </div>

              {/* Dynamic Delivery Zone Indicator */}
              <div className="flex items-center justify-between border border-line bg-cream px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      isDhaka ? 'bg-emerald-600' : 'bg-amber-600'
                    }`}
                  />
                  <span className="font-semibold text-ink">
                    {isDhaka ? 'Inside Dhaka Delivery' : 'Outside Dhaka Delivery'}
                  </span>
                  <span className="text-[11px] text-muted">
                    ({isDhaka ? '24–48 Hours' : '2–3 Days'})
                  </span>
                </div>
                <span className="font-mono font-bold text-ink">৳{deliveryCharge}</span>
              </div>

              <Input
                label="Full Street Address *"
                placeholder="House no., road name/no., flat, sector or detailed address..."
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                error={errors.shippingAddress}
                autoComplete="street-address"
              />

              <Input
                label="Order Note / Special Instructions (Optional)"
                placeholder="Landmark, building name, or special delivery instructions..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            {/* Continue to Payment Button */}
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="group flex w-full items-center justify-center gap-2 py-4 text-xs tracking-looser"
              >
                <span>Continue to Payment</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 
        ================================================================
        STEP 2: PAYMENT & CONFIRMATION
        (Task 1: Compact 1-line delivery info with Check & Edit buttons.
         Task 2: Order Summary is placed ABOVE Confirm Order button,
                 and Trust Bar is placed at the VERY BOTTOM)
        ================================================================
      */}
      {currentStep === 'payment' && (
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Step Progress Stepper */}
          <div className="flex items-center justify-between border-b border-line pb-4 text-xs">
            <button
              type="button"
              onClick={handleEditDetails}
              className="flex items-center gap-2 font-bold uppercase tracking-wider text-muted transition-colors hover:text-ink"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] text-cream">
                ✓
              </span>
              <span>1. Delivery Information</span>
            </button>

            <span className="text-muted/40">—</span>

            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-ink">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] text-cream">
                2
              </span>
              <span>2. Payment &amp; Confirmation</span>
            </div>
          </div>

          <form onSubmit={handleConfirmOrder} className="space-y-6">
            <div>
              <span className="label-caps text-muted">Step 2 of 2</span>
              <h2 className="mt-1 text-xl font-bold uppercase tracking-wider text-ink sm:text-2xl">
                Payment &amp; Confirmation
              </h2>
              <p className="mt-1 text-xs text-muted">
                Review your delivery address, select payment method, and complete your order.
              </p>
            </div>

            {/* 
              TASK 1: Sleek Compact 1-Line Delivery Bar with Check & Edit Options.
              Saves vertical space and gives customer quick preview / edit control.
            */}
            <div className="overflow-hidden border border-line bg-cream transition-all">
              <div className="flex items-center justify-between gap-3 p-3.5 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[1px] bg-ink text-cream">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Deliver To
                      </span>
                      <span className="truncate text-xs font-bold text-ink">{shippingName}</span>
                      <span className="hidden font-mono text-xs text-muted sm:inline-block">
                        • {phoneValidation.formatted || shippingPhone}
                      </span>
                    </div>
                    <p className="truncate text-[11px] text-muted">
                      {shippingAddress}, {shippingArea}, {shippingDistrict}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeliveryDetails(!showDeliveryDetails)}
                    className="flex items-center gap-1 border border-line bg-cream-soft px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-ink hover:text-cream"
                  >
                    <span>{showDeliveryDetails ? 'Hide' : 'Check'}</span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-200 ${
                        showDeliveryDetails ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <button
                    type="button"
                    onClick={handleEditDetails}
                    className="flex items-center gap-1 border border-ink bg-ink px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-cream transition-opacity hover:opacity-85"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              {/* Expandable Details Drawer */}
              {showDeliveryDetails && (
                <div className="bg-cream-soft/60 animate-in fade-in border-t border-line p-4 duration-200">
                  <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Recipient Name
                      </span>
                      <p className="mt-0.5 font-bold text-ink">{shippingName}</p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Mobile Number
                      </span>
                      <p className="mt-0.5 font-mono font-bold text-ink">
                        {phoneValidation.formatted || shippingPhone}
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                        Full Address
                      </span>
                      <p className="mt-0.5 font-medium text-ink">
                        {shippingAddress}, {shippingArea}, {shippingDistrict}
                      </p>
                      <span className="mt-1.5 inline-block border border-line bg-cream px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                        {isDhaka
                          ? 'Inside Dhaka (৳70 • 24–48 Hours)'
                          : 'Outside Dhaka (৳130 • 2–3 Days)'}
                      </span>
                    </div>

                    {note && (
                      <div className="border-line/60 border-t pt-2 sm:col-span-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                          Rider Note
                        </span>
                        <p className="mt-0.5 text-xs italic text-muted">&ldquo;{note}&rdquo;</p>
                      </div>
                    )}
                  </div>

                  <div className="border-line/60 mt-3 flex justify-end border-t pt-2.5">
                    <button
                      type="button"
                      onClick={handleEditDetails}
                      className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-ink underline underline-offset-4 hover:opacity-80"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit This Information</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Method Selection */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Payment Method
              </span>

              {/* Cash on Delivery Card */}
              <div className="flex items-start justify-between border-2 border-ink bg-cream p-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-ink" />
                    <span className="text-xs font-bold uppercase tracking-wider text-ink">
                      Cash on Delivery (COD)
                    </span>
                  </div>
                  <p className="pl-6 text-[11px] leading-relaxed text-muted">
                    Pay in cash directly to the courier agent upon inspecting the package at your
                    doorstep. No advance payment required.
                  </p>
                </div>
                <span className="rounded bg-ink px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-cream">
                  Recommended
                </span>
              </div>
            </div>

            {/* 
              TASK 2: ORDER SUMMARY PLACED DIRECTLY ABOVE CONFIRM ORDER BUTTON
            */}
            <div className="space-y-4 border border-line bg-cream p-5 sm:p-6">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  Order Summary ({items.length} {items.length === 1 ? 'item' : 'items'})
                </h3>
                <span className="font-mono text-xs font-bold text-ink">
                  Total: {formatPrice(grandTotal)}
                </span>
              </div>

              {/* Items List */}
              <div className="max-h-64 divide-y divide-line overflow-y-auto pr-1">
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
                        <p className="truncate text-xs font-semibold tracking-wider text-ink">
                          {item.name}
                        </p>
                        <p className="text-[10px] uppercase text-muted">
                          {item.size && `Size: ${item.size}`} {item.color && `• ${item.color}`} •
                          Qty: {item.quantity}
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
              <div className="space-y-2 border-t border-line pt-3 text-xs uppercase tracking-wider text-ink">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted">
                    Delivery Fee ({isDhaka ? 'Inside Dhaka' : 'Outside Dhaka'})
                  </span>
                  <span>{formatPrice(deliveryCharge)}</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="flex items-baseline justify-between border-t border-line pt-3 text-sm font-bold uppercase tracking-wider">
                <span>Total Payable</span>
                <span className="text-xl font-extrabold text-ink">{formatPrice(grandTotal)}</span>
              </div>

              <p className="text-center text-[10px] uppercase tracking-widest text-muted">
                By placing your order, you agree to our terms &amp; conditions.
              </p>
            </div>

            {/* CONFIRM ORDER BUTTON (Directly Below Order Summary) */}
            <div className="space-y-3 pt-1">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isSubmitting}
                className="flex w-full items-center justify-center gap-2 py-4 text-xs tracking-looser"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Confirm Order — {formatPrice(grandTotal)}</span>
              </Button>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={handleEditDetails}
                  className="inline-flex items-center gap-1.5 font-medium text-muted transition-colors hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Delivery Info</span>
                </button>

                <span className="text-[10px] uppercase tracking-widest text-muted">
                  100% Secure Checkout
                </span>
              </div>
            </div>

            {/* 
              TASK 2: ATELIER TRUST BAR SITUATED AT THE VERY BOTTOM
            */}
            <div className="border-line/80 border-t pt-6">
              <div className="mb-3.5 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-ink">
                  Atelier Guarantee
                </span>
                <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
                  100% Verified
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="group rounded-[1px] border border-line bg-cream p-3 transition-colors hover:border-ink">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[1px] bg-ink text-cream transition-transform group-hover:scale-105">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <h4 className="mt-2 text-[11px] font-bold uppercase tracking-wider text-ink">
                    100% Genuine
                  </h4>
                  <p className="text-[10px] leading-tight text-muted">Luxury combed fabric</p>
                </div>

                <div className="group rounded-[1px] border border-line bg-cream p-3 transition-colors hover:border-ink">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[1px] bg-ink text-cream transition-transform group-hover:scale-105">
                    <PackageCheck className="h-4 w-4" />
                  </div>
                  <h4 className="mt-2 text-[11px] font-bold uppercase tracking-wider text-ink">
                    Open Box
                  </h4>
                  <p className="text-[10px] leading-tight text-muted">Check on delivery</p>
                </div>

                <div className="group rounded-[1px] border border-line bg-cream p-3 transition-colors hover:border-ink">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[1px] bg-ink text-cream transition-transform group-hover:scale-105">
                    <Truck className="h-4 w-4" />
                  </div>
                  <h4 className="mt-2 text-[11px] font-bold uppercase tracking-wider text-ink">
                    Express Dispatch
                  </h4>
                  <p className="text-[10px] leading-tight text-muted">Fast courier shipping</p>
                </div>

                <div className="group rounded-[1px] border border-line bg-cream p-3 transition-colors hover:border-ink">
                  <div className="flex h-7 w-7 items-center justify-center rounded-[1px] bg-ink text-cream transition-transform group-hover:scale-105">
                    <RotateCcw className="h-4 w-4" />
                  </div>
                  <h4 className="mt-2 text-[11px] font-bold uppercase tracking-wider text-ink">
                    7-Day Exchange
                  </h4>
                  <p className="text-[10px] leading-tight text-muted">Hassle-free size swap</p>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
