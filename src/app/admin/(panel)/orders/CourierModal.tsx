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

  const handleSteadfastAuto = async () => {
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/courier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierName: 'Steadfast', autoCreateSteadfast: true }),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to submit order to Steadfast');
      }
    } catch {
      setError('Network error connecting to Steadfast. Try again.');
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

        <div className="space-y-4 p-5">
          {/* Automated 1-Click Steadfast Section */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-purple-300">
                ⚡ 1-Click Steadfast API
              </span>
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-medium text-purple-300">
                Recommended
              </span>
            </div>
            <p className="mb-3 text-[12px] text-white/60">
              Directly creates the consignment in Steadfast Courier and fetches the tracking code
              automatically.
            </p>
            <button
              type="button"
              onClick={handleSteadfastAuto}
              disabled={isSaving}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-purple-500/20 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Truck className="h-4 w-4" />
              )}
              Send to Steadfast Instantly
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-white/[0.08]" />
            <span className="bg-[#111113] px-3 text-[11px] font-medium uppercase text-white/30">
              OR Manual Entry
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[12px] font-medium text-white/50">
                Select Courier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {COURIERS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCourierName(c)}
                    className={`rounded-lg border px-3 py-2 text-[12px] font-semibold transition-all ${
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
                className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-[13px] text-white placeholder-white/25 outline-none focus:border-purple-500/50"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-[12px] text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-white/[0.08] py-2 text-[13px] font-medium text-white/50 transition-colors hover:text-white/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || !courierName}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/[0.06] py-2 text-[13px] font-semibold text-white transition-all hover:bg-white/10 disabled:opacity-50"
              >
                Manual Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
