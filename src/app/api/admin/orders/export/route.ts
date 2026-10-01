import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const auth = await verifyAdminAccess('orders');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Orders permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const orders = await db.order.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const csvHeaders = [
      'Order No',
      'Date',
      'Customer Name',
      'Phone',
      'District',
      'Area',
      'Full Address',
      'Subtotal',
      'Delivery',
      'Total',
      'Payment Method',
      'Payment Status',
      'Status',
    ];

    const csvRows = orders.map((o) => {
      const escape = (val: string | number) => `"${String(val).replace(/"/g, '""')}"`;
      return [
        escape(o.orderNo),
        escape(new Date(o.createdAt).toISOString().split('T')[0]),
        escape(o.shippingName),
        escape(o.shippingPhone),
        escape(o.shippingDistrict),
        escape(o.shippingArea),
        escape(o.shippingAddress),
        escape(o.subtotal),
        escape(o.deliveryCharge),
        escape(o.total),
        escape(o.paymentMethod),
        escape(o.paymentStatus),
        escape(o.status),
      ].join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="gents_hood_orders_${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error('Failed to export CSV:', error);
    return NextResponse.json({ success: false, error: 'Failed to export CSV' }, { status: 500 });
  }
}
