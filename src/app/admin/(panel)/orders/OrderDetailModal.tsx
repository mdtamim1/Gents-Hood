'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  MapPin,
  Package,
  Edit2,
  Save,
  Loader2,
  ChevronDown,
  Truck,
  User,
  FileText,
  History,
  Check,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AppealFormModal, OrderAppealData } from './AppealFormModal';

interface ActivityLog {
  id: string;
  action: string;
  adminName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  createdAt: string;
}

interface OrderItem {
  id: string;
  nameSnapshot: string;
  sizeSnapshot?: string | null;
  colorSnapshot?: string | null;
  priceSnapshot: number;
  qty: number;
  imageSnapshot?: string | null;
}

interface Order {
  id: string;
  orderNo: string;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  manualDiscount: number;
  paidAmount: number;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingDistrict: string;
  shippingArea: string;
  shippingAddress: string;
  note?: string | null;
  shopNote?: string | null;
  courierEntryDone: boolean;
  courierName?: string | null;
  courierTrackingNo?: string | null;
  assignedTo?: { id: string; name: string; displayColor: string } | null;
  appealStatus?: string | null;
  appeals?: Array<{
    id: string;
    reason: string;
    note: string;
    status: string;
    staffName: string;
    createdAt: string;
  }>;
  items: OrderItem[];
  activityLogs: ActivityLog[];
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  PROCESSING: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  SHIPPED: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/25',
  RETURNED: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const ACTION_COLORS: Record<string, string> = {
  CREATED: 'text-emerald-400',
  ASSIGNED: 'text-blue-400',
  STATUS_CHANGED: 'text-purple-400',
  EDITED: 'text-amber-400',
  COURIER_ENTERED: 'text-indigo-400',
  NOTE_ADDED: 'text-white/60',
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
}

interface OrderDetailModalProps {
  orderId: string;
  onClose: () => void;
  onUpdate: () => void;
  staffList: Array<{ id: string; name: string; displayColor: string; isOnline?: boolean }>;
  isOwner: boolean;
}

export function OrderDetailModal({
  orderId,
  onClose,
  onUpdate,
  staffList,
  isOwner,
}: OrderDetailModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Order>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);

