'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Loader2, MapPin } from 'lucide-react';

type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface ChartDataPoint {
  label: string;
  orders: number;
  revenue: number;
  delivered: number;
  cancelled: number;
}

interface Summary {
  today: { orders: number; revenue: number };
  week: { orders: number; revenue: number };
  month: { orders: number; revenue: number };
  year: { orders: number; revenue: number };
  allTime: { orders: number; revenue: number };
}

interface StatusBreakdown {
  status: string;
  count: number;
}

interface TopDistrict {
  district: string;
  count: number;
}

interface AnalyticsData {
  period: Period;
  chart: ChartDataPoint[];
  summary: Summary;
  statusBreakdown: StatusBreakdown[];
  topDistricts: TopDistrict[];
}

function formatPrice(n: number) {
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#eab308',
  PROCESSING: '#3b82f6',
  SHIPPED: '#a855f7',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  RETURNED: '#f97316',
};

const PERIODS: { id: Period; label: string }[] = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

export function AnalyticsClient() {
  const [period, setPeriod] = useState<Period>('weekly');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartType, setChartType] = useState<'revenue' | 'orders'>('revenue');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const json = await res.json();
      if (json.success) setData(json);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white/30" />
      </div>
    );
  }

  if (!data) return null;

  const maxValue = Math.max(
    ...data.chart.map((d) => (chartType === 'revenue' ? d.revenue : d.orders)),
    1
  );

  const periodSummary = {
    daily: data.summary.today,
    weekly: data.summary.week,
    monthly: data.summary.month,
    yearly: data.summary.year,
  }[period];

  const totalStatus = data.statusBreakdown.reduce((s, x) => s + x.count, 0) || 1;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-[12px] text-white/35">Store performance insights</p>
        </div>
        {/* Period selector */}
        <div className="flex rounded-xl border border-white/[0.06] bg-[#141416] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPeriod(p.id)}
              className={`rounded-lg px-4 py-2 text-[12px] font-semibold transition-all ${
                period === p.id
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Revenue',
            value: formatPrice(periodSummary.revenue),
            icon: TrendingUp,
            color: 'indigo',
            full: `৳${periodSummary.revenue.toLocaleString()}`,
          },
          {
            label: 'Orders',
            value: periodSummary.orders,
            icon: ShoppingBag,
            color: 'blue',
            full: null,
          },
          {
            label: 'All-Time Revenue',
            value: formatPrice(data.summary.allTime.revenue),
            icon: TrendingUp,
            color: 'emerald',
            full: `৳${data.summary.allTime.revenue.toLocaleString()}`,
          },
          {
            label: 'All-Time Orders',
            value: data.summary.allTime.orders,
            icon: ShoppingBag,
            color: 'purple',
            full: null,
          },
        ].map(({ label, value, icon: Icon, color, full }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-[#141416] p-5">
            <div
              className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${
                color === 'indigo'
                  ? 'bg-indigo-500/15'
                  : color === 'blue'
                    ? 'bg-blue-500/15'
                    : color === 'emerald'
                      ? 'bg-emerald-500/15'
                      : 'bg-purple-500/15'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  color === 'indigo'
                    ? 'text-indigo-400'
                    : color === 'blue'
                      ? 'text-blue-400'
                      : color === 'emerald'
                        ? 'text-emerald-400'
                        : 'text-purple-400'
                }`}
              />
            </div>
            <p className="text-2xl font-bold text-white" title={full || undefined}>
              {value}
            </p>
            <p className="mt-0.5 text-[11px] text-white/40">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Main Chart */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-white/[0.06] bg-[#141416] p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-white">
                {period.charAt(0).toUpperCase() + period.slice(1)} Breakdown
              </h2>
              <div className="flex rounded-lg border border-white/[0.08] bg-white/[0.04] p-0.5">
                {(['revenue', 'orders'] as const).map((ct) => (
                  <button
                    key={ct}
                    onClick={() => setChartType(ct)}
                    className={`rounded-md px-3 py-1 text-[11px] font-semibold capitalize transition-all ${
                      chartType === ct
                        ? 'bg-indigo-500 text-white'
                        : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {ct}
                  </button>
                ))}
              </div>
            </div>

            {/* Bar Chart */}
            <div className="flex h-48 items-end gap-1.5 sm:gap-2">
              {data.chart.map((point, idx) => {
                const value = chartType === 'revenue' ? point.revenue : point.orders;
                const height = Math.max((value / maxValue) * 100, 1);
                const isLatest = idx === data.chart.length - 1;

                return (
                  <div key={idx} className="group relative flex flex-1 flex-col items-center">
                    {/* Tooltip */}
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.1] bg-[#1a1a1d] px-2.5 py-2 text-[11px] text-white shadow-xl group-hover:block">
                      <p className="font-bold">
                        {chartType === 'revenue' ? formatPrice(value) : `${value} orders`}
                      </p>
                      <p className="text-white/40">{point.label}</p>
                    </div>

                    <div
                      className={`w-full rounded-t-lg transition-all duration-500 ${
                        isLatest ? 'bg-indigo-500' : 'bg-indigo-500/40 group-hover:bg-indigo-500/70'
                      }`}
                      style={{ height: `${height}%` }}
                    />
                    <p className="mt-1.5 max-w-full truncate text-[9px] text-white/30">
                      {point.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Status Breakdown + Districts */}
        <div className="space-y-5">
          {/* Order Status Breakdown */}
          <div className="rounded-xl border border-white/[0.06] bg-[#141416] p-5">
            <h2 className="mb-4 text-[14px] font-semibold text-white">Order Status</h2>
            <div className="space-y-2.5">
              {data.statusBreakdown.map(({ status, count }) => {
                const percentage = Math.round((count / totalStatus) * 100);
                return (
                  <div key={status}>
                    <div className="mb-1 flex justify-between text-[12px]">
                      <span className="text-white/60">{status}</span>
                      <span className="font-semibold text-white">
                        {count} <span className="text-white/30">({percentage}%)</span>
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/[0.06]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: STATUS_COLORS[status] || '#6366f1',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Districts */}
          <div className="rounded-xl border border-white/[0.06] bg-[#141416] p-5">
            <h2 className="mb-4 flex items-center gap-2 text-[14px] font-semibold text-white">
              <MapPin className="h-4 w-4 text-white/30" />
              Top Districts
            </h2>
            <div className="space-y-2.5">
              {data.topDistricts.length === 0 ? (
                <p className="text-[13px] text-white/30">No data yet</p>
              ) : (
                data.topDistricts.map(({ district, count }, idx) => (
                  <div key={district} className="flex items-center gap-3">
                    <span className="text-[12px] font-bold text-white/20">{idx + 1}</span>
                    <span className="flex-1 text-[13px] text-white/70">{district}</span>
                    <span className="text-[12px] font-semibold text-white">{count}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Comparison */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Today', ...data.summary.today },
          { label: 'This Week', ...data.summary.week },
          { label: 'This Month', ...data.summary.month },
          { label: 'This Year', ...data.summary.year },
        ].map(({ label, orders, revenue }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-[#141416] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/35">
              {label}
            </p>
            <p className="mt-2 text-xl font-bold text-white">{formatPrice(revenue)}</p>
            <p className="mt-0.5 flex items-center gap-1 text-[12px] text-white/40">
              <ShoppingBag className="h-3 w-3" />
              {orders} orders
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
