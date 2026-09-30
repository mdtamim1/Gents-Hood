'use client';

import React, { useState } from 'react';
import { X, Truck, Loader2 } from 'lucide-react';

const COURIERS = ['Steadfast', 'Pathao', 'Redx', 'Paperfly', 'Sundarban', 'Other'];

interface CourierModalProps {
  orderId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function CourierModal({ orderId, onClose, onSuccess }: CourierModalProps) {
  const [courierName, setCourierName] = useState('Steadfast');
  const [trackingNo, setTrackingNo] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courierName) {
      setError('Select a courier');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/courier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierName, courierTrackingNo: trackingNo || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to submit courier entry');
      }
    } catch {
      setError('Network error. Try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/15">
              <Truck className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-white">Courier Entry</h2>
              <p className="text-[11px] text-white/35">Submit order to courier service</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-white/50">
              Select Courier *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {COURIERS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCourierName(c)}
                  className={`rounded-lg border px-3 py-2.5 text-[12px] font-semibold transition-all ${
                    courierName === c
                      ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                      : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/[0.15] hover:text-white/80'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[12px] font-medium text-white/50">
              Tracking Number <span className="text-white/25">(Optional)</span>
            </label>
            <input
              type="text"
              value={trackingNo}
              onChange={(e) => setTrackingNo(e.target.value)}
              placeholder="e.g. STF-12345678"
              className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white placeholder-white/25 outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Warning */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-[12px] text-amber-400">
            ⚠️ Once submitted, the courier entry button will be disabled. Make sure the details are
            correct.
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[12px] text-red-400">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/[0.08] py-2.5 text-[13px] font-medium text-white/50 transition-colors hover:text-white/80"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !courierName}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-purple-500 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:bg-purple-400 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Submit to Courier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
