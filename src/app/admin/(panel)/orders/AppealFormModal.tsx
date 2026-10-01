'use client';

import React, { useState } from 'react';
import { X, AlertCircle, Loader2, CheckCircle2, ShieldAlert, Phone, User, MapPin } from 'lucide-react';

export interface OrderAppealData {
  id: string;
  orderNo: string;
  shippingName: string;
  shippingPhone: string;
  shippingDistrict?: string;
  shippingAddress?: string;
  total: number;
  status: string;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; displayColor?: string } | null;
  appealStatus?: string | null;
  appeals?: Array<{
    id: string;
    reason: string;
    note: string;
    status: string;
    staffName: string;
    createdAt: string;
  }>;
}

interface AppealFormModalProps {
  order: OrderAppealData;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const ISSUE_REASONS = [
  'Customer Phone / Address Update',
  'Size / Color Variant Change Request',
  'Customer Requested Cancellation',
  'Delivery Delay / Courier Inquiry',
  'Damaged / Wrong Item Received',
  'Advance Payment / Refund Issue',
  'Customer Unavailable / Reschedule Delivery',
  'Price / Discount Dispute',
  'Other Customer Complaint',
];

export function AppealFormModal({ order, onClose, onSuccess }: AppealFormModalProps) {
  const existingPendingAppeal = order.appeals?.find((a) => a.status === 'PENDING') || 
    (order.appealStatus === 'PENDING' ? order.appeals?.[0] : null);

  const [reason, setReason] = useState(ISSUE_REASONS[0]);
  const [customerPhone, setCustomerPhone] = useState(order.shippingPhone || '');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      setError('Please provide a detailed note describing the customer issue.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          reason,
          note: note.trim(),
          customerPhone: customerPhone.trim() || order.shippingPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit appeal');
      }

      onSuccess(data.message || `Appeal for order ${order.orderNo} submitted successfully!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#141416] px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-white">Customer Issue Appeal</h3>
              <p className="text-[11px] text-white/40">
                Submit an appeal for Admin verification & problem resolution
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.08] hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Order Brief Summary */}
        <div className="border-b border-white/[0.04] bg-white/[0.02] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[13px] font-bold text-amber-300">
                {order.orderNo}
              </span>
              <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/70">
                {order.status}
              </span>
            </div>
            <span className="text-[13px] font-bold text-emerald-400">
              ৳{order.total.toLocaleString('en-BD')}
            </span>
          </div>

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-white/60">
            <div className="flex items-center gap-1.5 truncate">
              <User className="h-3 w-3 text-white/30" />
              <span className="truncate">{order.shippingName}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <Phone className="h-3 w-3 text-white/30" />
              <span className="font-mono">{order.shippingPhone}</span>
            </div>
            {order.shippingDistrict && (
              <div className="col-span-2 flex items-center gap-1.5 truncate text-[10px] text-white/40">
                <MapPin className="h-3 w-3 text-white/30" />
                <span className="truncate">{order.shippingDistrict} {order.shippingAddress ? `· ${order.shippingAddress}` : ''}</span>
              </div>
            )}
          </div>
        </div>

        {/* Existing Appeal Alert (Duplicate prevention) */}
        {existingPendingAppeal ? (
          <div className="p-6">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <h4 className="text-[13px] font-bold text-amber-300">
                    Appeal Already Submitted & Pending Review
                  </h4>
                  <p className="mt-1 text-[12px] text-amber-200/80">
                    This order was already appealed by{' '}
                    <strong className="text-white">{existingPendingAppeal.staffName}</strong> on{' '}
                    {new Date(existingPendingAppeal.createdAt).toLocaleDateString('en-BD', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}.
                  </p>
                  <div className="mt-2.5 rounded-lg bg-black/30 p-2.5 text-[11px] text-amber-100/90">
                    <p className="font-semibold text-white/90">
                      Reason: <span className="text-amber-300">{existingPendingAppeal.reason}</span>
                    </p>
                    <p className="mt-0.5 text-white/70 italic">&ldquo;{existingPendingAppeal.note}&rdquo;</p>
                  </div>
                  <p className="mt-3 text-[11px] text-white/50">
                    Duplicate appeals are blocked to prevent multiple staff conflicts. The order is currently in the Admin verification queue.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-white/[0.08] px-5 py-2 text-[13px] font-medium text-white hover:bg-white/[0.14]"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {/* Issue Category */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-white/60">
                Issue Category / Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-amber-500/50"
              >
                {ISSUE_REASONS.map((r) => (
                  <option key={r} value={r} className="bg-[#141416] text-white">
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Calling Phone */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-white/60">
                Customer Phone Number (Calling Number)
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 01712345678"
                className="w-full rounded-xl border border-white/[0.08] bg-[#141416] px-3.5 py-2.5 text-[13px] text-white outline-none focus:border-amber-500/50"
              />
            </div>

            {/* Note */}
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-white/60">
                Detailed Problem Note / Customer Request *
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                required
                rows={4}
                placeholder="গ্রাহক কী সমস্যা জানিয়েছেন এবং কী সমাধান করতে হবে বিস্তারিত লিখুন..."
                className="w-full rounded-xl border border-white/[0.08] bg-[#141416] p-3 text-[13px] text-white outline-none placeholder:text-white/25 focus:border-amber-500/50"
              />
            </div>

            {/* Workflow Notice */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-3 text-[11px] text-indigo-300">
              <p className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Workflow Process:
              </p>
              <p className="mt-1 text-indigo-200/70">
                Submitting this will send the appeal to the <strong>Admin Appeals</strong> queue. Once Admin verifies and approves the issue, this order will be automatically assigned to <strong>your Processing panel</strong>.
              </p>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-3.5 py-2.5 text-[12px] text-red-400">
                {error}
              </div>
            )}

            {/* Form Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border border-white/[0.08] py-2.5 text-[13px] font-medium text-white/60 hover:bg-white/[0.04] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 py-2.5 text-[13px] font-bold text-black shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4 text-black" />
                    <span>Submit Appeal</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
