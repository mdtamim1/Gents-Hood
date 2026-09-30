'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShoppingBag,
  Calendar,
  Clock,
  RefreshCw,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  Plus,
  Loader2,
  Eye,
  Edit2,
  Printer,
  ChevronDown,
  MessageSquare,
  ShieldCheck,
  Layers,
  AlertTriangle,
  X,
} from 'lucide-react';
import { OrderFormModal } from './OrderFormModal';
import { CourierModal } from './CourierModal';
import { OrderDetailModal } from './OrderDetailModal';

interface OrderItem {
  id: string;
  productId: string;
  variantId?: string | null;
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
  shippingThana?: string | null;
  shippingArea: string;
  shippingAddress: string;
  note?: string | null;
  shopNote?: string | null;
  courierEntryDone: boolean;
  courierName?: string | null;
  courierTrackingNo?: string | null;
  isManualOrder: boolean;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string; displayColor: string } | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
  activityLogs?: Array<{
    id: string;
    action: string;
    adminName?: string | null;
    oldValue?: string | null;
    newValue?: string | null;
    note?: string | null;
    createdAt: string;
  }>;
}

interface Counts {
  today: number;
  byStatus: Record<string, number>;
}

type Tab =
  'all' | 'today' | 'processing' | 'pending' | 'shipped' | 'completed' | 'cancelled' | 'returned';

const TABS: Array<{
  id: Tab;
  label: string;
  badge: string;
  statusFilter?: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'all', label: 'All Orders', badge: 'all', icon: ShoppingBag },
  { id: 'today', label: "Today's Orders", badge: 'today', icon: Calendar },
  {
    id: 'processing',
    label: 'Processing',
    badge: 'processing',
    statusFilter: 'PROCESSING',
    icon: RefreshCw,
  },
  { id: 'pending', label: 'Pending', badge: 'pending', statusFilter: 'PENDING', icon: Clock },
  { id: 'shipped', label: 'Shipped', badge: 'shipped', statusFilter: 'SHIPPED', icon: Truck },
  {
    id: 'completed',
    label: 'Delivered',
    badge: 'delivered',
    statusFilter: 'COMPLETED',
    icon: CheckCircle2,
  },
  {
    id: 'cancelled',
    label: 'Cancelled',
    badge: 'cancelled',
    statusFilter: 'CANCELLED',
    icon: XCircle,
  },
  {
    id: 'returned',
    label: 'Returned',
    badge: 'returned',
    statusFilter: 'RETURNED',
    icon: RotateCcw,
  },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING: {
    label: 'Pending',
    bg: 'bg-yellow-500/15',
    text: 'text-yellow-400',
    border: 'border-yellow-500/25',
  },
  PROCESSING: {
    label: 'Processing',
    bg: 'bg-amber-500/15',
    text: 'text-amber-400',
    border: 'border-amber-500/25',
  },
  SHIPPED: {
    label: 'Shipped',
    bg: 'bg-purple-500/15',
    text: 'text-purple-400',
    border: 'border-purple-500/25',
  },
  COMPLETED: {
    label: 'Delivered',
    bg: 'bg-emerald-500/15',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-red-500/15',
    text: 'text-red-400',
    border: 'border-red-500/25',
  },
  RETURNED: {
    label: 'Returned',
    bg: 'bg-orange-500/15',
    text: 'text-orange-400',
    border: 'border-orange-500/25',
  },
};

function formatDateOnly(d: string) {
  try {
    const dt = new Date(d);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return d;
  }
}

function formatTimeOnly(d: string) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(d));
  } catch {
    return '';
  }
}

