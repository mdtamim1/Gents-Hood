'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  ShieldAlert,
  Loader2,
  AlertCircle,
  User,
  Phone,
  MapPin,
  CheckCircle2,
  Package,
} from 'lucide-react';

interface SearchedOrder {
  id: string;
  orderNo: string;
  status: string;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingDistrict?: string;
  shippingAddress?: string;
  appealStatus?: string | null;
  assignedTo?: { id: string; name: string; displayColor?: string } | null;
  appeals?: Array<{
    id: string;
    staffName: string;
    status: string;
    reason: string;
    createdAt: string;
  }>;
}

interface CreateAppealModalProps {
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

export function CreateAppealModal({ onClose, onSuccess }: CreateAppealModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchedOrder[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Selected order state
  const [selectedOrder, setSelectedOrder] = useState<SearchedOrder | null>(null);
  const [reason, setReason] = useState(ISSUE_REASONS[0]);
  const [customerPhone, setCustomerPhone] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Live order search
  const handleSearch = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/admin/orders?status=ALL&search=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.orders)) {
        setSearchResults(data.orders);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Order search error:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  const handleSelectOrder = (order: SearchedOrder) => {
    setSelectedOrder(order);
    setCustomerPhone(order.shippingPhone || '');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    if (!note.trim()) {
      setError('Please provide a detailed note describing the problem.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/appeals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          reason,
          note: note.trim(),
          customerPhone: customerPhone.trim() || selectedOrder.shippingPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit appeal');
      }

      onSuccess(data.message || `Appeal for order ${selectedOrder.orderNo} submitted successfully!`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit appeal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#141416] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-white">Create Order Appeal</h3>
              <p className="text-[11px] text-white/40">
                Search any order across the website and submit customer issue for Admin verification
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* STEP 1: SEARCH ORDER (Only shown if no order selected or when changing) */}
          {!selectedOrder ? (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-semibold text-white/70">
                  Search Order (Customer Phone Number or Order ID) *
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Enter customer phone number or order ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/[0.1] bg-[#161619] py-3 pl-10 pr-10 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30"
                  />
                  {isSearching ? (
                    <Loader2 className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-amber-400" />
                  ) : searchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setHasSearched(false);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  Searches all orders across the whole website in real time.
                </p>
              </div>

              {/* Search Results Display */}
              {isSearching && (
                <div className="flex items-center justify-center py-10">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                    <span>Searching orders...</span>
                  </div>
                </div>
              )}

              {!isSearching && hasSearched && searchResults.length === 0 && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                  <Package className="mx-auto mb-2 h-8 w-8 text-zinc-600" />
                  <p className="text-xs font-semibold text-zinc-300">No order found</p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    No order matches &ldquo;{searchQuery}&rdquo;. Please verify the phone number or order ID.
                  </p>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
                    <span>Found {searchResults.length} order{searchResults.length > 1 ? 's' : ''}:</span>
                    <span className="text-[11px] text-amber-400">Click an order to appeal</span>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {searchResults.map((order) => {
                      const isPendingAppeal = order.appealStatus === 'PENDING';
                      return (
                        <div
                          key={order.id}
                          onClick={() => {
                            if (!isPendingAppeal) {
                              handleSelectOrder(order);
                            }
                          }}
                          className={`rounded-xl border p-4 transition-all ${
                            isPendingAppeal
                              ? 'border-amber-500/30 bg-amber-500/5 cursor-not-allowed opacity-90'
                              : 'border-white/[0.08] bg-[#141416] hover:border-amber-500/50 hover:bg-amber-500/[0.03] cursor-pointer'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-rose-300">
                                {order.orderNo}
                              </span>
                              <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-semibold text-white/70">
                                {order.status}
                              </span>
                              {isPendingAppeal && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
                                  <ShieldAlert className="h-3 w-3" />
                                  Already Appealed
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-xs font-bold text-emerald-400">
                              ৳{order.total.toLocaleString()}
                            </span>
                          </div>

                          <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                            <div className="flex items-center gap-1.5 truncate">
                              <User className="h-3 w-3 text-zinc-500 shrink-0" />
                              <span className="truncate font-medium text-white">{order.shippingName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 truncate">
                              <Phone className="h-3 w-3 text-zinc-500 shrink-0" />
                              <span className="font-mono text-zinc-300">{order.shippingPhone}</span>
                            </div>
                            {order.shippingDistrict && (
                              <div className="col-span-2 flex items-center gap-1.5 truncate text-[10px] text-zinc-500">
                                <MapPin className="h-3 w-3 text-zinc-600 shrink-0" />
                                <span className="truncate">
                                  {order.shippingDistrict} {order.shippingAddress ? `· ${order.shippingAddress}` : ''}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Assigned staff marker */}
                          <div className="mt-2.5 flex items-center justify-between border-t border-white/[0.04] pt-2 text-[10px]">
                            <span className="text-zinc-500">
                              Assigned to:{' '}
                              <strong className="text-zinc-300">
                                {order.assignedTo ? order.assignedTo.name : 'Unassigned'}
                              </strong>
                            </span>

                            {isPendingAppeal ? (
                              <span className="text-amber-400 font-medium">Pending Admin Review</span>
                            ) : (
                              <span className="text-amber-400 font-semibold hover:underline">
                                Select to Appeal →
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: FILL APPEAL FORM FOR SELECTED ORDER */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Selected Order Summary Card */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.06] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-amber-300">
                      {selectedOrder.orderNo}
                    </span>
                    <span className="rounded bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-white/80">
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      ৳{selectedOrder.total.toLocaleString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="rounded-lg border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/70 hover:bg-white/[0.08] hover:text-white"
                    >
                      Change Order
                    </button>
                  </div>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  <div className="flex items-center gap-1.5 truncate">
                    <User className="h-3 w-3 text-zinc-500 shrink-0" />
                    <span className="truncate">{selectedOrder.shippingName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="h-3 w-3 text-zinc-500 shrink-0" />
                    <span className="font-mono">{selectedOrder.shippingPhone}</span>
                  </div>
                  {selectedOrder.shippingDistrict && (
                    <div className="col-span-2 flex items-center gap-1.5 truncate text-[10px] text-zinc-400">
                      <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                      <span className="truncate">
                        {selectedOrder.shippingDistrict}{' '}
                        {selectedOrder.shippingAddress ? `· ${selectedOrder.shippingAddress}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Issue Category Dropdown */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/70">
                  Issue Category / Reason *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.1] bg-[#161619] px-3.5 py-2.5 text-xs text-white outline-none transition-colors focus:border-amber-500/60"
                >
                  {ISSUE_REASONS.map((r) => (
                    <option key={r} value={r} className="bg-[#161619] text-white">
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Contact Phone */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/70">
                  Customer Contact Phone *
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Customer active contact phone..."
                  className="w-full rounded-xl border border-white/[0.1] bg-[#161619] px-3.5 py-2.5 text-xs text-white outline-none transition-colors focus:border-amber-500/60"
                />
              </div>

              {/* Detailed Problem Note */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-white/70">
                  Detailed Note / Problem Description *
                </label>
                <textarea
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Explain customer's issue in detail (e.g. Customer called requesting address update to Mirpur 12 instead of Mirpur 10, courier rescheduled, size change requested...)"
                  className="w-full rounded-xl border border-white/[0.1] bg-[#161619] p-3 text-xs text-white placeholder-zinc-600 outline-none transition-colors focus:border-amber-500/60"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-white/70 hover:bg-white/[0.08] hover:text-white"
                >
                  Back to Search
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-xs font-bold text-black shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Submit Appeal for Admin Review</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
