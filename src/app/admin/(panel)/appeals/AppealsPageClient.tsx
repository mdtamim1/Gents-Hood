'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Phone,
  Filter,
  Check,
  X,
  Loader2,
  ExternalLink,
  ShoppingBag,
  Plus,
} from 'lucide-react';
import { CreateAppealModal } from './CreateAppealModal';

export interface AppealItem {
  id: string;
  orderId: string;
  staffId: string;
  staffName: string;
  staffColor?: string | null;
  reason: string;
  note: string;
  customerPhone?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string | null;
  adminName?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  order: {
    id: string;
    orderNo: string;
    status: string;
    total: number;
    shippingName: string;
    shippingPhone: string;
    shippingDistrict?: string;
    shippingAddress?: string;
    assignedToId?: string | null;
    assignedTo?: { id: string; name: string; displayColor?: string } | null;
    createdAt: string;
  };
  staff?: {
    id: string;
    name: string;
    displayColor?: string;
  } | null;
}

interface AppealsPageClientProps {
  initialAppeals: AppealItem[];
  initialCounts: {
    pending: number;
    approved: number;
    rejected: number;
    all: number;
  };
  isOwner: boolean;
  currentUserId: string;
}

export function AppealsPageClient({
  initialAppeals,
  initialCounts,
  isOwner,
  currentUserId: _currentUserId,
}: AppealsPageClientProps) {
  const [appeals, setAppeals] = useState<AppealItem[]>(initialAppeals);
  const [counts, setCounts] = useState(initialCounts);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [search, setSearch] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    appeal: AppealItem;
    type: 'APPROVE' | 'REJECT';
  } | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const refreshAppeals = async () => {
    try {
      const res = await fetch('/api/admin/appeals');
      const data = await res.json();
      if (data.success) {
        setAppeals(data.appeals);
        setCounts(data.counts);
      }
    } catch (err) {
      console.error('Failed to refresh appeals:', err);
    }
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleReviewAction = async (appealId: string, action: 'APPROVE' | 'REJECT', note?: string) => {
    setProcessingId(appealId);
    try {
      const res = await fetch(`/api/admin/appeals/${appealId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          adminNote: note || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to process review');
      }

      showToast(data.message || (action === 'APPROVE' ? 'Appeal approved!' : 'Appeal rejected.'));
      setActionModal(null);
      setAdminNoteInput('');
      await refreshAppeals();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error reviewing appeal');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAppeals = useMemo(() => {
    return appeals.filter((appeal) => {
      // Tab filter
      if (activeTab !== 'ALL' && appeal.status !== activeTab) {
        return false;
      }

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchesOrder =
          appeal.order.orderNo.toLowerCase().includes(q) ||
          appeal.order.shippingName.toLowerCase().includes(q) ||
          appeal.order.shippingPhone.includes(q) ||
          (appeal.customerPhone && appeal.customerPhone.includes(q));
        const matchesStaff = appeal.staffName.toLowerCase().includes(q);
        const matchesReason = appeal.reason.toLowerCase().includes(q) || appeal.note.toLowerCase().includes(q);
        if (!matchesOrder && !matchesStaff && !matchesReason) return false;
      }

      return true;
    });
  }, [appeals, activeTab, search]);

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('en-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(dateStr));
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-[#111113] px-4 py-3 text-[13px] font-semibold text-emerald-400 shadow-2xl backdrop-blur-md">
          <CheckCircle2 className="h-4 w-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-amber-400">
              <ShieldAlert className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-white">Order Appeals & Issue Desk</h1>
          </div>
          <p className="mt-1 text-[12px] text-white/40">
            Staff submit customer complaint appeals here. Admin verifies and approves directly into the staff&apos;s processing queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-[12px] font-bold text-black shadow-lg shadow-amber-500/20 transition-all hover:from-amber-400 hover:to-amber-500"
          >
            <Plus className="h-4 w-4" />
            <span>Create Appeal</span>
          </button>

          <Link
            href="/admin/orders"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-[12px] font-medium text-white/70 hover:bg-white/[0.07] hover:text-white"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Go to Orders</span>
          </Link>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div
          onClick={() => setActiveTab('PENDING')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            activeTab === 'PENDING'
              ? 'border-amber-500/40 bg-amber-500/10 shadow-lg shadow-amber-500/5'
              : 'border-white/[0.06] bg-[#111113] hover:border-white/[0.12]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-amber-400">
              Pending Review
            </span>
            <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-300">{counts.pending}</p>
          <p className="mt-1 text-[10px] text-white/40">Awaiting admin verification</p>
        </div>

        <div
          onClick={() => setActiveTab('APPROVED')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            activeTab === 'APPROVED'
              ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/5'
              : 'border-white/[0.06] bg-[#111113] hover:border-white/[0.12]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-400">
              Approved
            </span>
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-300">{counts.approved}</p>
          <p className="mt-1 text-[10px] text-white/40">Assigned to staff processing</p>
        </div>

        <div
          onClick={() => setActiveTab('REJECTED')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            activeTab === 'REJECTED'
              ? 'border-red-500/40 bg-red-500/10 shadow-lg shadow-red-500/5'
              : 'border-white/[0.06] bg-[#111113] hover:border-white/[0.12]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-red-400">
              Rejected
            </span>
            <XCircle className="h-3.5 w-3.5 text-red-400" />
          </div>
          <p className="mt-2 text-2xl font-black text-red-300">{counts.rejected}</p>
          <p className="mt-1 text-[10px] text-white/40">Declined by admin</p>
        </div>

        <div
          onClick={() => setActiveTab('ALL')}
          className={`cursor-pointer rounded-2xl border p-4 transition-all ${
            activeTab === 'ALL'
              ? 'border-indigo-500/40 bg-indigo-500/10 shadow-lg shadow-indigo-500/5'
              : 'border-white/[0.06] bg-[#111113] hover:border-white/[0.12]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wider text-white/50">
              Total Appeals
            </span>
            <Filter className="h-3.5 w-3.5 text-white/40" />
          </div>
          <p className="mt-2 text-2xl font-black text-white">{counts.all}</p>
          <p className="mt-1 text-[10px] text-white/40">All customer disputes</p>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex rounded-xl border border-white/[0.06] bg-[#111113] p-1 text-[12px] font-medium">
          {(
            [
              { id: 'PENDING', label: `Pending (${counts.pending})` },
              { id: 'APPROVED', label: `Approved (${counts.approved})` },
              { id: 'REJECTED', label: `Rejected (${counts.rejected})` },
              { id: 'ALL', label: `All (${counts.all})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-3.5 py-1.5 transition-all ${
                activeTab === tab.id
                  ? 'bg-white/[0.1] font-semibold text-white shadow'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order ID, phone, staff, note..."
            className="w-full rounded-xl border border-white/[0.08] bg-[#111113] py-2 pl-9 pr-3 text-[12px] text-white placeholder-white/25 outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Appeals List */}
      {filteredAppeals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-[#111113] py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-white/30">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-[14px] font-semibold text-white">No appeals found</h3>
          <p className="mt-1 text-[12px] text-white/40">
            {activeTab === 'PENDING'
              ? 'Great job! There are no pending appeals awaiting admin review.'
              : 'No appeals match your search or filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAppeals.map((appeal) => {
            const isPending = appeal.status === 'PENDING';
            const isApproved = appeal.status === 'APPROVED';
            const isRejected = appeal.status === 'REJECTED';

            return (
              <div
                key={appeal.id}
                className={`relative overflow-hidden rounded-2xl border bg-[#111113] p-5 transition-all ${
                  isPending
                    ? 'border-amber-500/25 bg-gradient-to-r from-amber-500/[0.03] to-transparent'
                    : isApproved
                      ? 'border-emerald-500/20'
                      : 'border-white/[0.06]'
                }`}
              >
                {/* Top Row: Order info + Status */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.04] pb-3.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Link
                      href={`/admin/orders?search=${appeal.order.orderNo}`}
                      className="group flex items-center gap-1.5 font-mono text-[14px] font-bold text-amber-300 hover:text-amber-200"
                    >
                      <span>{appeal.order.orderNo}</span>
                      <ExternalLink className="h-3 w-3 text-white/30 group-hover:text-amber-300" />
                    </Link>

                    <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold text-white/70">
                      Order: {appeal.order.status}
                    </span>

                    <span className="text-[12px] font-bold text-emerald-400">
                      ৳{appeal.order.total.toLocaleString('en-BD')}
                    </span>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    {isPending && (
                      <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-[11px] font-bold text-amber-300">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                        Pending Verification
                      </span>
                    )}
                    {isApproved && (
                      <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-400">
                        <Check className="h-3 w-3" />
                        Approved & Assigned
                      </span>
                    )}
                    {isRejected && (
                      <span className="flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-500/15 px-3 py-1 text-[11px] font-bold text-red-400">
                        <X className="h-3 w-3" />
                        Rejected
                      </span>
                    )}
                    <span className="text-[10px] text-white/30">
                      {formatDate(appeal.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Middle Grid: Staff & Customer Info + Reason Note */}
                <div className="mt-4 grid gap-4 lg:grid-cols-12">
                  {/* Left Column: Customer & Staff Info (5 cols) */}
                  <div className="space-y-3 lg:col-span-5">
                    {/* Customer */}
                    <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3 text-[12px]">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-white/30">
                        Customer Details
                      </p>
                      <div className="mt-1.5 space-y-1">
                        <p className="font-semibold text-white">{appeal.order.shippingName}</p>
                        <div className="flex items-center gap-1.5 text-white/60 font-mono text-[11px]">
                          <Phone className="h-3 w-3 text-white/30" />
                          <span>{appeal.customerPhone || appeal.order.shippingPhone}</span>
                        </div>
                        {appeal.order.shippingDistrict && (
                          <p className="text-[11px] text-white/40">
                            {appeal.order.shippingDistrict}
                            {appeal.order.shippingAddress ? ` · ${appeal.order.shippingAddress}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Staff who appealed */}
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-white/[0.02] px-3 py-2 text-[12px]">
                      <div>
                        <p className="text-[10px] font-medium text-white/30">Appealed By Staff</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div
                            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white shadow"
                            style={{ backgroundColor: appeal.staffColor || '#6366f1' }}
                          >
                            {appeal.staffName.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-semibold text-white">{appeal.staffName}</span>
                        </div>
                      </div>

                      {/* Current Order Assignment */}
                      <div className="text-right">
                        <p className="text-[10px] text-white/30">Current Order Assignee</p>
                        <span className="text-[11px] font-medium text-white/70">
                          {appeal.order.assignedTo?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Appeal Reason & Detailed Note (7 cols) */}
                  <div className="flex flex-col justify-between space-y-3 lg:col-span-7">
                    <div className="rounded-xl border border-white/[0.06] bg-[#0c0c0e] p-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300">
                          📌 {appeal.reason}
                        </span>
                        <span className="text-[10px] text-white/30">Staff Problem Note</span>
                      </div>
                      <p className="mt-2.5 whitespace-pre-wrap text-[12px] leading-relaxed text-white/80">
                        {appeal.note}
                      </p>
                    </div>

                    {/* Admin Review Note (if reviewed) */}
                    {(appeal.adminNote || isApproved || isRejected) && (
                      <div
                        className={`rounded-xl border p-3 text-[11px] ${
                          isApproved
                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
                            : 'border-red-500/20 bg-red-500/10 text-red-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold">
                            {isApproved ? '✓ Admin Approved & Transferred' : '✕ Admin Rejected'}
                          </span>
                          {appeal.reviewedAt && (
                            <span className="text-[10px] opacity-75">{formatDate(appeal.reviewedAt)}</span>
                          )}
                        </div>
                        {appeal.adminNote && (
                          <p className="mt-1 text-white/80 italic">&ldquo;{appeal.adminNote}&rdquo;</p>
                        )}
                        {isApproved && (
                          <p className="mt-1 font-semibold text-emerald-400">
                            → Order set to PROCESSING and assigned to {appeal.staffName}&apos;s panel.
                          </p>
                        )}
                      </div>
                    )}

                    {/* Admin Actions (Owner Only & Pending) */}
                    {isOwner && isPending && (
                      <div className="flex items-center justify-end gap-2.5 pt-2">
                        <button
                          type="button"
                          disabled={processingId === appeal.id}
                          onClick={() => setActionModal({ appeal, type: 'REJECT' })}
                          className="flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3.5 py-2 text-[12px] font-semibold text-red-400 hover:bg-red-500/15 disabled:opacity-50"
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>Reject</span>
                        </button>
                        <button
                          type="button"
                          disabled={processingId === appeal.id}
                          onClick={() => setActionModal({ appeal, type: 'APPROVE' })}
                          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-2 text-[12px] font-bold text-black shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-500 disabled:opacity-50"
                        >
                          {processingId === appeal.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-black" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-black" />
                          )}
                          <span>Approve & Assign to {appeal.staffName}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal (Approve / Reject Dialog) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setActionModal(null)} />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111113] p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <h3 className="text-[15px] font-bold text-white">
                {actionModal.type === 'APPROVE'
                  ? `Approve Appeal for ${actionModal.appeal.order.orderNo}`
                  : `Reject Appeal for ${actionModal.appeal.order.orderNo}`}
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="text-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {actionModal.type === 'APPROVE' ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-[12px] text-emerald-300">
                  <p className="font-semibold">Automatic Workflow Action:</p>
                  <p className="mt-1 text-emerald-200/80">
                    Order <strong>{actionModal.appeal.order.orderNo}</strong> will be moved to{' '}
                    <strong>PROCESSING</strong> and assigned directly to staff{' '}
                    <strong>{actionModal.appeal.staffName}</strong>.
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-[12px] text-red-300">
                  <p className="font-semibold">Reject Appeal:</p>
                  <p className="mt-1 text-red-200/80">
                    The appeal will be marked as rejected. Staff will be informed with your note below.
                  </p>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[11px] font-medium text-white/60">
                  Admin Resolution Note (Optional)
                </label>
                <textarea
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                  rows={3}
                  placeholder={
                    actionModal.type === 'APPROVE'
                      ? 'e.g. Verified customer details, proceed with delivery change...'
                      : 'e.g. Customer canceled previously or invalid request...'
                  }
                  className="w-full rounded-xl border border-white/[0.08] bg-[#141416] p-2.5 text-[12px] text-white outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="flex-1 rounded-xl border border-white/[0.08] py-2 text-[12px] font-medium text-white/60 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={processingId === actionModal.appeal.id}
                  onClick={() =>
                    handleReviewAction(
                      actionModal.appeal.id,
                      actionModal.type,
                      adminNoteInput.trim()
                    )
                  }
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2 text-[12px] font-bold text-black disabled:opacity-50 ${
                    actionModal.type === 'APPROVE'
                      ? 'bg-emerald-500 hover:bg-emerald-400'
                      : 'bg-red-500 text-white hover:bg-red-400'
                  }`}
                >
                  {processingId === actionModal.appeal.id && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  <span>
                    {actionModal.type === 'APPROVE' ? 'Confirm Approval' : 'Confirm Rejection'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create Appeal Modal */}
      {showCreateModal && (
        <CreateAppealModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(msg) => {
            setShowCreateModal(false);
            showToast(msg);
            refreshAppeals();
          }}
        />
      )}
    </div>
  );
}
