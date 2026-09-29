'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Package, CheckCircle2, Clock, Truck, Home } from 'lucide-react';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface TrackItem {
  id: string;
  name: string;
  size?: string;
  color?: string;
  price: number;
  qty: number;
  image?: string;
}

interface TrackHistory {
  status: string;
  note?: string;
  createdAt: string;
}

interface TrackOrderData {
  orderNo: string;
  status: string;
  createdAt: string;
  shippingName: string;
  shippingDistrict: string;
  shippingArea: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  items: TrackItem[];
  statusHistory: TrackHistory[];
}

const TIMELINE_STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'On The Way', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
];

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderNo = searchParams.get('orderNo') || '';

  const [orderNo, setOrderNo] = useState(initialOrderNo);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<TrackOrderData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (initialOrderNo) {
      setOrderNo(initialOrderNo);
    }
  }, [initialOrderNo]);

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setOrderData(null);

    if (!orderNo.trim()) {
      setErrorMessage('Please enter your order number.');
      return;
    }

    if (!phone.trim() || phone.replace(/[^\d]/g, '').length < 10) {
      setErrorMessage('Please enter the 11-digit mobile number used during order.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/orders/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: orderNo.trim(),
          phone: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No matching order found.');
      }

      setOrderData(data.order);
      showToast('Order details retrieved successfully', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve order.';
      setErrorMessage(msg);
      showToast(msg, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine step completion index
  const getStepStatus = (stepKey: string, currentStatus: string) => {
    const statusOrder = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const stepIndex = statusOrder.indexOf(stepKey);

    if (currentStatus === 'CANCELLED' || currentStatus === 'RETURNED') {
      return 'cancelled';
    }

    if (stepIndex <= currentIndex) {
      return 'completed';
    }
    return 'upcoming';
  };

  return (
    <main className="mx-auto min-h-[80vh] max-w-[1000px] px-6 py-12 sm:px-10 sm:py-20">
      {/* Header */}
      <div className="mx-auto max-w-md space-y-2 text-center">
        <span className="label-caps text-muted">Real-Time Dispatch</span>
        <h1 className="heading-lg text-ink">Track Your Order</h1>
        <p className="text-xs text-muted">
          Enter your Order Number and verified mobile number to view live status updates.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="mx-auto mt-10 max-w-xl border border-line bg-cream-soft p-6 shadow-sm sm:p-8">
        <form onSubmit={handleTrackSubmit} className="space-y-4">
          <Input
            label="Order Number *"
            placeholder="e.g. GH-260929-0001"
            value={orderNo}
            onChange={(e) => setOrderNo(e.target.value)}
          />

          <Input
            label="Phone Number (BD Mobile) *"
            placeholder="017XXXXXXXX"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            helperText="The mobile number given during checkout."
          />

          {errorMessage && (
            <div className="bg-danger/10 border-danger/30 border p-3 text-xs text-danger">
              {errorMessage}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full py-4 text-xs tracking-looser"
          >
            Track Status
          </Button>
        </form>
      </div>

      {/* Results Display */}
      {orderData && (
        <div className="animate-fade-in mt-12 space-y-8">
          {/* Order Header Card */}
          <div className="flex flex-col items-start justify-between gap-4 border border-line bg-cream-soft p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted">
                Order Details
              </span>
              <h2 className="mt-0.5 font-mono text-xl font-bold text-ink">{orderData.orderNo}</h2>
              <p className="mt-1 text-xs text-muted">
                Placed on{' '}
                {new Date(orderData.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                Status:
              </span>
              <Badge variant={orderData.status === 'DELIVERED' ? 'success' : 'default'} size="md">
                {orderData.status}
              </Badge>
            </div>
          </div>

          {/* Progress Timeline */}
          <div className="border border-line bg-cream p-6 sm:p-10">
            <h3 className="border-b border-line pb-6 text-xs font-bold uppercase tracking-wider text-ink">
              Delivery Progress
            </h3>

            <div className="relative mt-8 grid grid-cols-5 gap-2 text-center sm:gap-4">
              {TIMELINE_STEPS.map((step) => {
                const statusState = getStepStatus(step.key, orderData.status);
                const IconComponent = step.icon;

                return (
                  <div key={step.key} className="flex flex-col items-center space-y-2">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all sm:h-12 sm:w-12 ${
                        statusState === 'completed'
                          ? 'border-ink bg-ink text-cream shadow-md'
                          : 'border-line bg-cream text-muted'
                      }`}
                    >
                      <IconComponent className="h-5 w-5 stroke-[1.5]" />
                    </div>

                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${
                        statusState === 'completed' ? 'text-ink' : 'text-muted'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status History Notes Log */}
            {orderData.statusHistory.length > 0 && (
              <div className="mt-10 space-y-3 border-t border-line pt-6">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Timeline Activity Log
                </h4>
                <div className="space-y-2 text-xs">
                  {orderData.statusHistory.map((h, idx) => (
                    <div
                      key={idx}
                      className="border-line/50 flex items-start justify-between border-b pb-2"
                    >
                      <div>
                        <span className="mr-2 font-semibold uppercase tracking-wide text-ink">
                          [{h.status}]
                        </span>
                        <span className="text-muted">{h.note || 'Status updated'}</span>
                      </div>
                      <span className="ml-4 flex-shrink-0 font-mono text-[10px] text-muted">
                        {new Date(h.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order Details & Items Summary */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
            {/* Items */}
            <div className="space-y-4 border border-line bg-cream-soft p-6 md:col-span-7">
              <h3 className="border-b border-line pb-3 text-xs font-bold uppercase tracking-wider text-ink">
                Package Contents ({orderData.items.length})
              </h3>
              <div className="divide-y divide-line">
                {orderData.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-12 flex-shrink-0 overflow-hidden border border-line bg-cream">
                        <Image
                          src={item.image || '/images/gallery-front.jpg'}
                          alt={item.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-ink">
                          {item.name}
                        </h4>
                        <p className="text-[10px] uppercase text-muted">
                          {item.size && `Size: ${item.size}`} {item.color && `• ${item.color}`} •
                          Qty: {item.qty}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-xs font-medium text-ink">
                      {formatPrice(item.price * item.qty)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recipient & Payment Summary */}
            <div className="space-y-4 border border-line bg-cream-soft p-6 md:col-span-5">
              <h3 className="border-b border-line pb-3 text-xs font-bold uppercase tracking-wider text-ink">
                Delivery &amp; Payment
              </h3>

              <div className="space-y-2 text-xs text-muted">
                <p>
                  <strong className="text-ink">Recipient:</strong> {orderData.shippingName}
                </p>
                <p>
                  <strong className="text-ink">Address:</strong> {orderData.shippingAddress},{' '}
                  {orderData.shippingArea}, {orderData.shippingDistrict}
                </p>
                <p>
                  <strong className="text-ink">Payment:</strong> {orderData.paymentMethod} (
                  {orderData.paymentStatus})
                </p>
              </div>

              <div className="space-y-1.5 border-t border-line pt-3 text-xs uppercase tracking-wider">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(orderData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Delivery Charge</span>
                  <span>
                    {orderData.deliveryCharge === 0
                      ? 'FREE'
                      : formatPrice(orderData.deliveryCharge)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-line pt-2 font-bold text-ink">
                  <span>Total Amount</span>
                  <span className="text-base">{formatPrice(orderData.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-[900px] px-6 py-20 text-center">
          <p className="label-caps text-muted">Loading tracking portal...</p>
        </main>
      }
    >
      <TrackOrderContent />
    </Suspense>
  );
}
