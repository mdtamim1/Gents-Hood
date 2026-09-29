'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

interface AccountOrder {
  id: string;
  orderNo: string;
  status: string;
  total: number;
  createdAt: string;
  shippingName: string;
  itemCount: number;
  items: {
    name: string;
    size?: string;
    qty: number;
    image?: string;
  }[];
}

export default function AccountPage() {
  const [phone, setPhone] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const { showToast } = useToast();

  const fetchOrders = useCallback(
    async (mobilePhone: string) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/account/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: mobilePhone }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to fetch orders');
        }

        setOrders(data.orders);
        setHasSearched(true);
        try {
          localStorage.setItem('gents_hood_user_phone', mobilePhone);
        } catch {
          // Ignore
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to retrieve order history.';
        showToast(msg, 'danger');
      } finally {
        setIsLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    try {
      const savedPhone = localStorage.getItem('gents_hood_user_phone');
      if (savedPhone) {
        setPhone(savedPhone);
        fetchOrders(savedPhone);
      }
    } catch {
      // Ignore storage errors
    }
  }, [fetchOrders]);

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.replace(/[^\d]/g, '').length < 10) {
      showToast('Please enter a valid 11-digit mobile number.', 'danger');
      return;
    }
    fetchOrders(phone.trim());
  };

  return (
    <main className="mx-auto min-h-[80vh] max-w-[1000px] px-6 py-12 sm:px-10 sm:py-20">
      {/* Header */}
      <div className="mx-auto max-w-md space-y-2 text-center">
        <span className="label-caps text-muted">Customer Portal</span>
        <h1 className="heading-lg text-ink">My Orders</h1>
        <p className="text-xs text-muted">
          Look up your past purchases, order status, and invoices using your registered mobile
          number.
        </p>
      </div>

      {/* Phone Lookup Box */}
      <div className="mx-auto mt-8 max-w-md border border-line bg-cream-soft p-6 sm:p-8">
        <form onSubmit={handleLookup} className="space-y-4">
          <Input
            label="Mobile Number *"
            placeholder="017XXXXXXXX"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            helperText="Enter the phone number used at checkout."
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            className="w-full text-xs tracking-looser"
          >
            Access Orders
          </Button>
        </form>
      </div>

      {/* Order Results */}
      {hasSearched && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-ink">
              Purchase History ({orders.length})
            </h2>
            {orders.length > 0 && (
              <span className="text-xs font-medium text-muted">
                Customer: {orders[0].shippingName}
              </span>
            )}
          </div>

          {orders.length === 0 ? (
            <div className="space-y-4 border border-line bg-cream-soft p-8 py-16 text-center">
              <p className="text-xs uppercase tracking-widest text-muted">
                No orders found associated with this mobile number ({phone}).
              </p>
              <Link href="/trending">
                <Button variant="outline" size="sm">
                  Start Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="flex flex-col items-start justify-between gap-6 border border-line bg-cream-soft p-6 transition-colors hover:border-ink sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-bold text-ink">{order.orderNo}</span>
                      <Badge
                        variant={order.status === 'DELIVERED' ? 'success' : 'default'}
                        size="sm"
                      >
                        {order.status}
                      </Badge>
                    </div>

                    <div className="space-x-3 text-xs text-muted">
                      <span>
                        {new Date(order.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                      <span>•</span>
                      <span>
                        {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-ink">{formatPrice(order.total)}</span>
                    </div>

                    <p className="line-clamp-1 pt-0.5 text-[11px] text-muted">
                      {order.items.map((i) => `${i.name} (Qty: ${i.qty})`).join(', ')}
                    </p>
                  </div>

                  <Link href={`/track-order?orderNo=${order.orderNo}`} className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex w-full items-center gap-1.5 text-[10px] tracking-looser sm:w-auto"
                    >
                      <span>Track Order</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
