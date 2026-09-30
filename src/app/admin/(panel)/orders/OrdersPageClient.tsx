'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Plus,
  Search,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShoppingBag,
  Calendar,
  ChevronDown,
  Copy,
  Eye,
  Phone,
  MapPin,
  User,
  Loader2,
  CheckSquare,
  Square,
  Send,
} from 'lucide-react';
import { OrderFormModal } from './OrderFormModal';
import { CourierModal } from './CourierModal';
import { OrderDetailModal } from './OrderDetailModal';

// Types
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
  'all' | 'today' | 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled' | 'returned';

const TABS: Array<{
  id: Tab;
  label: string;
  statusFilter?: string;
  icon: React.FC<{ className?: string }>;
}> = [
  { id: 'all', label: 'All Orders', icon: ShoppingBag },
  { id: 'today', label: "Today's", icon: Calendar },
  { id: 'pending', label: 'Pending', statusFilter: 'PENDING', icon: Clock },
  { id: 'processing', label: 'Processing', statusFilter: 'PROCESSING', icon: RefreshCw },
  { id: 'shipped', label: 'Shipped', statusFilter: 'SHIPPED', icon: Truck },
  { id: 'completed', label: 'Completed', statusFilter: 'COMPLETED', icon: CheckCircle2 },
  { id: 'cancelled', label: 'Cancelled', statusFilter: 'CANCELLED', icon: XCircle },
  { id: 'returned', label: 'Returned', statusFilter: 'RETURNED', icon: RotateCcw },
];

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  PROCESSING: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  SHIPPED: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  CANCELLED: 'bg-red-500/15 text-red-400 border-red-500/20',
  RETURNED: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

function formatPrice(n: number) {
  return `৳${n.toLocaleString('en-BD')}`;
}

