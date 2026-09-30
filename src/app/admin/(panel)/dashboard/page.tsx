import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  Package,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Users,
  Truck,
  DollarSign,
} from 'lucide-react';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function formatPrice(amount: number) {
  return `৳${amount.toLocaleString('en-BD')}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-BD', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

const STATUS_STYLES: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Pending', className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20' },
  PROCESSING: { label: 'Processing', className: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
  SHIPPED: { label: 'Shipped', className: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
  COMPLETED: {
    label: 'Delivered',
    className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  },
  CANCELLED: { label: 'Cancelled', className: 'bg-red-500/15 text-red-400 border-red-500/20' },
  RETURNED: {
    label: 'Returned',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
  },
};

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    todayOrdersCount,
    sevenDaysOrders,
    allOrders,
    pendingOrdersCount,
    processingCount,
    shippedCount,
    completedCount,
    lowStockVariants,
    recentOrders,
    totalCustomers,
  ] = await Promise.all([
    db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    db.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo }, status: { notIn: ['CANCELLED', 'RETURNED'] } },
      select: { total: true },
    }),
    db.order.findMany({
      select: { total: true },
      where: { status: { notIn: ['CANCELLED', 'RETURNED'] } },
    }),
    db.order.count({ where: { status: 'PENDING' } }),
    db.order.count({ where: { status: 'PROCESSING' } }),
    db.order.count({ where: { status: 'SHIPPED' } }),
    db.order.count({ where: { status: 'COMPLETED' } }),
    db.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: { select: { name: true } } },
      take: 5,
      orderBy: { stock: 'asc' },
    }),
    db.order.findMany({
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { take: 1 },
        assignedTo: { select: { name: true, displayColor: true } },
      },
    }),
    db.customer.count(),
  ]);

  const weekRevenue = sevenDaysOrders.reduce((sum, o) => sum + o.total, 0);
  const allTimeRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);

  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.18em] text-white/30">
            {new Intl.DateTimeFormat('en-BD', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(now)}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">
            {greeting}, {session?.name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-0.5 text-[13px] text-white/40">
            Here&apos;s what&apos;s happening with your store today.
          </p>
        </div>
        <Link
          href="/admin/orders"
          className="flex items-center gap-2 rounded-lg bg-indigo-500/15 px-4 py-2.5 text-[13px] font-semibold text-indigo-300 transition-all hover:bg-indigo-500/25 hover:text-indigo-200"
        >
          <ShoppingBag className="h-4 w-4" />
          Manage Orders
        </Link>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: "Today's Orders",
            value: todayOrdersCount,
            sub: 'Orders placed today',
            icon: ShoppingBag,
            color: 'indigo',
            href: '/admin/orders?tab=today',
          },
          {
            label: '7-Day Revenue',
            value: formatPrice(weekRevenue),
            sub: 'Last 7 days',
            icon: TrendingUp,
            color: 'emerald',
            href: '/admin/analytics',
          },
          {
            label: 'All-Time Revenue',
            value: formatPrice(allTimeRevenue),
            sub: 'Total since launch',
            icon: DollarSign,
            color: 'amber',
            href: '/admin/analytics',
          },
          {
            label: 'Total Customers',
            value: totalCustomers,
            sub: 'Registered customers',
            icon: Users,
            color: 'purple',
            href: '/admin/customers',
          },
        ].map(({ label, value, sub, icon: Icon, color, href }) => (
          <Link
            key={label}
            href={href}
            className="group relative overflow-hidden rounded-xl border border-white/[0.06] bg-[#141416] p-5 transition-all hover:border-white/[0.12] hover:bg-[#1a1a1d]"
          >
            <div className="flex items-start justify-between">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  color === 'indigo'
                    ? 'bg-indigo-500/15'
                    : color === 'emerald'
                      ? 'bg-emerald-500/15'
                      : color === 'amber'
                        ? 'bg-amber-500/15'
                        : 'bg-purple-500/15'
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    color === 'indigo'
                      ? 'text-indigo-400'
                      : color === 'emerald'
                        ? 'text-emerald-400'
                        : color === 'amber'
                          ? 'text-amber-400'
                          : 'text-purple-400'
                  }`}
                />
              </div>
              <ArrowRight className="h-4 w-4 text-white/20 transition-transform group-hover:translate-x-0.5 group-hover:text-white/40" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-white/40">{label}</p>
              <p className="mt-0.5 text-[10px] text-white/25">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Order Status Overview */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
        {[
          {
            label: 'Pending',
            count: pendingOrdersCount,
            icon: Clock,
            color: 'yellow',
            status: 'pending',
          },
          {
            label: 'Processing',
            count: processingCount,
            icon: RefreshCw,
            color: 'blue',
            status: 'processing',
          },
          {
            label: 'Shipped',
            count: shippedCount,
            icon: Truck,
            color: 'purple',
            status: 'shipped',
          },
          {
            label: 'Delivered',
            count: completedCount,
            icon: CheckCircle2,
            color: 'emerald',
            status: 'completed',
          },
          { label: 'Cancelled', count: 0, icon: XCircle, color: 'red', status: 'cancelled' },
          { label: 'Returned', count: 0, icon: Package, color: 'orange', status: 'returned' },
        ].map(({ label, count, icon: Icon, color, status }) => (
          <Link
            key={label}
            href={`/admin/orders?tab=${status}`}
            className="flex flex-col items-center rounded-xl border border-white/[0.06] bg-[#141416] p-4 text-center transition-all hover:border-white/[0.1] hover:bg-[#1a1a1d]"
          >
            <Icon
              className={`mb-2 h-5 w-5 ${
                color === 'yellow'
                  ? 'text-yellow-400'
                  : color === 'blue'
                    ? 'text-blue-400'
                    : color === 'purple'
                      ? 'text-purple-400'
                      : color === 'emerald'
                        ? 'text-emerald-400'
                        : color === 'red'
                          ? 'text-red-400'
                          : 'text-orange-400'
              }`}
            />
            <p className="text-xl font-bold text-white">{count}</p>
            <p className="mt-0.5 text-[10px] font-medium text-white/35">{label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Recent Orders */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-white/[0.06] bg-[#141416]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <h2 className="text-[14px] font-semibold text-white">Recent Orders</h2>
              <Link
                href="/admin/orders"
                className="text-[12px] font-medium text-indigo-400 hover:text-indigo-300"
              >
                View all →
              </Link>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {recentOrders.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-white/30">No orders yet</div>
              ) : (
                recentOrders.map((order) => {
                  const statusStyle = STATUS_STYLES[order.status] || STATUS_STYLES.PENDING;
                  return (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-semibold text-white">
                            {order.orderNo}
                          </span>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusStyle.className}`}
                          >
                            {statusStyle.label}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[12px] text-white/40">
                          {order.shippingName} · {order.shippingDistrict}
                        </p>
                        {order.assignedTo && (
                          <p
                            className="mt-0.5 text-[11px]"
                            style={{ color: order.assignedTo.displayColor || '#6366f1' }}
                          >
                            → {order.assignedTo.name}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-semibold text-white">
                          {formatPrice(order.total)}
                        </p>
                        <p className="mt-0.5 text-[10px] text-white/30">
                          {formatDate(order.createdAt)}
                        </p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/[0.06] bg-[#141416]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-5 py-4">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <h2 className="text-[14px] font-semibold text-white">Low Stock Alert</h2>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {lowStockVariants.length === 0 ? (
                <div className="py-10 text-center">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400/40" />
                  <p className="text-[13px] text-white/30">All stock levels OK</p>
                </div>
              ) : (
                lowStockVariants.map((variant) => (
                  <div key={variant.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-medium text-white/80">
                        {variant.product.name}
                      </p>
                      <p className="text-[11px] text-white/35">
                        {variant.size} · {variant.color}
                      </p>
                    </div>
                    <div
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        variant.stock === 0
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {variant.stock === 0 ? 'Out' : variant.stock}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-white/[0.06] p-4">
              <Link
                href="/admin/products"
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/[0.04] py-2 text-[12px] font-medium text-white/50 transition-all hover:bg-white/[0.07] hover:text-white/70"
              >
                <Package className="h-3.5 w-3.5" />
                Manage Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
