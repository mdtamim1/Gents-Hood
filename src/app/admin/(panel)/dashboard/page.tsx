import React from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  TrendingUp,
  Clock,
  AlertTriangle,
  ArrowRight,
  Package,
  Sparkles,
} from 'lucide-react';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils/money';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Queries
  const [
    todayOrdersCount,
    sevenDaysOrders,
    allOrders,
    pendingOrdersCount,
    lowStockVariants,
    recentOrders,
    featuredSetting,
  ] = await Promise.all([
    // Today orders count
    db.order.count({
      where: { createdAt: { gte: startOfToday } },
    }),
    // 7-day orders for revenue
    db.order.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { total: true },
    }),
    // All orders for all-time stats
    db.order.findMany({
      select: { total: true },
    }),
    // Pending orders
    db.order.count({
      where: { status: 'PENDING' },
    }),
    // Low stock variants (<= 5)
    db.productVariant.findMany({
      where: { stock: { lte: 5 } },
      include: { product: true },
      take: 6,
    }),
    // Recent 5 orders
    db.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
    // Active featured product
    db.siteSetting.findFirst({
      select: { featuredProductId: true },
    }),
  ]);

  const sevenDaysRevenue = sevenDaysOrders.reduce((sum, o) => sum + o.total, 0);
  const totalRevenue = allOrders.reduce((sum, o) => sum + o.total, 0);

  let featuredProduct = null;
  if (featuredSetting?.featuredProductId) {
    featuredProduct = await db.product.findUnique({
      where: { id: featuredSetting.featuredProductId },
      include: { images: true },
    });
  }

  const statCards = [
    {
      title: "Today's Orders",
      value: todayOrdersCount.toString(),
      subtext: `${allOrders.length} total store orders`,
      icon: ShoppingBag,
      color: 'text-blue-400',
    },
    {
      title: '7-Day Revenue',
      value: formatPrice(sevenDaysRevenue),
      subtext: `Total: ${formatPrice(totalRevenue)}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
    },
    {
      title: 'Pending Fulfillment',
      value: pendingOrdersCount.toString(),
      subtext: 'Requires phone confirmation',
      icon: Clock,
      color: 'text-amber-400',
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockVariants.length.toString(),
      subtext: 'Variants with ≤ 5 units',
      icon: AlertTriangle,
      color: 'text-rose-400',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="border-muted/20 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="label-caps tracking-widest text-muted">Executive Overview</span>
          <h1 className="heading-xl mt-1 tracking-tight text-cream">Store Dashboard</h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-[1px] bg-cream px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
          >
            <Package className="h-4 w-4" />
            Add Product
          </Link>
          <Link
            href="/admin/featured"
            className="border-muted/30 bg-muted/10 hover:bg-muted/20 flex items-center gap-2 rounded-[1px] border px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-cream transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            Swap Main Dress
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="border-muted/20 hover:border-muted/40 border bg-[#1a1a1c] p-6 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium uppercase tracking-widest text-muted">
                  {card.title}
                </span>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <p className="mt-3 text-2xl font-bold tracking-tight text-cream">{card.value}</p>
              <p className="mt-1 text-xs text-muted">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Featured Dress Quick Banner */}
      {featuredProduct && (
        <div className="flex flex-col justify-between gap-4 border border-amber-500/30 bg-amber-500/5 p-5 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <Sparkles className="h-5 w-5 shrink-0 text-amber-400" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                Active Homepage Main Product:
              </p>
              <p className="text-sm font-bold text-cream">
                {featuredProduct.name} — {formatPrice(featuredProduct.price)}
              </p>
            </div>
          </div>
          <Link
            href="/admin/featured"
            className="text-xs font-medium uppercase tracking-wider text-amber-300 underline underline-offset-4 hover:text-amber-200"
          >
            Change Main Dress &rarr;
          </Link>
        </div>
      )}

      {/* Two Column Grid: Recent Orders & Stock Alerts */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Recent Orders */}
        <div className="border-muted/20 border bg-[#1a1a1c] p-6 lg:col-span-8">
          <div className="border-muted/20 mb-4 flex items-center justify-between border-b pb-4">
            <h2 className="heading-sm text-cream">Recent Store Orders</h2>
            <Link
              href="/admin/orders"
              className="flex items-center gap-1 text-xs uppercase tracking-wider text-muted transition-colors hover:text-cream"
            >
              View All Orders
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">No orders received yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-muted/20 border-b text-[10px] uppercase tracking-wider text-muted">
                    <th className="py-3 font-semibold">Order</th>
                    <th className="py-3 font-semibold">Customer</th>
                    <th className="py-3 font-semibold">Phone</th>
                    <th className="py-3 font-semibold">Status</th>
                    <th className="py-3 text-right font-semibold">Total</th>
                    <th className="py-3 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-muted/10 divide-y">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/5 transition-colors">
                      <td className="py-3 font-mono font-medium text-cream">{order.orderNo}</td>
                      <td className="py-3 text-cream">{order.shippingName}</td>
                      <td className="py-3 text-muted">{order.shippingPhone}</td>
                      <td className="py-3">
                        <Badge
                          variant={
                            order.status === 'DELIVERED'
                              ? 'success'
                              : order.status === 'CANCELLED'
                                ? 'danger'
                                : 'default'
                          }
                          size="sm"
                        >
                          {order.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right font-bold text-cream">
                        {formatPrice(order.total)}
                      </td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-xs text-cream underline underline-offset-4 hover:opacity-80"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Low Stock Warnings */}
        <div className="border-muted/20 border bg-[#1a1a1c] p-6 lg:col-span-4">
          <div className="border-muted/20 mb-4 flex items-center justify-between border-b pb-4">
            <h2 className="heading-sm text-cream">Low Stock Warning</h2>
            <Link
              href="/admin/products"
              className="text-xs uppercase tracking-wider text-muted transition-colors hover:text-cream"
            >
              Inventory
            </Link>
          </div>

          {lowStockVariants.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted">
              All variant stocks are in healthy state.
            </p>
          ) : (
            <div className="space-y-3">
              {lowStockVariants.map((v) => (
                <div
                  key={v.id}
                  className="border-muted/10 bg-muted/5 flex items-center justify-between rounded-[1px] border p-3"
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate text-xs font-semibold text-cream">{v.product.name}</p>
                    <p className="text-[10px] text-muted">
                      Size: {v.size} | Color: {v.color}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded px-2 py-0.5 font-mono text-xs font-bold ${
                      v.stock === 0 ? 'bg-danger/20 text-danger' : 'bg-amber-500/20 text-amber-300'
                    }`}
                  >
                    {v.stock === 0 ? 'Out of Stock' : `${v.stock} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