function formatDate(d: string) {
  return new Intl.DateTimeFormat('en-BD', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(d));
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
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [courierOrderId, setCourierOrderId] = useState<string | null>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [bulkCourierMode, setBulkCourierMode] = useState(false);
  void bulkCourierMode; // used by UI state

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
          o.shippingDistrict.toLowerCase().includes(q)
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
      await fetchOrders();
    }
  };

  const handleAssign = async (orderId: string, staffId: string) => {
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToId: staffId }),
    });
    if (res.ok) {
      await fetchOrders();
    }
  };

  const toggleSelect = (id: string) => {
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

  const showBulkCourier = activeTab === 'shipped' && selectedIds.size > 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Order Control Centre</h1>
          <p className="text-[12px] text-white/35">Manage and track all orders in real-time</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            disabled={isRefreshing}
            className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-[12px] font-medium text-white/60 transition-all hover:bg-white/[0.07] hover:text-white/80 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {isOwner && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 rounded-lg bg-blue-500/15 px-3 py-2 text-[12px] font-semibold text-blue-300 transition-all hover:bg-blue-500/25 disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Sync Now
            </button>
          )}
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-[12px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400"
          >
            <Plus className="h-4 w-4" />
            Create Order
          </button>
        </div>
      </div>

      {/* Sync result notification */}
      {syncResult && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-[13px] font-medium text-blue-300">
          <CheckCircle2 className="h-4 w-4" />
          {syncResult}
        </div>
      )}

      {/* Status Tab Counts */}
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = getTabCount(id);
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                setSelectedIds(new Set());
              }}
              className={`flex flex-col items-center rounded-xl border p-3 text-center transition-all ${
                isActive
                  ? 'border-indigo-500/40 bg-indigo-500/15 text-indigo-300'
                  : 'border-white/[0.06] bg-[#141416] text-white/40 hover:border-white/[0.1] hover:text-white/70'
              }`}
            >
              <Icon
                className={`mb-1.5 h-4 w-4 ${isActive ? 'text-indigo-400' : 'text-white/25'}`}
              />
              <span className="text-lg font-bold">{count}</span>
              <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Search + Bulk actions */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
          <input
            type="text"
            placeholder="Search order ID, customer name, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-white/[0.08] bg-[#141416] py-2.5 pl-9 pr-4 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25"
          />
        </div>

        {/* Bulk courier button for shipped */}
        {showBulkCourier && (
          <button
            onClick={() => setBulkCourierMode(true)}
            className="flex items-center gap-2 rounded-lg bg-purple-500/15 px-4 py-2.5 text-[12px] font-semibold text-purple-300 transition-all hover:bg-purple-500/25"
          >
            <Truck className="h-3.5 w-3.5" />
            Enter {selectedIds.size} to Courier
          </button>
        )}
      </div>

      {/* Orders Table/Cards */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#141416]">
        {/* Table header */}
        <div className="flex items-center gap-4 border-b border-white/[0.06] px-4 py-3">
          {activeTab === 'shipped' && (
            <button onClick={selectAll} className="text-white/40 hover:text-white/70">
              {selectedIds.size === filteredOrders.length && filteredOrders.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-indigo-400" />
              ) : (
                <Square className="h-4 w-4" />
              )}
            </button>
          )}
          <span className="text-[12px] font-medium text-white/40">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
            {search && ` for "${search}"`}
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="mb-3 h-12 w-12 text-white/10" />
            <p className="text-[13px] font-medium text-white/30">No orders found</p>
            <p className="mt-1 text-[12px] text-white/20">
              {activeTab === 'pending'
                ? 'No pending orders. All synced!'
                : activeTab === 'today'
                  ? 'No orders placed today yet'
                  : 'Try changing the filter or search'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {filteredOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isSelected={selectedIds.has(order.id)}
                showCheckbox={activeTab === 'shipped'}
                onToggleSelect={() => toggleSelect(order.id)}
                onStatusChange={handleStatusChange}
                onCourierEntry={() => setCourierOrderId(order.id)}
                onView={() => setViewOrderId(order.id)}
                onAssign={handleAssign}
                staffList={staffList}
                isOwner={isOwner}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <OrderFormModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchOrders();
          }}
        />
      )}

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

      {viewOrderId && (
        <OrderDetailModal
          orderId={viewOrderId}
          onClose={() => setViewOrderId(null)}
          onUpdate={() => fetchOrders()}
          staffList={staffList}
          isOwner={isOwner}
        />
      )}
    </div>
  );
}

