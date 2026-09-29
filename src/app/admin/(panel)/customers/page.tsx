import React from 'react';
import { db } from '@/lib/db';
import { formatPrice } from '@/lib/utils/money';

export const dynamic = 'force-dynamic';

export default async function AdminCustomersPage() {
  const customers = await db.customer.findMany({
    include: {
      orders: {
        select: {
          id: true,
          total: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <span className="label-caps tracking-widest text-muted">Audience & Patrons</span>
        <h1 className="heading-xl mt-1 tracking-tight text-cream">Customer Directory</h1>
        <p className="mt-1 text-xs text-muted">
          All client profiles captured during checkout. Review order frequency and lifetime value.
        </p>
      </div>

      <div className="border-muted/20 overflow-x-auto border bg-[#1a1a1c]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-muted/20 bg-muted/5 border-b text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Mobile Phone</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 text-center font-semibold">Orders</th>
              <th className="px-4 py-3 text-right font-semibold">Lifetime Value</th>
              <th className="px-4 py-3 text-right font-semibold">First Seen</th>
            </tr>
          </thead>
          <tbody className="divide-muted/10 divide-y">
            {customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-muted">
                  No customers recorded yet.
                </td>
              </tr>
            ) : (
              customers.map((c) => {
                const totalSpend = c.orders.reduce((sum, o) => sum + o.total, 0);
                return (
                  <tr key={c.id} className="hover:bg-muted/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="bg-cream/10 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-cream">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-cream">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-muted">{c.phone}</td>
                    <td className="px-4 py-3 text-muted">{c.email || '—'}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold text-cream">
                      {c.orders.length}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-cream">
                      {formatPrice(totalSpend)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {new Date(c.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
