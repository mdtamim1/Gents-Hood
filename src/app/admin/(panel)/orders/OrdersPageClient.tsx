'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Edit2,
  Printer,
  ChevronDown,
  Layers,
  AlertTriangle,
  X,
  UserCheck,
  Users,
  UserPlus,
  ShieldAlert,
} from 'lucide-react';
import { OrderFormModal } from './OrderFormModal';
import { CourierModal } from './CourierModal';
import { OrderDetailModal } from './OrderDetailModal';
import { AppealFormModal, OrderAppealData } from './AppealFormModal';
import { printOrders } from './InvoicePrint';
import { useToast } from '@/components/ui/Toast';

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

export interface StaffMember {
  id: string;
  name: string;
  displayColor: string;
  isOnline?: boolean;
}

export default function OrdersPageClient({
  initialOrders,
  initialCounts,
  session,
  staffList: initialStaffList,
  initialUnsyncedCount = 0,
}: {
  initialOrders: Order[];
  initialCounts: Counts;
  session: { id: string; name: string; role: string };
  staffList: StaffMember[];
  initialUnsyncedCount?: number;
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [counts, setCounts] = useState<Counts>(initialCounts);
  const [staffList, setStaffList] = useState<StaffMember[]>(initialStaffList);
  const onlineStaffList = useMemo(() => staffList.filter((s) => s.isOnline), [staffList]);
  const [activeTab, setActiveTab] = useState<Tab>('processing');
  const [search, setSearch] = useState('');
  const [unsyncedCount, setUnsyncedCount] = useState(initialUnsyncedCount);
  const [appealOrder, setAppealOrder] = useState<Order | null>(null);
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const { showToast } = useToast();
  const [courierOrderId, setCourierOrderId] = useState<string | null>(null);
  const [sendingCourierId, setSendingCourierId] = useState<string | null>(null);
  const [viewOrderId, setViewOrderId] = useState<string | null>(null);
  const [openStatusMenu, setOpenStatusMenu] = useState<{
    orderId: string;
    currentStatus: string;
    coords: { top: number; left: number };
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  // Assign dropdown
  const [openAssignMenu, setOpenAssignMenu] = useState<{
    orderId: string;
    coords: { top: number; left: number };
  } | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  // Staff filter
  const [staffFilterId, setStaffFilterId] = useState<string | null>(null);
  const [showStaffFilter, setShowStaffFilter] = useState(false);
  const staffFilterRef = useRef<HTMLDivElement>(null);
  // Bulk assign
  const [showBulkAssign, setShowBulkAssign] = useState(false);
  const [bulkAssigning, setBulkAssigning] = useState(false);
  const bulkAssignRef = useRef<HTMLDivElement>(null);

  // 1-Click Steadfast Courier Entry
  const handleOneClickSteadfast = async (order: Order) => {
    if (order.courierEntryDone || sendingCourierId === order.id) return;
    setSendingCourierId(order.id);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/courier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courierName: 'Steadfast', autoCreateSteadfast: true }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Steadfast এ এন্ট্রি সফল! ট্র্যাকিং: ${data.trackingNo || 'Done'}`, 'success');
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id
              ? {
                  ...o,
                  courierEntryDone: true,
                  courierName: 'Steadfast',
                  courierTrackingNo: data.trackingNo || null,
                  courierEntryAt: new Date().toISOString(),
                }
              : o
          )
        );
      } else {
        showToast(data.error || 'Steadfast এন্ট্রি ব্যর্থ হয়েছে', 'danger');
        setCourierOrderId(order.id);
      }
    } catch {
      showToast('Network error connecting to Steadfast', 'danger');
      setCourierOrderId(order.id);
    } finally {
      setSendingCourierId(null);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOwner = session.role === 'OWNER';

  const fetchOrders = useCallback(
    async (searchQuery?: string) => {
      try {
        const q = typeof searchQuery === 'string' ? searchQuery : search;
        const url = q.trim()
          ? `/api/admin/orders?status=ALL&search=${encodeURIComponent(q.trim())}`
          : `/api/admin/orders?status=ALL`;
        const res = await fetch(url, { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setOrders(data.orders);
          setCounts(data.counts);
          if (data.staffList) {
            setStaffList(data.staffList);
          }
          if (typeof data.unsyncedCount === 'number') {
            setUnsyncedCount(data.unsyncedCount);
          }
        }
      } catch (e) {
        console.error('Failed to fetch orders:', e);
      }
    },
    [search]
  );

  // Debounced search trigger across all store orders
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOrders(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchOrders]);

  // Live auto-refresh: Fast 4-second background poll + Instant refresh on window focus/tab switch
  useEffect(() => {
    if (search.trim()) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Fast 4s pulse when tab is visible
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    }, 4000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(interval);
    };
  }, [fetchOrders, search]);

  // Close status dropdown on scroll or window resize
  useEffect(() => {
    if (!openStatusMenu) return;
    const handleClose = () => setOpenStatusMenu(null);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [openStatusMenu]);

  // Close assign dropdown on scroll/resize
  useEffect(() => {
    if (!openAssignMenu) return;
    const handleClose = () => setOpenAssignMenu(null);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [openAssignMenu]);

  // Close staff filter dropdown on outside click
  useEffect(() => {
    if (!showStaffFilter) return;
    const handleClick = (e: MouseEvent) => {
      if (staffFilterRef.current && !staffFilterRef.current.contains(e.target as Node)) {
        setShowStaffFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showStaffFilter]);

  // Close bulk assign dropdown on outside click
  useEffect(() => {
    if (!showBulkAssign) return;
    const handleClick = (e: MouseEvent) => {
      if (bulkAssignRef.current && !bulkAssignRef.current.contains(e.target as Node)) {
        setShowBulkAssign(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showBulkAssign]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (!search.trim()) {
      // Tab filter (only when not searching)
      if (activeTab === 'today') {
        result = result.filter((o) => isTodayOrder(o.createdAt));
      } else if (activeTab !== 'all') {
        const tab = TABS.find((t) => t.id === activeTab);
        if (tab?.statusFilter) {
          result = result.filter((o) => o.status === tab.statusFilter);
        }
      }

      // Staff filter
      if (staffFilterId) {
        result = result.filter((o) => o.assignedToId === staffFilterId);
      }
    } else {
      // Cross-store search filter: check query against loaded search results
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
  }, [orders, activeTab, search, staffFilterId]);

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
      setOpenStatusMenu(null);
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

  const printInvoice = (order: Order, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    printOrders([order], session.name);
  };

  const handleBulkPrint = () => {
    const ordersToPrint = filteredOrders.filter((o) =>
      selectedIds.size > 0 ? selectedIds.has(o.id) : true
    );
    if (ordersToPrint.length === 0) return;
    printOrders(ordersToPrint, session.name);
  };

  const handleAssignOrder = async (orderId: string, staffId: string) => {
    setAssigningId(staffId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: staffId }),
      });
      if (res.ok) {
        setOpenAssignMenu(null);
        await fetchOrders();
      }
    } finally {
      setAssigningId(null);
    }
  };

  const activeStaffName = staffFilterId
    ? staffList.find((s) => s.id === staffFilterId)?.name || 'Staff'
    : null;

  const handleBulkAssign = async (staffId: string) => {
    if (selectedIds.size === 0) return;
    setBulkAssigning(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await fetch(`/api/admin/orders/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assignedToId: staffId }),
        });
      }
      setSelectedIds(new Set());
      setShowBulkAssign(false);
      await fetchOrders();
    } finally {
      setBulkAssigning(false);
    }
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
              {unsyncedCount > 0 && (
                <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-400 px-1 font-mono text-[10px] font-bold text-zinc-900">
                  {unsyncedCount}
                </span>
              )}
            </button>
          )}

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

          {/* Bulk Print — only visible in shipped tab */}
          {activeTab === 'shipped' && (
            <button
              onClick={handleBulkPrint}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-all ${
                selectedIds.size > 0
                  ? 'border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25'
                  : 'border-white/[0.08] bg-[#1a1a1e] text-zinc-300 hover:bg-white/[0.06] hover:text-white'
              }`}
              title={
                selectedIds.size > 0
                  ? `Print ${selectedIds.size} selected invoices`
                  : 'Print all shipped invoices'
              }
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Bulk Print</span>
              {selectedIds.size > 0 && (
                <span className="rounded-full bg-purple-500 px-1.5 font-mono text-[10px] font-bold text-white">
                  {selectedIds.size}
                </span>
              )}
            </button>
          )}

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

      {/* Task 4: Queue Info Banner — customer orders waiting for sync */}
      {isOwner && unsyncedCount > 0 && !syncResult && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/20">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300">
                {unsyncedCount} customer order{unsyncedCount > 1 ? 's' : ''} waiting in queue
              </p>
              <p className="mt-0.5 text-[11px] text-amber-400/70">
                Click &quot;Order Sync&quot; to distribute {unsyncedCount > 1 ? 'them' : 'it'} to
                staff and move to Processing.
              </p>
            </div>
          </div>
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

      {/* Appeal Success Banner */}
      {appealSuccessMsg && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{appealSuccessMsg}</span>
          </div>
          <button
            onClick={() => setAppealSuccessMsg(null)}
            className="text-emerald-400/70 hover:text-emerald-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Search + Staff Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative w-64 sm:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search order ID, customer, phone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="w-full rounded-lg border border-white/[0.08] bg-[#141416] py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {search.trim() && (
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-400">
              Searching all store orders
            </span>
          )}

          {/* Staff Filter Dropdown */}
          {isOwner && staffList.length > 0 && (
            <div className="relative" ref={staffFilterRef}>
              <button
                type="button"
                onClick={() => setShowStaffFilter((p) => !p)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  staffFilterId
                    ? 'border-indigo-500/50 bg-indigo-500/15 text-indigo-300'
                    : 'border-white/[0.08] bg-[#141416] text-zinc-300 hover:border-white/20 hover:text-white'
                }`}
                title="Filter by staff member"
              >
                <Users className="h-3.5 w-3.5" />
                <span>{activeStaffName ? activeStaffName : 'Filter by Staff'}</span>
                {staffFilterId ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStaffFilterId(null);
                    }}
                    className="ml-0.5 rounded-sm text-indigo-300 hover:text-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : (
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${showStaffFilter ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {showStaffFilter && (
                <div className="absolute left-0 top-full z-[200] mt-1.5 w-52 overflow-hidden rounded-xl border border-white/[0.12] bg-[#18181b] py-1 shadow-2xl">
                  <div className="border-b border-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Filter by Staff
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setStaffFilterId(null);
                      setShowStaffFilter(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/[0.06] ${
                      !staffFilterId ? 'font-bold text-white' : 'text-zinc-400'
                    }`}
                  >
                    <ShoppingBag className="h-3.5 w-3.5 text-zinc-500" />
                    All Staff
                    {!staffFilterId && (
                      <CheckCircle2 className="ml-auto h-3 w-3 text-emerald-400" />
                    )}
                  </button>
                  {staffList.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setStaffFilterId(s.id);
                        setShowStaffFilter(false);
                      }}
                      className={`flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors hover:bg-white/[0.06] ${
                        staffFilterId === s.id ? 'font-bold text-white' : 'text-zinc-400'
                      }`}
                    >
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{ backgroundColor: s.displayColor || '#6366f1' }}
                      >
                        {s.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="truncate">{s.name}</span>
                      <div className="ml-auto flex items-center gap-1.5">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${s.isOnline ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                        />
                        <span
                          className={`font-mono text-[9px] ${s.isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}
                        >
                          {s.isOnline ? 'Online' : 'Offline'}
                        </span>
                        {staffFilterId === s.id && (
                          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bulk Assign Button — only for pending & processing tabs */}
          {isOwner && (activeTab === 'pending' || activeTab === 'processing') && (
            <div className="relative" ref={bulkAssignRef}>
              <button
                type="button"
                disabled={selectedIds.size === 0 || onlineStaffList.length === 0}
                onClick={() => setShowBulkAssign((p) => !p)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${
                  selectedIds.size > 0 && onlineStaffList.length > 0
                    ? 'border-violet-500/50 bg-violet-500/15 text-violet-300 hover:bg-violet-500/25'
                    : 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-zinc-600 opacity-50'
                }`}
                title={
                  onlineStaffList.length === 0
                    ? 'All staff are offline (Cannot assign orders)'
                    : selectedIds.size === 0
                      ? 'Select orders first to bulk assign'
                      : 'Bulk assign selected orders to online staff'
                }
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Bulk Assign</span>
                {selectedIds.size > 0 && (
                  <span className="rounded-full bg-violet-500 px-1.5 font-mono text-[10px] font-bold text-white">
                    {selectedIds.size}
                  </span>
                )}
                <ChevronDown
                  className={`h-3 w-3 transition-transform ${showBulkAssign ? 'rotate-180' : ''}`}
                />
              </button>

              {showBulkAssign && selectedIds.size > 0 && (
                <div className="absolute left-0 top-full z-[200] mt-1.5 w-60 overflow-hidden rounded-xl border border-white/[0.12] bg-[#18181b] py-1 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Assign {selectedIds.size} order{selectedIds.size > 1 ? 's' : ''} to
                    </p>
                    <span className="text-[9px] font-bold text-emerald-400">Online only</span>
                  </div>
                  {onlineStaffList.length === 0 ? (
                    <div className="px-3 py-4 text-center">
                      <p className="text-[11px] font-medium text-amber-400">
                        All staff are offline
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-500">
                        Orders can only be assigned to online staff
                      </p>
                    </div>
                  ) : (
                    onlineStaffList.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        disabled={bulkAssigning}
                        onClick={() => handleBulkAssign(s.id)}
                        className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs text-zinc-300 transition-colors hover:bg-violet-500/10 hover:text-white disabled:opacity-60"
                      >
                        {bulkAssigning ? (
                          <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                        ) : (
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: s.displayColor || '#6366f1' }}
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="ml-auto flex items-center gap-1 text-[10px] font-medium text-emerald-400">
                          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                          Online
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
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
                  const isStatusOpen = openStatusMenu?.orderId === order.id;
                  const isLocked = order.status === 'RETURNED';
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

                      {/* ORDER ID & STAFF MARKER */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewOrderId(order.id)}
                              className="rounded-md border border-rose-500/25 bg-rose-500/10 px-2.5 py-1 font-mono text-xs font-semibold text-rose-300 transition-colors hover:border-rose-500/40 hover:bg-rose-500/20"
                              title="Click to view order details"
                            >
                              {order.orderNo}
                            </button>

                            {/* Appeal Badge */}
                            {order.appealStatus === 'PENDING' && (
                              <span className="inline-flex animate-pulse items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                                <ShieldAlert className="h-3 w-3" />
                                Appeal Pending
                              </span>
                            )}
                            {order.appealStatus === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                                <CheckCircle2 className="h-3 w-3" />
                                Appealed
                              </span>
                            )}
                            {order.appealStatus === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300">
                                <XCircle className="h-3 w-3" />
                                Declined
                              </span>
                            )}
                          </div>

                          {/* Staff Assigned Marker */}
                          <div className="flex items-center gap-1 text-[10px]">
                            {order.assignedTo ? (
                              <span
                                className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-medium"
                                style={{
                                  backgroundColor: `${order.assignedTo.displayColor || '#6366f1'}15`,
                                  borderColor: `${order.assignedTo.displayColor || '#6366f1'}40`,
                                  color: order.assignedTo.displayColor || '#a5b4fc',
                                }}
                              >
                                <span
                                  className="h-1.5 w-1.5 rounded-full"
                                  style={{
                                    backgroundColor: order.assignedTo.displayColor || '#6366f1',
                                  }}
                                />
                                👤 {order.assignedTo.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 py-0.5 font-medium text-zinc-500">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </div>
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
                        <div className="relative inline-block">
                          {isLocked ? (
                            /* RETURNED: non-clickable locked pill */
                            <span
                              className={`flex cursor-not-allowed items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold opacity-70 ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                              title="Order is returned and cannot be changed"
                            >
                              <span>{statusConf.label}</span>
                              <XCircle className="h-3 w-3" />
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (openStatusMenu?.orderId === order.id) {
                                  setOpenStatusMenu(null);
                                  return;
                                }
                                const rect = e.currentTarget.getBoundingClientRect();
                                const menuHeight = 230;
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const openUpwards =
                                  spaceBelow < menuHeight && rect.top > menuHeight;

                                setOpenStatusMenu({
                                  orderId: order.id,
                                  currentStatus: order.status,
                                  coords: {
                                    top: openUpwards
                                      ? Math.max(10, rect.top - menuHeight - 4)
                                      : rect.bottom + 4,
                                    left: Math.max(
                                      10,
                                      Math.min(rect.left, window.innerWidth - 160)
                                    ),
                                  },
                                });
                              }}
                              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all hover:brightness-110 active:scale-95 ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                            >
                              <span>{statusConf.label}</span>
                              <ChevronDown
                                className={`h-3 w-3 transition-transform duration-150 ${
                                  isStatusOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* ACTIONS ROW */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        {isLocked ? (
                          /* RETURNED: all actions locked */
                          <span className="inline-flex items-center gap-1.5 rounded-md border border-orange-500/20 bg-orange-500/5 px-2.5 py-1 text-[10px] font-semibold text-orange-400/70">
                            <XCircle className="h-3 w-3" />
                            Locked
                          </span>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Courier Entry Button — only for SHIPPED orders (Owner only, hidden in staff panel) */}
                            {isOwner && order.status === 'SHIPPED' && (
                              <button
                                type="button"
                                onClick={() => handleOneClickSteadfast(order)}
                                disabled={order.courierEntryDone || sendingCourierId === order.id}
                                className={`flex h-7 items-center gap-1.5 rounded-md border px-2 text-[11px] font-medium transition-all ${
                                  order.courierEntryDone
                                    ? 'cursor-not-allowed border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-purple-500/40 bg-purple-500/15 text-purple-300 hover:border-purple-400 hover:bg-purple-500/25 active:scale-95'
                                }`}
                                title={
                                  order.courierEntryDone
                                    ? `Steadfast Entered (Tracking: ${order.courierTrackingNo || 'Done'})`
                                    : '1-Click Steadfast Entry'
                                }
                              >
                                {sendingCourierId === order.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />
                                ) : (
                                  <Truck className="h-3.5 w-3.5" />
                                )}
                                <span className="hidden sm:inline">
                                  {order.courierEntryDone ? 'Entered' : 'Steadfast Entry'}
                                </span>
                              </button>
                            )}

                            {/* Print Invoice */}
                            <button
                              type="button"
                              onClick={(e) => printInvoice(order, e)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:border-zinc-400 hover:text-white"
                              title="Print Invoice"
                            >
                              <Printer className="h-3.5 w-3.5" />
                            </button>

                            {/* Assign to Staff — OWNER only, only for PENDING & PROCESSING */}
                            {isOwner &&
                              (order.status === 'PENDING' || order.status === 'PROCESSING') && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (openAssignMenu?.orderId === order.id) {
                                      setOpenAssignMenu(null);
                                      return;
                                    }
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const menuHeight =
                                      Math.max(1, onlineStaffList.length) * 40 + 50;
                                    const spaceBelow = window.innerHeight - rect.bottom;
                                    const openUpwards =
                                      spaceBelow < menuHeight && rect.top > menuHeight;
                                    setOpenAssignMenu({
                                      orderId: order.id,
                                      coords: {
                                        top: openUpwards
                                          ? Math.max(10, rect.top - menuHeight - 4)
                                          : rect.bottom + 4,
                                        left: Math.max(
                                          10,
                                          Math.min(rect.right - 192, window.innerWidth - 200)
                                        ),
                                      },
                                    });
                                  }}
                                  className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${
                                    order.assignedToId
                                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400 hover:border-indigo-400'
                                      : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:border-indigo-400 hover:text-indigo-300'
                                  }`}
                                  title={
                                    order.assignedTo
                                      ? `Assigned to: ${order.assignedTo.name}`
                                      : 'Assign to staff'
                                  }
                                >
                                  {order.assignedToId ? (
                                    <UserCheck className="h-3.5 w-3.5" />
                                  ) : (
                                    <UserPlus className="h-3.5 w-3.5" />
                                  )}
                                </button>
                              )}

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
                        )}
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

      {/* Appeal Form Modal */}
      {appealOrder && (
        <AppealFormModal
          order={appealOrder as unknown as OrderAppealData}
          onClose={() => setAppealOrder(null)}
          onSuccess={(msg) => {
            setAppealOrder(null);
            setAppealSuccessMsg(msg);
            fetchOrders();
            setTimeout(() => setAppealSuccessMsg(null), 6000);
          }}
        />
      )}

      {/* STATUS DROPDOWN FLOATING PORTAL */}
      {mounted &&
        openStatusMenu &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] cursor-default bg-transparent"
              onClick={() => setOpenStatusMenu(null)}
            />
            <div
              className="animate-in fade-in zoom-in-95 fixed z-[9999] w-36 overflow-hidden rounded-xl border border-white/[0.12] bg-[#18181b] py-1 shadow-2xl backdrop-blur-xl duration-100"
              style={{
                top: `${openStatusMenu.coords.top}px`,
                left: `${openStatusMenu.coords.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-white/[0.06] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Update Status
              </div>
              {Object.entries(STATUS_CONFIG).map(([stKey, conf]) => {
                const isCurrent = openStatusMenu.currentStatus === stKey;
                return (
                  <button
                    key={stKey}
                    type="button"
                    onClick={() => handleStatusChange(openStatusMenu.orderId, stKey)}
                    className={`flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors hover:bg-white/[0.08] ${
                      isCurrent ? 'bg-white/[0.06] font-bold text-white' : 'text-zinc-400'
                    }`}
                  >
                    <span className={conf.text}>{conf.label}</span>
                    {isCurrent && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                  </button>
                );
              })}
            </div>
          </>,
          document.body
        )}

      {/* ASSIGN DROPDOWN FLOATING PORTAL */}
      {mounted &&
        openAssignMenu &&
        typeof document !== 'undefined' &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9998] cursor-default bg-transparent"
              onClick={() => setOpenAssignMenu(null)}
            />
            <div
              className="animate-in fade-in zoom-in-95 fixed z-[9999] w-48 overflow-hidden rounded-xl border border-white/[0.12] bg-[#18181b] py-1 shadow-2xl backdrop-blur-xl duration-100"
              style={{
                top: `${openAssignMenu.coords.top}px`,
                left: `${openAssignMenu.coords.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Assign Order To
                </span>
                <span className="text-[9px] font-bold text-emerald-400">Online only</span>
              </div>
              {onlineStaffList.length === 0 ? (
                <div className="px-3 py-4 text-center">
                  <p className="text-[11px] font-medium text-amber-400">All staff are offline</p>
                  <p className="mt-0.5 text-[10px] text-zinc-500">
                    Orders can only be assigned to online staff
                  </p>
                </div>
              ) : (
                onlineStaffList.map((staff) => {
                  const currentOrder = orders.find((o) => o.id === openAssignMenu.orderId);
                  const isAssigned = currentOrder?.assignedToId === staff.id;
                  const isLoading = assigningId === staff.id;
                  return (
                    <button
                      key={staff.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleAssignOrder(openAssignMenu.orderId, staff.id)}
                      className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition-colors hover:bg-white/[0.08] disabled:opacity-60 ${
                        isAssigned ? 'bg-indigo-500/10 font-bold text-white' : 'text-zinc-400'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                      ) : (
                        <span
                          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                          style={{ backgroundColor: staff.displayColor || '#6366f1' }}
                        >
                          {staff.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <span className="truncate">{staff.name}</span>
                      <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        Online
                      </span>
                      {isAssigned && (
                        <UserCheck className="ml-1 h-3.5 w-3.5 shrink-0 text-indigo-400" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>,
          document.body
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