// Single order row component
function OrderRow({
  order,
  isSelected,
  showCheckbox,
  onToggleSelect,
  onStatusChange,
  onCourierEntry,
  onView,
  onAssign,
  staffList,
  isOwner,
}: {
  order: Order;
  isSelected: boolean;
  showCheckbox: boolean;
  onToggleSelect: () => void;
  onStatusChange: (id: string, status: string) => void;
  onCourierEntry: () => void;
  onView: () => void;
  onAssign: (orderId: string, staffId: string) => void;
  staffList: Array<{ id: string; name: string; displayColor: string }>;
  isOwner: boolean;
}) {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);
  const statusStyle = STATUS_STYLES[order.status] || '';

  const copyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(order.shippingPhone);
  };

  const STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'RETURNED'];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] ${
        isSelected ? 'bg-indigo-500/5' : ''
      }`}
    >
      {showCheckbox && (
        <button
          onClick={onToggleSelect}
          className="flex-shrink-0 text-white/40 hover:text-white/70"
        >
          {isSelected ? (
            <CheckSquare className="h-4 w-4 text-indigo-400" />
          ) : (
            <Square className="h-4 w-4" />
          )}
        </button>
      )}

      {/* Order info */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[13px] font-bold text-white">{order.orderNo}</span>
          <span
            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle}`}
          >
            {order.status}
          </span>
          {order.isManualOrder && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
              Manual
            </span>
          )}
          {order.courierEntryDone && (
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              Courier ✓
            </span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
          <span className="flex items-center gap-1 text-[12px] text-white/60">
            <User className="h-3 w-3 text-white/30" />
            {order.shippingName}
          </span>
          <button
            onClick={copyPhone}
            className="flex items-center gap-1 text-[12px] text-white/60 hover:text-white/90"
          >
            <Phone className="h-3 w-3 text-white/30" />
            {order.shippingPhone}
            <Copy className="h-2.5 w-2.5 text-white/20" />
          </button>
          <span className="flex items-center gap-1 text-[12px] text-white/40">
            <MapPin className="h-3 w-3 text-white/25" />
            {order.shippingDistrict}
          </span>
        </div>

        <p className="mt-0.5 text-[11px] text-white/30">
          {order.items
            .map(
              (i) => `${i.nameSnapshot}${i.sizeSnapshot ? ` (${i.sizeSnapshot})` : ''} ×${i.qty}`
            )
            .join(', ')}
        </p>
      </div>

      {/* Assigned to */}
      {isOwner && (
        <div className="relative hidden sm:block">
          <button
            onClick={() => setShowAssignDropdown(!showAssignDropdown)}
            className="flex items-center gap-1.5 rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11px] transition-colors hover:bg-white/[0.07]"
          >
            {order.assignedTo ? (
              <>
                <span
                  className="h-2 w-2 flex-shrink-0 rounded-full"
                  style={{ backgroundColor: order.assignedTo.displayColor }}
                />
                <span className="max-w-[80px] truncate text-white/70">{order.assignedTo.name}</span>
              </>
            ) : (
              <span className="text-white/30">Unassigned</span>
            )}
            <ChevronDown className="h-3 w-3 text-white/30" />
          </button>
          {showAssignDropdown && (
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-white/[0.1] bg-[#1a1a1d] shadow-xl">
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => {
                    onAssign(order.id, staff.id);
                    setShowAssignDropdown(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-white/70 hover:bg-white/[0.06] hover:text-white"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: staff.displayColor }}
                  />
                  {staff.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Amount + Date */}
      <div className="hidden text-right md:block">
        <p className="text-[13px] font-bold text-white">{formatPrice(order.total)}</p>
        <p className="text-[10px] text-white/30">{formatDate(order.createdAt)}</p>
        <p className="text-[10px] text-white/25">{order.paymentMethod}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* View button */}
        <button
          onClick={onView}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-indigo-500/15 hover:text-indigo-400"
          title="View order"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>

        {/* Courier entry (Shipped only) */}
        {order.status === 'SHIPPED' && (
          <button
            onClick={onCourierEntry}
            disabled={order.courierEntryDone}
            title={order.courierEntryDone ? 'Courier already entered' : 'Enter to Courier'}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-semibold transition-all ${
              order.courierEntryDone
                ? 'cursor-not-allowed bg-emerald-500/10 text-emerald-400/50'
                : 'bg-purple-500/15 text-purple-300 hover:bg-purple-500/25'
            }`}
          >
            <Truck className="h-3 w-3" />
            {order.courierEntryDone ? 'Entered' : 'Courier'}
          </button>
        )}

        {/* Status change dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowStatusDropdown(!showStatusDropdown)}
            className="flex h-8 items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-2 text-[11px] text-white/50 transition-colors hover:bg-white/[0.07] hover:text-white/70"
          >
            Status
            <ChevronDown className="h-3 w-3" />
          </button>
          {showStatusDropdown && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-lg border border-white/[0.1] bg-[#1a1a1d] shadow-xl">
              {STATUSES.filter((s) => s !== order.status).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    onStatusChange(order.id, s);
                    setShowStatusDropdown(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-[11px] hover:bg-white/[0.06] ${
                    STATUS_STYLES[s]?.includes('text-')
                      ? STATUS_STYLES[s].split(' ').find((c) => c.startsWith('text-'))
                      : 'text-white/70'
                  }`}
                >
                  → {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
