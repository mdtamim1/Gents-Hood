import React from 'react';
import { db } from '@/lib/db';
import { Users, ShoppingBag, TrendingUp, Phone, Calendar } from 'lucide-react';

export const dynamic = 'force-dynamic';

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-BD', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatPrice(n: number) {
  return `৳${n.toLocaleString('en-BD')}`;
}

export default async function AdminCustomersPage() {
  const customers = await db.customer.findMany({
    include: {
      orders: {
        select: { id: true, total: true, status: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  const totalRevenue = customers.reduce(
    (sum, c) =>
      sum +
      c.orders
        .filter((o) => o.status !== 'CANCELLED' && o.status !== 'RETURNED')
        .reduce((s, o) => s + o.total, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Customer Directory</h1>
          <p className="text-[12px] text-white/35">
            {customers.length} customers · {formatPrice(totalRevenue)} total revenue
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Customers', value: customers.length, icon: Users, color: 'indigo' },
          {
            label: 'Repeat Customers',
            value: customers.filter((c) => c.orders.length > 1).length,
            icon: TrendingUp,
            color: 'emerald',
          },
          {
            label: 'Total Revenue',
            value: formatPrice(totalRevenue),
            icon: ShoppingBag,
            color: 'purple',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-[#141416] p-5">
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                color === 'indigo'
                  ? 'bg-indigo-500/15'
                  : color === 'emerald'
                    ? 'bg-emerald-500/15'
                    : 'bg-purple-500/15'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  color === 'indigo'
                    ? 'text-indigo-400'
                    : color === 'emerald'
                      ? 'text-emerald-400'
                      : 'text-purple-400'
                }`}
              />
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="mt-0.5 text-[11px] text-white/40">{label}</p>
          </div>
        ))}
      </div>

      {/* Customers Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#141416]">
        <div className="border-b border-white/[0.06] px-5 py-4">
          <h2 className="text-[14px] font-semibold text-white">All Customers</h2>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="mb-3 h-12 w-12 text-white/10" />
            <p className="text-[13px] text-white/30">No customers yet</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {customers.map((customer) => {
              const validOrders = customer.orders.filter(
                (o) => o.status !== 'CANCELLED' && o.status !== 'RETURNED'
              );
              const totalSpent = validOrders.reduce((s, o) => s + o.total, 0);

              return (
                <div
                  key={customer.id}
                  className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                >
                  {/* Avatar */}
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-[12px] font-bold text-indigo-400">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-white">{customer.name}</p>
                    <div className="mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1 text-[11px] text-white/40">
                        <Phone className="h-3 w-3" />
                        {customer.phone}
                      </span>
                      {customer.email && (
                        <span className="text-[11px] text-white/30">{customer.email}</span>
                      )}
                    </div>
                  </div>

                  {/* Orders */}
                  <div className="text-center">
                    <p className="text-[14px] font-bold text-white">{customer.orders.length}</p>
                    <p className="text-[10px] text-white/35">orders</p>
                  </div>

                  {/* Revenue */}
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-indigo-400">
                      {formatPrice(totalSpent)}
                    </p>
                    <p className="text-[10px] text-white/35">total spent</p>
                  </div>

                  {/* Join date */}
                  <div className="hidden text-right md:block">
                    <p className="flex items-center gap-1 text-[11px] text-white/30">
                      <Calendar className="h-3 w-3" />
                      {formatDate(customer.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
