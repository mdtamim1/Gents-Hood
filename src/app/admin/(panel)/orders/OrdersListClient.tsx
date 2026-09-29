'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, Download, Eye, Phone, MapPin } from 'lucide-react';
import { formatPrice } from '@/lib/utils/money';
import { Badge } from '@/components/ui/Badge';

interface OrderItem {
  id: string;
  orderNo: string;
  createdAt: string | Date;
  status: string;
  paymentMethod: string;
  total: number;
  shippingName: string;
  shippingPhone: string;
  shippingDistrict: string;
  items: { id: string; nameSnapshot: string; qty: number; sizeSnapshot?: string | null }[];
}

export function OrdersListClient({ initialOrders }: { initialOrders: OrderItem[] }) {
  const [orders] = useState<OrderItem[]>(initialOrders);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = orders.filter((order) => {
    const matchSearch =
      order.orderNo.toLowerCase().includes(search.toLowerCase()) ||
      order.shippingPhone.includes(search) ||
      order.shippingName.toLowerCase().includes(search.toLowerCase()) ||
      order.shippingDistrict.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'outline' | 'success' | 'danger' | 'inv' => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'danger';
      case 'SHIPPED':
      case 'PROCESSING':
      case 'CONFIRMED':
        return 'inv';
      default:
        return 'default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter, and Export Bar */}
      <div className="border-muted/20 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by order #, phone, name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-muted/30 placeholder:text-muted/50 w-full rounded-[1px] border bg-ink px-4 py-2 pl-9 text-xs text-cream focus:border-cream focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-muted/30 rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <a
          href="/api/admin/orders/export"
          download
          className="border-muted/30 bg-muted/10 hover:bg-muted/20 flex items-center justify-center gap-2 rounded-[1px] border px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          Export Orders CSV
        </a>
      </div>

      {/* Orders Table */}
      <div className="border-muted/20 overflow-x-auto border bg-[#1a1a1c]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-muted/20 bg-muted/5 border-b text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Order No</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Destination</th>
              <th className="px-4 py-3 font-semibold">Items</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
              <th className="px-4 py-3 text-right font-semibold">Manage</th>
            </tr>
          </thead>
          <tbody className="divide-muted/10 divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((order) => (
                <tr key={order.id} className="hover:bg-muted/5 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-cream">{order.orderNo}</td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(order.createdAt).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-cream">{order.shippingName}</p>
                    <p className="flex items-center gap-1 font-mono text-[11px] text-muted">
                      <Phone className="h-3 w-3" />
                      {order.shippingPhone}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {order.shippingDistrict}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-cream">
                      {order.items.reduce((acc, i) => acc + i.qty, 0)} item(s)
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={getStatusBadgeVariant(order.status)} size="sm">
                      {order.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-cream">
                    {formatPrice(order.total)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="bg-cream/10 inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs font-semibold text-cream transition-colors hover:bg-cream hover:text-ink"
                    >
                      <Eye className="h-3 w-3" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
