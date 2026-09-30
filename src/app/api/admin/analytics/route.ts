import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics
 * Returns analytics data for daily/weekly/monthly/yearly
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily'; // daily, weekly, monthly, yearly

    const now = new Date();

    // Helper to get date ranges
    const getDateRanges = () => {
      switch (period) {
        case 'daily': {
          // Last 24 hours by hour
          const ranges = [];
          for (let h = 0; h < 24; h++) {
            const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0);
            const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h + 1, 0, 0);
            ranges.push({ label: `${h.toString().padStart(2, '0')}:00`, start, end });
          }
          return ranges;
        }
        case 'weekly': {
          // Last 7 days
          const ranges = [];
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          for (let d = 6; d >= 0; d--) {
            const date = new Date(now);
            date.setDate(date.getDate() - d);
            const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
            ranges.push({ label: days[date.getDay()], start, end });
          }
          return ranges;
        }
        case 'monthly': {
          // Last 30 days by day
          const ranges = [];
          for (let d = 29; d >= 0; d--) {
            const date = new Date(now);
            date.setDate(date.getDate() - d);
            const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
            ranges.push({ label: `${date.getDate()}/${date.getMonth() + 1}`, start, end });
          }
          return ranges;
        }
        case 'yearly': {
          // Last 12 months
          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'May',
            'Jun',
            'Jul',
            'Aug',
            'Sep',
            'Oct',
            'Nov',
            'Dec',
          ];
          const ranges = [];
          for (let m = 11; m >= 0; m--) {
            const date = new Date(now.getFullYear(), now.getMonth() - m, 1);
            const start = new Date(date.getFullYear(), date.getMonth(), 1);
            const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
            ranges.push({ label: months[date.getMonth()], start, end });
          }
          return ranges;
        }
        default:
          return [];
      }
    };

    const ranges = getDateRanges();

    // Fetch orders for each range
    const chartData = await Promise.all(
      ranges.map(async ({ label, start, end }) => {
        const orders = await db.order.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { total: true, status: true },
        });

        const revenue = orders
          .filter((o) => o.status !== 'CANCELLED' && o.status !== 'RETURNED')
          .reduce((sum, o) => sum + o.total, 0);

        return {
          label,
          orders: orders.length,
          revenue,
          delivered: orders.filter((o) => o.status === 'COMPLETED').length,
          cancelled: orders.filter((o) => o.status === 'CANCELLED').length,
        };
      })
    );

    // Summary stats
    const allOrders = await db.order.findMany({
      select: { total: true, status: true, createdAt: true, shippingDistrict: true },
    });

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const filterOrders = (from: Date) =>
      allOrders.filter(
        (o) => o.createdAt >= from && o.status !== 'CANCELLED' && o.status !== 'RETURNED'
      );

    const todayOrders = filterOrders(todayStart);
    const weekOrders = filterOrders(weekStart);
    const monthOrders = filterOrders(monthStart);
    const yearOrders = filterOrders(yearStart);

    // Status breakdown
    const statusBreakdown = [
      'PENDING',
      'PROCESSING',
      'SHIPPED',
      'COMPLETED',
      'CANCELLED',
      'RETURNED',
    ].map((status) => ({
      status,
      count: allOrders.filter((o) => o.status === status).length,
    }));

    // Top districts
    const districtCount: Record<string, number> = {};
    allOrders.forEach((o) => {
      if (o.shippingDistrict) {
        districtCount[o.shippingDistrict] = (districtCount[o.shippingDistrict] || 0) + 1;
      }
    });
    const topDistricts = Object.entries(districtCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([district, count]) => ({ district, count }));

    return NextResponse.json({
      success: true,
      period,
      chart: chartData,
      summary: {
        today: {
          orders: todayOrders.length,
          revenue: todayOrders.reduce((s, o) => s + o.total, 0),
        },
        week: {
          orders: weekOrders.length,
          revenue: weekOrders.reduce((s, o) => s + o.total, 0),
        },
        month: {
          orders: monthOrders.length,
          revenue: monthOrders.reduce((s, o) => s + o.total, 0),
        },
        year: {
          orders: yearOrders.length,
          revenue: yearOrders.reduce((s, o) => s + o.total, 0),
        },
        allTime: {
          orders: allOrders.length,
          revenue: filterOrders(new Date(0)).reduce((s, o) => s + o.total, 0),
        },
      },
      statusBreakdown,
      topDistricts,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