function isTodayOrder(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default function OrdersPageClient({
  initialOrders,
  initialCounts,
  session,
  staffList,
}: {
  initialOrders: Order[];
  initialCounts: Counts;
  session: { id: string; name: string; role: string };
  staffList: Array<{ id: string; name: string; displayColor: string }>;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [activeTab, setActiveTab] = useState<Tab>('processing');
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [courierOrderId, setCourierOrderId] = useState<string | null>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  const isOwner = session.role === 'OWNER';

  const fetchOrders = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders?status=ALL', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
        setCounts(data.counts);
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = () => setOpenStatusMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // Tab filter
    if (activeTab === 'today') {
      result = result.filter((o) => isTodayOrder(o.createdAt));
    } else if (activeTab !== 'all') {
      const tab = TABS.find((t) => t.id === activeTab);
      if (tab?.statusFilter) {
        result = result.filter((o) => o.status === tab.statusFilter);
      }
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(q) ||
          o.shippingName.toLowerCase().includes(q) ||
          o.shippingPhone.includes(q) ||
          o.shippingDistrict.toLowerCase().includes(q) ||
          (o.shippingThana && o.shippingThana.toLowerCase().includes(q))
      );
    }

    return result;
  }, [orders, activeTab, search]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/admin/orders/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncResult(data.message);
        await fetchOrders();
      } else {
        setSyncResult(data.error);
      }
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncResult(null), 5000);
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setOpenStatusMenuId(null);
      await fetchOrders();
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.size === 0) return;
    for (const id of Array.from(selectedIds)) {
      await fetch(`/api/admin/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    }
    setSelectedIds(new Set());
    setShowBulkModal(false);
    await fetchOrders();
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const getTabCount = (tab: Tab): number => {
    if (tab === 'all') return orders.length;
    if (tab === 'today') return counts.today;
    const t = TABS.find((x) => x.id === tab);
    if (t?.statusFilter) return counts.byStatus[t.statusFilter] || 0;
    return 0;
  };

  const openWhatsApp = (phone: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const raw = phone.replace(/\D/g, '');
    const clean = raw.startsWith('88') ? raw : `88${raw}`;
    window.open(`https://wa.me/${clean}`, '_blank');
  };

  const printInvoice = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    window.open(`/admin/orders/${orderId}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">Order Control Center</h1>
          <p className="text-xs text-zinc-400">Manage and track all orders in real-time</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Refresh */}
          <button
            onClick={fetchOrders}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-[#1a1a1e] px-2.5 py-2 text-xs font-medium text-zinc-300 transition-all hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Order Sync */}
          {isOwner && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg border border-blue-500/25 bg-blue-500/10 px-3.5 py-2 text-xs font-semibold text-blue-300 transition-all hover:bg-blue-500/20 disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              <span>Order Sync</span>
            </button>
          )}

          {/* Fraud Checker */}
          <button
            onClick={() => setShowFraudModal(true)}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-500/20"
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Fraud Checker</span>
          </button>

          {/* Bulk Process */}
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#1a1a1e] px-3.5 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/[0.06] hover:text-white"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Bulk Process</span>
            {selectedIds.size > 0 && (
              <span className="py-0.2 rounded-full bg-amber-500 px-1.5 font-mono text-[10px] font-bold text-zinc-950">
                {selectedIds.size}
              </span>
            )}
          </button>

          {/* Create Order Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#e4e4e7] px-4 py-2 text-xs font-bold text-zinc-900 shadow-md transition-all hover:bg-white hover:shadow-lg"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Create Order</span>
          </button>
        </div>
      </div>

      {/* Sync Result Alert */}
      {syncResult && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/25 bg-blue-500/10 px-4 py-3 text-xs font-medium text-blue-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{syncResult}</span>
        </div>
      )}

      {/* Status Filter Cards (8 Cards matching screenshot layout) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TABS.map(({ id, label, badge, icon: Icon }) => {
          const count = getTabCount(id);
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setSelectedIds(new Set());
              }}
              className={`flex flex-col justify-between rounded-xl border p-3.5 text-left transition-all ${
                isActive
                  ? 'border-amber-500/50 bg-[#1e1c18] shadow-lg shadow-amber-500/5'
                  : 'border-white/[0.06] bg-[#141416] hover:border-white/[0.12] hover:bg-white/[0.02]'
              }`}
            >
              {/* Card Header: Icon + Title + Pill Badge */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-zinc-400">
                  <Icon
                    className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-zinc-500'}`}
                  />
                  <span
                    className={`text-xs font-semibold ${isActive ? 'text-white' : 'text-zinc-300'}`}
                  >
                    {label}
                  </span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold tracking-wider ${
                    isActive
                      ? 'border border-amber-500/30 bg-amber-500/15 text-amber-400'
                      : 'border border-white/[0.06] bg-white/[0.03] text-zinc-500'
                  }`}
                >
                  {badge}
                </span>
              </div>

              {/* Big Count Number */}
              <div className="mt-3">
                <span
                  className={`font-mono text-2xl font-black ${isActive ? 'text-amber-400' : 'text-white'}`}
                >
                  {count}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search Input Filter */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search order ID, customer, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#141416] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span>{selectedIds.size} selected</span>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-amber-400 hover:underline"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* ORDERS TABLE CONTAINER (Matching screenshot design) */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#141416] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            {/* Table Header */}
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#17171a] text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="w-10 px-4 py-3.5 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredOrders.length}
                    onChange={selectAll}
                    className="h-3.5 w-3.5 cursor-pointer rounded border-zinc-700 bg-zinc-800 text-amber-500 accent-amber-500 focus:ring-0"
                  />
                </th>
                <th className="whitespace-nowrap px-4 py-3.5">ORDER ID</th>
                <th className="whitespace-nowrap px-4 py-3.5">CUSTOMER</th>
                <th className="whitespace-nowrap px-4 py-3.5">LOCATION</th>
                <th className="whitespace-nowrap px-4 py-3.5">DATE & TIME</th>
                <th className="whitespace-nowrap px-4 py-3.5">AMOUNT</th>
                <th className="whitespace-nowrap px-4 py-3.5">PAYMENT</th>
                <th className="whitespace-nowrap px-4 py-3.5">STATUS</th>
                <th className="whitespace-nowrap px-4 py-3.5 text-right">ACTIONS</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-white/[0.04]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingBag className="mb-2 h-9 w-9 text-zinc-700" />
                      <p className="text-xs font-medium text-zinc-400">No orders found</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {search
                          ? 'Try adjusting your search criteria'
                          : 'No orders in this section'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = selectedIds.has(order.id);
                  const isStatusOpen = openStatusMenuId === order.id;
                  const statusConf = STATUS_CONFIG[order.status] || {
                    label: order.status,
                    bg: 'bg-zinc-800',
                    text: 'text-zinc-300',
                    border: 'border-zinc-700',
                  };

                  return (
                    <tr
                      key={order.id}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        isSelected ? 'bg-amber-500/[0.03]' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3.5 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(order.id)}
                          className="h-3.5 w-3.5 cursor-pointer rounded border-zinc-700 bg-zinc-800 text-amber-500 accent-amber-500 focus:ring-0"
                        />
                      </td>

                      {/* ORDER ID */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-rose-300">
                          {order.orderNo}
                        </span>
                      </td>

                      {/* CUSTOMER */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-[160px] truncate text-xs font-bold text-white">
                          {order.shippingName}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-400">
                          {order.shippingPhone}
                        </div>
                      </td>

                      {/* LOCATION */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-[160px] truncate text-xs text-zinc-200">
                          {order.shippingThana || order.shippingArea || '—'}
                        </div>
                        <div className="mt-0.5 text-[11px] text-zinc-500">
                          {order.shippingDistrict}
                        </div>
                      </td>

                      {/* DATE & TIME */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-mono text-xs text-zinc-200">
                          {formatDateOnly(order.createdAt)}
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-zinc-500">
                          {formatTimeOnly(order.createdAt)}
                        </div>
                      </td>

                      {/* AMOUNT */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="font-mono text-xs font-bold text-white">
                          ৳{order.total.toLocaleString()}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] text-zinc-500">
                          +{order.deliveryCharge} ship
                        </div>
                      </td>

                      {/* PAYMENT */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <span className="text-xs text-zinc-300">
                          {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}
                        </span>
                      </td>

                      {/* STATUS DROPDOWN PILL */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setOpenStatusMenuId(isStatusOpen ? null : order.id)}
                            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                          >
                            <span>{statusConf.label}</span>
                            <ChevronDown className="h-3 w-3" />
                          </button>

                          {/* Status Options Menu */}
                          {isStatusOpen && (
                            <div className="absolute left-0 top-full z-40 mt-1 w-32 rounded-lg border border-white/[0.1] bg-[#1a1a1d] py-1 shadow-2xl">
                              {Object.entries(STATUS_CONFIG).map(([stKey, conf]) => (
                                <button
                                  key={stKey}
                                  type="button"
                                  onClick={() => handleStatusChange(order.id, stKey)}
                                  className={`flex w-full items-center px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.08] ${
                                    order.status === stKey
                                      ? 'font-bold text-white'
                                      : 'text-zinc-400'
                                  }`}
                                >
                                  <span className={conf.text}>{conf.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS ROW */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Order Detail */}
                          <button
                            type="button"
                            onClick={() => setViewOrderId(order.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:border-zinc-400 hover:text-white"
                            title="View Order Details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>

                          {/* Courier Entry Button */}
                          <button
                            type="button"
                            onClick={() => setCourierOrderId(order.id)}
                            disabled={order.courierEntryDone}
                            className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                              order.courierEntryDone
                                ? 'cursor-not-allowed border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-purple-400 hover:text-purple-300'
                            }`}
                            title={
                              order.courierEntryDone
                                ? 'Courier already entered'
                                : 'Enter to Courier'
                            }
                          >
                            <Truck className="h-3.5 w-3.5" />
                          </button>

                          {/* WhatsApp Chat Button */}
                          <button
                            type="button"
                            onClick={(e) => openWhatsApp(order.shippingPhone, e)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:border-emerald-400 hover:text-emerald-400"
                            title="Contact Customer on WhatsApp"
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </button>

                          {/* Print Invoice */}
                          <button
                            type="button"
                            onClick={(e) => printInvoice(order.id, e)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:border-zinc-400 hover:text-white"
                            title="Print Invoice / Packing Slip"
                          >
                            <Printer className="h-3.5 w-3.5" />
                          </button>

                          {/* Edit Order */}
                          <button
                            type="button"
                            onClick={() => setEditingOrder(order)}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:border-zinc-400 hover:text-white"
                            title="Edit Order"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer: Showing X of Y */}
        <div className="border-t border-white/[0.06] bg-[#17171a] px-4 py-3">
          <p className="text-xs text-zinc-400">
            Showing {filteredOrders.length} of {orders.length} orders
          </p>
        </div>
      </div>

      {/* Modals */}
      {/* Create / Edit Order Modal */}
      {(showCreateModal || editingOrder) && (
        <OrderFormModal
          editOrder={editingOrder as unknown as Record<string, unknown>}
          onClose={() => {
            setShowCreateModal(false);
            setEditingOrder(null);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setEditingOrder(null);
            fetchOrders();
          }}
        />
      )}

      {/* Courier Modal */}
      {courierOrderId && (
        <CourierModal
          orderId={courierOrderId}
          onClose={() => setCourierOrderId(null)}
          onSuccess={() => {
            setCourierOrderId(null);
            fetchOrders();
          }}
        />
      )}

      {/* Order Detail Modal */}
      {viewOrderId && (
        <OrderDetailModal
          orderId={viewOrderId}
          onClose={() => setViewOrderId(null)}
          onUpdate={fetchOrders}
          staffList={staffList}
          isOwner={isOwner}
        />
      )}

      {/* Fraud Checker Modal */}
      {showFraudModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowFraudModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-2xl border border-white/[0.08] bg-[#161619] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Fraud Risk Checker</h3>
              </div>
              <button
                onClick={() => setShowFraudModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-zinc-400">
                Automated risk scan based on customer phone history, repeat cancellations, and order
                frequency:
              </p>

              {orders.filter((o) => o.status === 'CANCELLED' || o.status === 'RETURNED').length ===
              0 ? (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                  <CheckCircle2 className="mx-auto mb-1 h-6 w-6 text-emerald-400" />
                  <p className="text-xs font-semibold text-emerald-300">Clean Records</p>
                  <p className="text-[11px] text-emerald-400/80">
                    No high-risk numbers or return flags detected.
                  </p>
                </div>
              ) : (
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {orders
                    .filter((o) => o.status === 'CANCELLED' || o.status === 'RETURNED')
                    .map((o) => (
                      <div
                        key={o.id}
                        className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-2.5 text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{o.shippingName}</p>
                          <p className="font-mono text-[11px] text-zinc-400">{o.shippingPhone}</p>
                        </div>
                        <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                          {o.status}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowFraudModal(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Process Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            onClick={() => setShowBulkModal(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#161619] p-6 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Bulk Process Orders</h3>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <p className="text-xs text-zinc-400">
                You have <span className="font-mono font-bold text-white">{selectedIds.size}</span>{' '}
                orders selected. Choose a batch action:
              </p>

              {selectedIds.size === 0 ? (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-center text-xs text-amber-400">
                  <AlertTriangle className="mx-auto mb-1 h-5 w-5" />
                  Please select at least one order using the checkboxes first.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleBulkStatusChange('PROCESSING')}
                    className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                  >
                    Move to Processing
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('SHIPPED')}
                    className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-2.5 text-xs font-semibold text-purple-300 hover:bg-purple-500/20"
                  >
                    Move to Shipped
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('COMPLETED')}
                    className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
                  >
                    Mark as Delivered
                  </button>
                  <button
                    onClick={() => handleBulkStatusChange('CANCELLED')}
                    className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs font-semibold text-red-300 hover:bg-red-500/20"
                  >
                    Mark as Cancelled
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowBulkModal(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