  const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'RETURNED'];

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (data.success) {
        setOrder(data.order);
        setEditForm({
          shippingName: data.order.shippingName,
          shippingPhone: data.order.shippingPhone,
          shippingDistrict: data.order.shippingDistrict,
          shippingArea: data.order.shippingArea,
          shippingAddress: data.order.shippingAddress,
          note: data.order.note,
          shopNote: data.order.shopNote,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsSavingStatus(true);
    setShowStatusDropdown(false);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      await loadOrder();
      onUpdate();
    } finally {
      setIsSavingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteInput.trim()) return;
    setIsSavingNote(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activityNote: noteInput }),
      });
      setNoteInput('');
      await loadOrder();
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      setIsEditing(false);
      await loadOrder();
      onUpdate();
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleAssign = async (staffId: string) => {
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToId: staffId }),
    });
    await loadOrder();
    onUpdate();
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <Loader2 className="relative z-10 h-8 w-8 animate-spin text-white/40" />
      </div>
    );
  }

  if (!order) return null;

  const statusStyle = STATUS_STYLES[order.status] || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[16px] font-bold text-white">{order.orderNo}</span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle}`}
                >
                  {order.status}
                </span>

                {/* Appeal Badge */}
                {order.appealStatus === 'PENDING' && (
                  <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-bold text-amber-300 animate-pulse">
                    <ShieldAlert className="h-3 w-3" />
                    Appeal Pending
                  </span>
                )}
                {order.appealStatus === 'APPROVED' && (
                  <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" />
                    Appealed
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/35">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Appeal Button */}
            <button
              type="button"
              onClick={() => setShowAppealModal(true)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-all ${
                order.appealStatus === 'PENDING'
                  ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                  : 'border-white/[0.1] bg-white/[0.05] text-white/70 hover:bg-white/[0.08] hover:text-white'
              }`}
              title={order.appealStatus === 'PENDING' ? 'Appeal is pending review' : 'Submit customer appeal / problem'}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{order.appealStatus === 'PENDING' ? 'In Review' : 'Appeal'}</span>
            </button>

            {/* Status change */}
            <div className="relative">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={isSavingStatus}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-2 text-[12px] font-medium text-white/70 transition-all hover:bg-white/[0.08]"
              >
                {isSavingStatus ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                Change Status
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              {showStatusDropdown && (
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-white/[0.1] bg-[#1a1a1d] shadow-xl">
                  {STATUSES.filter((s) => s !== order.status).map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`flex w-full items-center gap-2 px-4 py-2.5 text-[12px] font-medium hover:bg-white/[0.06] ${
                        STATUS_STYLES[s]?.split(' ').find((c) => c.startsWith('text-')) ||
                        'text-white/70'
                      }`}
                    >
                      → {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white/70">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Pending Appeal Notice */}
        {order.appealStatus === 'PENDING' && (
          <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-6 py-2.5 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Appeal in progress:</strong> This order is currently under Admin verification. Duplicate appeals are blocked.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowAppealModal(true)}
              className="font-semibold underline hover:text-white"
            >
              View Appeal
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-white/[0.06]">
          {(['details', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-6 py-3 text-[12px] font-semibold capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-indigo-400 text-indigo-300'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tab === 'details' ? (
                <FileText className="h-3.5 w-3.5" />
              ) : (
                <History className="h-3.5 w-3.5" />
              )}
              {tab === 'details' ? 'Order Details' : `History (${order.activityLogs.length})`}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' ? (
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Left: Customer + Products */}
              <div className="space-y-4">
                {/* Customer */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                      <User className="h-3.5 w-3.5" />
                      Customer
                    </h3>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-1.5 text-[11px] text-white/35 hover:text-indigo-400"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsEditing(false)}
                          className="text-[11px] text-white/35 hover:text-white/60"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={isSavingEdit}
                          className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300"
                        >
                          {isSavingEdit ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Save className="h-3 w-3" />
                          )}
                          Save
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2.5">
                      <input
                        value={editForm.shippingName || ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, shippingName: e.target.value }))
                        }
                        placeholder="Name"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-[13px] text-white outline-none"
                      />
                      <input
                        value={editForm.shippingPhone || ''}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            shippingPhone: e.target.value.replace(/\D/g, '').slice(0, 11),
                          }))
                        }
                        placeholder="Phone"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-[13px] text-white outline-none"
                      />
                      <input
                        value={editForm.shippingDistrict || ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, shippingDistrict: e.target.value }))
                        }
                        placeholder="District"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-[13px] text-white outline-none"
                      />
                      <input
                        value={editForm.shippingAddress || ''}
                        onChange={(e) =>
                          setEditForm((f) => ({ ...f, shippingAddress: e.target.value }))
                        }
                        placeholder="Full Address"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-[13px] text-white outline-none"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-white/25" />
                        <span className="text-[14px] font-semibold text-white">
                          {order.shippingName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 text-white/25" />
                        <a
                          href={`tel:${order.shippingPhone}`}
                          className="text-[13px] text-indigo-300 hover:text-indigo-200"
                        >
                          {order.shippingPhone}
                        </a>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-white/25" />
                        <span className="text-[13px] text-white/60">
                          {[order.shippingAddress, order.shippingArea, order.shippingDistrict]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Products */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    <Package className="h-3.5 w-3.5" />
                    Products ({order.items.length})
                  </h3>
                  <div className="space-y-2.5">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2.5"
                      >
                        {item.imageSnapshot && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageSnapshot}
                            alt={item.nameSnapshot}
                            className="h-10 w-10 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-[13px] font-medium text-white">{item.nameSnapshot}</p>
                          <p className="text-[11px] text-white/40">
                            {[item.sizeSnapshot, item.colorSnapshot].filter(Boolean).join(' · ')} ·
                            Qty: {item.qty}
                          </p>
                        </div>
                        <span className="text-[13px] font-semibold text-white">
                          ৳{(item.priceSnapshot * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                {(order.note || order.shopNote) && (
                  <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                    {order.note && (
                      <div className="mb-3">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Customer Note
                        </p>
                        <p className="mt-1 text-[13px] text-white/70">{order.note}</p>
                      </div>
                    )}
                    {order.shopNote && (
                      <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-white/35">
                          Shop Note
                        </p>
                        <p className="mt-1 text-[13px] text-white/70">{order.shopNote}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Pricing + Courier + Assignment + Note input */}
              <div className="space-y-4">
                {/* Pricing */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    Payment
                  </h3>
                  <div className="space-y-2">
                    {[
                      { label: 'Subtotal', value: `৳${order.subtotal.toLocaleString()}` },
                      { label: 'Delivery', value: `৳${order.deliveryCharge.toLocaleString()}` },
                      {
                        label: 'Discount',
                        value: `−৳${(order.discount + order.manualDiscount).toLocaleString()}`,
                      },
                      { label: 'Paid', value: `৳${order.paidAmount.toLocaleString()}` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex justify-between text-[13px]">
                        <span className="text-white/40">{label}</span>
                        <span className="text-white/70">{value}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/[0.08] pt-2">
                      <div className="flex justify-between">
                        <span className="text-[14px] font-bold text-white">Total</span>
                        <span className="text-[14px] font-bold text-indigo-400">
                          ৳{order.total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/50">
                        {order.paymentMethod}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Courier info */}
                {order.courierEntryDone && (
                  <div className="rounded-xl border border-purple-500/20 bg-purple-500/[0.07] p-4">
                    <h3 className="mb-2 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-purple-400">
                      <Truck className="h-3.5 w-3.5" />
                      Courier Details
                    </h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[13px]">
                        <span className="text-white/40">Courier</span>
                        <span className="font-semibold text-white">{order.courierName}</span>
                      </div>
                      {order.courierTrackingNo && (
                        <div className="flex justify-between text-[13px]">
                          <span className="text-white/40">Tracking</span>
                          <span className="font-mono text-white/80">{order.courierTrackingNo}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Assigned staff */}
                {isOwner && (
                  <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                    <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                      Assigned To
                    </h3>
                    <div className="space-y-1.5">
                      {order.assignedTo ? (
                        <div className="flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: order.assignedTo.displayColor }}
                          />
                          <span className="text-[13px] font-medium text-white/80">
                            {order.assignedTo.name}
                          </span>
                          <Check className="ml-auto h-3.5 w-3.5 text-emerald-400" />
                        </div>
                      ) : (
                        <p className="text-[13px] text-white/30">Not assigned</p>
                      )}
                      <p className="text-[11px] text-white/30">Reassign to (Online Staff only):</p>
                      <div className="flex flex-wrap gap-1.5">
                        {staffList.filter((s) => s.isOnline).length === 0 ? (
                          <p className="text-[11px] text-amber-400/80">No online staff available to assign</p>
                        ) : (
                          staffList
                            .filter((s) => s.isOnline)
                            .map((s) => (
                              <button
                                key={s.id}
                                onClick={() => handleAssign(s.id)}
                                className="flex items-center gap-1.5 rounded-full border border-white/[0.1] px-2.5 py-1 text-[11px] text-white/70 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-white"
                                title={`${s.name} (Online)`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span
                                  className="h-2 w-2 rounded-full"
                                  style={{ backgroundColor: s.displayColor }}
                                />
                                {s.name}
                              </button>
                            ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Add note */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    Add Note
                  </h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                      placeholder="Write a note or update..."
                      className="flex-1 rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50"
                    />
                    <button
                      onClick={handleAddNote}
                      disabled={isSavingNote || !noteInput.trim()}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-500/20 px-3 py-2 text-[12px] font-semibold text-indigo-300 hover:bg-indigo-500/30 disabled:opacity-50"
                    >
                      {isSavingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Add'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* History Tab */
            <div className="space-y-3">
              {order.activityLogs.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-white/30">No activity logged yet</p>
              ) : (
                order.activityLogs.map((log, idx) => (
                  <div key={log.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${
                          idx === 0
                            ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-400'
                            : 'border-white/[0.08] bg-white/[0.04] text-white/30'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      {idx < order.activityLogs.length - 1 && (
                        <div className="mt-1 h-full w-px bg-white/[0.06]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[12px] font-semibold ${ACTION_COLORS[log.action] || 'text-white/60'}`}
                        >
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] text-white/30">
                          by {log.adminName || 'System'}
                        </span>
                      </div>
                      {(log.oldValue || log.newValue) && (
                        <p className="mt-0.5 text-[11px] text-white/40">
                          {log.oldValue && (
                            <span className="text-red-400/70">− {log.oldValue}</span>
                          )}
                          {log.oldValue && log.newValue && <span> → </span>}
                          {log.newValue && (
                            <span className="text-emerald-400/70">+ {log.newValue}</span>
                          )}
                        </p>
                      )}
                      {log.note && <p className="mt-0.5 text-[12px] text-white/55">{log.note}</p>}
                      <p className="mt-0.5 text-[10px] text-white/25">
                        {formatDate(log.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {showAppealModal && (
        <AppealFormModal
          order={order as unknown as OrderAppealData}
          onClose={() => setShowAppealModal(false)}
          onSuccess={async () => {
            setShowAppealModal(false);
            await loadOrder();
            onUpdate();
          }}
        />
      )}
    </div>
  );
}
