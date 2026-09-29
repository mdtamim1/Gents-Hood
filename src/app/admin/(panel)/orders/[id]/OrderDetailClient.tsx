'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Printer } from 'lucide-react';
import { formatPrice } from '@/lib/utils/money';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface OrderItem {
  id: string;
  nameSnapshot: string;
  sizeSnapshot?: string | null;
  colorSnapshot?: string | null;
  priceSnapshot: number;
  qty: number;
}

interface OrderHistory {
  id: string;
  status: string;
  note?: string | null;
  createdAt: string | Date;
}

interface OrderDetail {
  id: string;
  orderNo: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingDistrict: string;
  shippingArea: string;
  shippingAddress: string;
  note?: string | null;
  createdAt: string | Date;
  items: OrderItem[];
  statusHistory: OrderHistory[];
}

export function OrderDetailClient({ initialOrder }: { initialOrder: OrderDetail }) {
  const [order, setOrder] = useState<OrderDetail>(initialOrder);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { showToast } = useToast();

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: selectedStatus,
          note: statusNote || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update order');
      }

      setOrder(data.order);
      setStatusNote('');
      showToast(`Order status updated to ${selectedStatus}`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating status';
      showToast(msg, 'danger');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'outline' | 'success' | 'danger' | 'inv' => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      case 'SHIPPED':
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'inv';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header and Actions (hidden when printing) */}
      <div className="border-muted/20 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="hover:bg-muted/20 rounded p-1.5 text-muted transition-colors hover:text-cream"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="heading-md font-mono text-cream">{order.orderNo}</h1>
              <Badge variant={getStatusBadgeVariant(order.status)} size="md">
                {order.status}
              </Badge>
            </div>
            <p className="mt-0.5 text-xs text-muted">
              Placed on {new Date(order.createdAt).toLocaleString('en-GB')}
            </p>
          </div>
        </div>

        <button
          onClick={handlePrint}
          className="border-muted/30 bg-muted/10 hover:bg-muted/20 flex items-center justify-center gap-2 rounded-[1px] border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream transition-colors"
        >
          <Printer className="h-4 w-4" />
          Print Invoice / Packing Slip
        </button>
      </div>

      {/* Printable Invoice Header (visible only when printing) */}
      <div className="mb-6 hidden border-b border-line pb-4 print:block">
        <h1 className="text-2xl font-bold tracking-tight">GENTS HOOD ATELIER</h1>
        <p className="text-xs text-muted">Gulshan 2, Dhaka, Bangladesh · Official Packing Slip</p>
        <p className="mt-2 text-sm font-bold">Order: {order.orderNo}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Items and Customer Info */}
        <div className="space-y-6 lg:col-span-8">
          {/* Purchased Items Card */}
          <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6 print:border-none print:p-0">
            <h2 className="heading-sm border-muted/10 border-b pb-2 text-cream">
              Ordered Garments
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-muted/20 border-b text-[10px] uppercase tracking-wider text-muted">
                    <th className="py-2.5">Item Description</th>
                    <th className="py-2.5">Size / Color</th>
                    <th className="py-2.5 text-center">Qty</th>
                    <th className="py-2.5 text-right">Price</th>
                    <th className="py-2.5 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-muted/10 divide-y">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-3 font-semibold text-cream">{item.nameSnapshot}</td>
                      <td className="py-3 text-muted">
                        {item.sizeSnapshot || 'Standard'} / {item.colorSnapshot || 'Charcoal'}
                      </td>
                      <td className="py-3 text-center font-mono text-cream">{item.qty}</td>
                      <td className="py-3 text-right font-mono text-cream">
                        {formatPrice(item.priceSnapshot)}
                      </td>
                      <td className="py-3 text-right font-mono font-bold text-cream">
                        {formatPrice(item.priceSnapshot * item.qty)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Summary */}
            <div className="border-muted/20 space-y-1.5 border-t pt-4 text-right text-xs">
              <div className="flex justify-between text-muted">
                <span>Items Subtotal</span>
                <span className="font-mono">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Delivery Charge ({order.shippingDistrict})</span>
                <span className="font-mono">
                  {order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge)}
                </span>
              </div>
              <div className="border-muted/20 flex justify-between border-t pt-2 text-sm font-bold text-cream">
                <span>Total Payable</span>
                <span className="font-mono text-base">{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Details */}
          <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6 print:border-none print:p-0">
            <h2 className="heading-sm border-muted/10 border-b pb-2 text-cream">
              Customer & Delivery Address
            </h2>

            <div className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  Recipient Name
                </span>
                <p className="mt-0.5 font-semibold text-cream">{order.shippingName}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  Contact Phone
                </span>
                <p className="mt-0.5 font-mono font-semibold text-cream">{order.shippingPhone}</p>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  Full Address
                </span>
                <p className="mt-0.5 text-cream">
                  {order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}
                </p>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-muted">
                  Payment Method
                </span>
                <p className="mt-0.5 font-semibold text-cream">
                  {order.paymentMethod} ({order.paymentStatus})
                </p>
              </div>

              {order.note && (
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-muted">
                    Customer Note
                  </span>
                  <p className="mt-0.5 italic text-amber-300">&quot;{order.note}&quot;</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Status Change & Fulfillment History (hidden when printing) */}
        <div className="space-y-6 lg:col-span-4 print:hidden">
          {/* Status Update Form */}
          <form
            onSubmit={handleUpdateStatus}
            className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6"
          >
            <h3 className="heading-sm border-muted/10 border-b pb-2 text-cream">
              Update Fulfillment Status
            </h3>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Order Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              >
                <option value="PENDING">PENDING (Awaiting Verification)</option>
                <option value="CONFIRMED">CONFIRMED (Call Verified)</option>
                <option value="PROCESSING">PROCESSING (Packing at Atelier)</option>
                <option value="SHIPPED">SHIPPED (Handed to Courier)</option>
                <option value="DELIVERED">DELIVERED (Fulfilled)</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Internal Admin Note (Optional)
              </label>
              <textarea
                rows={2}
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="e.g. Called customer, confirmed Steedfast courier tracking #..."
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isUpdating}
              className="w-full bg-cream py-2.5 text-xs font-bold uppercase tracking-wider text-ink hover:bg-cream-soft"
            >
              Update Status
            </Button>
          </form>

          {/* Status History Timeline */}
          <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
            <h3 className="heading-sm border-muted/10 border-b pb-2 text-cream">Status Timeline</h3>

            {order.statusHistory.length === 0 ? (
              <p className="text-xs text-muted">No timeline entries logged.</p>
            ) : (
              <div className="space-y-4">
                {order.statusHistory.map((history, idx) => (
                  <div key={history.id} className="relative pl-6">
                    {/* Circle marker */}
                    <span className="absolute left-0 top-1 h-3 w-3 rounded-full border-2 border-cream bg-ink" />
                    {idx < order.statusHistory.length - 1 && (
                      <span className="bg-muted/20 absolute left-1.5 top-4 h-full w-[1px]" />
                    )}

                    <div className="text-xs">
                      <span className="font-semibold uppercase tracking-wider text-cream">
                        {history.status}
                      </span>
                      <p className="text-[10px] text-muted">
                        {new Date(history.createdAt).toLocaleString('en-GB')}
                      </p>
                      {history.note && (
                        <p className="text-muted/90 bg-muted/10 mt-1 rounded-[1px] p-2 text-[11px]">
                          {history.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
