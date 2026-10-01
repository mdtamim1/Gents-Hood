'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  MessageSquare,
  Search,
  Mail,
  Phone,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Volume2,
  VolumeX,
  ShieldCheck,
  FileText,
  User,
  MessageCircle,
  Inbox,
  Check,
} from 'lucide-react';

export interface CustomerInquiryItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: 'NEW' | 'REVIEWED' | 'RESOLVED';
  ipAddress: string | null;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

interface QueriesClientProps {
  initialInquiries: CustomerInquiryItem[];
  initialCounts: {
    total: number;
    new: number;
    reviewed: number;
    resolved: number;
  };
  session: {
    id: string;
    email: string;
    name: string;
    role: 'OWNER' | 'STAFF';
  };
}

export function QueriesClient({
  initialInquiries,
  initialCounts,
  session: _session,
}: QueriesClientProps) {
  const [inquiries, setInquiries] = useState<CustomerInquiryItem[]>(initialInquiries);
  const [counts, setCounts] = useState(initialCounts);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'NEW' | 'REVIEWED' | 'RESOLVED'>(
    'ALL'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'error';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const playNotificationChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // AudioContext blocked
    }
  }, [soundEnabled]);

  // Fetch inquiries from server
  const fetchInquiries = useCallback(
    async (isBackground = false) => {
      if (!isBackground) setIsRefreshing(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedStatus !== 'ALL') queryParams.set('status', selectedStatus);
        if (search.trim()) queryParams.set('search', search.trim());

        const res = await fetch(`/api/admin/queries?${queryParams.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch queries');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // Detect newly arrived messages
          if (isBackground && json.counts?.new > counts.new) {
            playNotificationChime();
            showToast(
              `🔔 ${json.counts.new - counts.new} new customer inquiry received!`,
              'success'
            );
          }
          setInquiries(json.data);
          if (json.counts) {
            setCounts(json.counts);
          }
        }
      } catch (err) {
        if (!isBackground) {
          showToast(err instanceof Error ? err.message : 'Error fetching queries', 'error');
        }
      } finally {
        if (!isBackground) setIsRefreshing(false);
      }
    },
    [selectedStatus, search, counts.new, playNotificationChime]
  );

  // Background Live Polling (every 15 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchInquiries(true);
    }, 15000);
    return () => clearInterval(timer);
  }, [fetchInquiries]);

  // Handle status update
  const handleStatusChange = async (
    id: string,
    newStatus: 'NEW' | 'REVIEWED' | 'RESOLVED',
    customNotes?: string
  ) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/queries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, adminNotes: customNotes }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update status');
      }

      setInquiries((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: newStatus,
                adminNotes: customNotes !== undefined ? customNotes : item.adminNotes,
                resolvedAt: newStatus === 'RESOLVED' ? new Date().toISOString() : null,
              }
            : item
        )
      );

      // Re-fetch counts
      fetchInquiries(true);
      showToast(`Query marked as ${newStatus}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Note Save
  const handleSaveNote = async (id: string) => {
    await handleStatusChange(id, inquiries.find((q) => q.id === id)?.status || 'NEW', noteDraft);
    setEditingNotesId(null);
  };

  // Handle Delete
  const handleDelete = async (id: string, customerName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the inquiry from ${customerName}?`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/queries/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete query');
      }

      setInquiries((prev) => prev.filter((item) => item.id !== id));
      showToast('Query deleted from database');
      fetchInquiries(true);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered inquiries on client side for instant search responsiveness
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((q) => {
      if (selectedStatus !== 'ALL' && q.status !== selectedStatus) return false;
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      return (
        q.name.toLowerCase().includes(s) ||
        q.email.toLowerCase().includes(s) ||
        (q.phone && q.phone.includes(s)) ||
        q.subject.toLowerCase().includes(s) ||
        q.message.toLowerCase().includes(s)
      );
    });
  }, [inquiries, selectedStatus, search]);

  const formatRemainingDays = (expiresAtStr: string) => {
    const diff = new Date(expiresAtStr).getTime() - Date.now();
    if (diff <= 0)
      return { text: 'Purging soon', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days >= 4) {
      return {
        text: `${days} days left`,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      };
    }
    if (days >= 2) {
      return {
        text: `${days}d ${hours}h left`,
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      };
    }
    return {
      text: `${hours}h remaining`,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    };
  };

  const cleanPhoneForWhatsApp = (rawPhone?: string | null) => {
    if (!rawPhone) return '';
    let digits = rawPhone.replace(/[^\d]/g, '');
    if (digits.startsWith('0')) digits = '88' + digits;
    return digits;
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl backdrop-blur-md transition-all ${
            toastMessage.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-950/90 text-emerald-200 shadow-emerald-950/50'
              : 'border-red-500/30 bg-red-950/90 text-red-200 shadow-red-950/50'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Auto-Purge Policy Notice */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">Check Query</h1>
            <span className="flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
              Live Feed
            </span>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Incoming customer messages from the Contact Us storefront atelier.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              soundEnabled
                ? 'border-white/10 bg-white/[0.04] text-white/80 hover:bg-white/[0.08]'
                : 'border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20'
            }`}
            title={soundEnabled ? 'Chime sound is active' : 'Sound is muted'}
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
          </button>

          <button
            onClick={() => fetchInquiries(false)}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/80 transition-all hover:bg-white/[0.08] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 7-Day Auto Cleanup Notice Banner */}
      <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-black/40 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500/30">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white/90">
              7-Day Smart Memory Protection (Auto-Purge Policy)
            </p>
            <p className="text-[11px] text-white/45">
              To keep hosting storage lightweight and superfast, all customer queries are
              automatically and permanently deleted 7 days after arrival.
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-1.5 text-right sm:flex">
          <Clock className="h-3.5 w-3.5 text-indigo-400" />
          <span className="text-[11px] font-medium text-white/70">TTL: 7 Days</span>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {/* Total Active */}
        <div
          onClick={() => setSelectedStatus('ALL')}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
            selectedStatus === 'ALL'
              ? 'border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-950/30'
              : 'border-white/[0.07] bg-[#111113] hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">
              All Queries
            </span>
            <Inbox className="h-4 w-4 text-white/30" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-white">{counts.total}</p>
          <p className="mt-0.5 text-[10px] text-white/40">Within 7-day window</p>
        </div>

        {/* New / Unread */}
        <div
          onClick={() => setSelectedStatus('NEW')}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
            selectedStatus === 'NEW'
              ? 'border-rose-500/50 bg-rose-500/10 shadow-lg shadow-rose-950/30'
              : 'border-white/[0.07] bg-[#111113] hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-rose-300">
              New Unread
            </span>
            <span className="relative flex h-2.5 w-2.5">
              {counts.new > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex h-2.5 w-2.5 rounded-full ${counts.new > 0 ? 'bg-rose-500' : 'bg-white/20'}`}
              />
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-rose-400">{counts.new}</p>
          <p className="mt-0.5 text-[10px] text-rose-300/60">Requires attention</p>
        </div>

        {/* Reviewed */}
        <div
          onClick={() => setSelectedStatus('REVIEWED')}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
            selectedStatus === 'REVIEWED'
              ? 'border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-950/30'
              : 'border-white/[0.07] bg-[#111113] hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">
              Under Review
            </span>
            <Clock className="h-4 w-4 text-amber-400/50" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-amber-400">{counts.reviewed}</p>
          <p className="mt-0.5 text-[10px] text-amber-300/60">Follow-up ongoing</p>
        </div>

        {/* Resolved */}
        <div
          onClick={() => setSelectedStatus('RESOLVED')}
          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
            selectedStatus === 'RESOLVED'
              ? 'border-emerald-500/50 bg-emerald-500/10 shadow-lg shadow-emerald-950/30'
              : 'border-white/[0.07] bg-[#111113] hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
              Resolved
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400/50" />
          </div>
          <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-400">
            {counts.resolved}
          </p>
          <p className="mt-0.5 text-[10px] text-emerald-300/60">Customer answered</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-white/[0.07] bg-[#111113] p-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Status Pills */}
        <div className="flex flex-wrap gap-1.5">
          {(['ALL', 'NEW', 'REVIEWED', 'RESOLVED'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                selectedStatus === status
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
              }`}
            >
              {status === 'ALL'
                ? `All (${counts.total})`
                : status === 'NEW'
                  ? `New (${counts.new})`
                  : status === 'REVIEWED'
                    ? `Under Review (${counts.reviewed})`
                    : `Resolved (${counts.resolved})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email..."
            className="w-full rounded-lg border border-white/10 bg-white/[0.03] py-1.5 pl-9 pr-3 text-xs text-white placeholder-white/30 transition-colors focus:border-indigo-500/50 focus:bg-white/[0.06] focus:outline-none"
          />
        </div>
      </div>

      {/* Inquiries List */}
      {filteredInquiries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-[#111113] py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05] text-white/30">
            <MessageSquare className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-white/90">No Customer Queries Found</h3>
          <p className="mt-1 max-w-sm text-xs text-white/40">
            {search
              ? 'No inquiries match your current search query.'
              : selectedStatus !== 'ALL'
                ? `No inquiries currently marked as ${selectedStatus}.`
                : 'When visitors send inquiries from the Contact Us form, they will appear here in real-time.'}
          </p>
          {(search || selectedStatus !== 'ALL') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedStatus('ALL');
              }}
              className="mt-4 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInquiries.map((item) => {
            const ttl = formatRemainingDays(item.expiresAt);
            const waNumber = cleanPhoneForWhatsApp(item.phone);
            const isEditingNote = editingNotesId === item.id;
            const isBusy = updatingId === item.id || deletingId === item.id;

            return (
              <div
                key={item.id}
                className={`relative overflow-hidden rounded-xl border bg-[#111113] p-5 transition-all duration-200 ${
                  item.status === 'NEW'
                    ? 'border-rose-500/30 shadow-md shadow-rose-950/20'
                    : item.status === 'REVIEWED'
                      ? 'border-amber-500/30'
                      : 'border-white/[0.07] opacity-90'
                }`}
              >
                {/* Status indicator strip on left */}
                <div
                  className={`absolute bottom-0 left-0 top-0 w-1 ${
                    item.status === 'NEW'
                      ? 'bg-rose-500'
                      : item.status === 'REVIEWED'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                />

                <div className="flex flex-col gap-4">
                  {/* Top Bar: Customer Name, Status Badge, TTL Countdown, Actions */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{item.name}</h3>
                          {item.status === 'NEW' && (
                            <span className="rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                              NEW UNREAD
                            </span>
                          )}
                          {item.status === 'REVIEWED' && (
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                              UNDER REVIEW
                            </span>
                          )}
                          {item.status === 'RESOLVED' && (
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                              RESOLVED
                            </span>
                          )}
                        </div>

                        {/* Submission Time & Remaining TTL */}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-white/40">
                          <span>
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <span>•</span>
                          <span
                            className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${ttl.color}`}
                            title={`Auto-purges at: ${new Date(item.expiresAt).toLocaleString()}`}
                          >
                            ⏳ {ttl.text}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Communication Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* WhatsApp Button */}
                      {waNumber && (
                        <a
                          href={`https://wa.me/${waNumber}?text=Hello%20${encodeURIComponent(
                            item.name
                          )}%2C%20this%20is%20Gents%20Hood%20Atelier%20regarding%20your%20inquiry.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
                          title="Open WhatsApp Chat"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {/* Phone Call Button */}
                      {item.phone && (
                        <a
                          href={`tel:${item.phone}`}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/[0.08]"
                          title="Call Customer"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{item.phone}</span>
                        </a>
                      )}

                      {/* Email Button */}
                      <a
                        href={`mailto:${item.email}?subject=Re:%20${encodeURIComponent(
                          item.subject
                        )}%20—%20Gents%20Hood`}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-semibold text-white/80 transition-all hover:bg-white/[0.08]"
                        title="Send Email"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        <span className="hidden md:inline">{item.email}</span>
                      </a>

                      {/* Manual Delete Button */}
                      <button
                        onClick={() => handleDelete(item.id, item.name)}
                        disabled={isBusy}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.02] text-white/40 transition-all hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        title="Permanently Delete Inquiry"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Subject and Message Body */}
                  <div className="rounded-lg border border-white/[0.06] bg-black/30 p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                        Subject:
                      </span>
                      <p className="text-xs font-bold text-white/95">{item.subject}</p>
                    </div>

                    <p className="mt-2.5 whitespace-pre-wrap text-xs leading-relaxed text-white/80">
                      {item.message}
                    </p>
                  </div>

                  {/* Admin Notes Section */}
                  <div className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-white/40" />
                        <span className="text-[11px] font-medium text-white/50">
                          Internal Admin Note (Optional)
                        </span>
                      </div>
                      {!isEditingNote && (
                        <button
                          onClick={() => {
                            setEditingNotesId(item.id);
                            setNoteDraft(item.adminNotes || '');
                          }}
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          {item.adminNotes ? 'Edit Note' : '+ Add Note'}
                        </button>
                      )}
                    </div>

                    {isEditingNote ? (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={noteDraft}
                          onChange={(e) => setNoteDraft(e.target.value)}
                          placeholder="e.g. Called customer on WhatsApp, verified custom size request..."
                          rows={2}
                          className="w-full rounded-lg border border-white/10 bg-black/40 p-2.5 text-xs text-white placeholder-white/30 focus:border-indigo-500 focus:outline-none"
                        />
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setEditingNotesId(null)}
                            className="rounded px-2 py-1 text-[11px] text-white/50 hover:text-white"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(item.id)}
                            disabled={isBusy}
                            className="rounded bg-indigo-600 px-3 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : item.adminNotes ? (
                      <p className="mt-1.5 text-xs italic text-white/70">
                        &ldquo;{item.adminNotes}&rdquo;
                      </p>
                    ) : null}
                  </div>

                  {/* Bottom Action Footer: Change Status */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                    <span className="text-[11px] font-medium text-white/40">
                      Change Query Status:
                    </span>
                    <div className="flex items-center gap-1.5">
                      {item.status !== 'NEW' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'NEW')}
                          disabled={isBusy}
                          className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/60 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                        >
                          Revert to New
                        </button>
                      )}

                      {item.status !== 'REVIEWED' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'REVIEWED')}
                          disabled={isBusy}
                          className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                        >
                          <Clock className="h-3 w-3" />
                          <span>Mark In Review</span>
                        </button>
                      )}

                      {item.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleStatusChange(item.id, 'RESOLVED')}
                          disabled={isBusy}
                          className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                          <span>Mark Resolved</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
