import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifyAdminAccess } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const orderItemSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional().nullable(),
  nameSnapshot: z.string(),
  sizeSnapshot: z.string().optional().nullable(),
  colorSnapshot: z.string().optional().nullable(),
  priceSnapshot: z.number(),
  qty: z.number(),
  imageSnapshot: z.string().optional().nullable(),
});

type OrderItemInput = z.infer<typeof orderItemSchema>;

const updateOrderSchema = z.object({
  status: z
    .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED', 'RETURNED'])
    .optional(),
  note: z.string().optional().nullable(),
  shopNote: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  courierName: z.string().optional().nullable(),
  courierTrackingNo: z.string().optional().nullable(),
  paymentMethod: z.string().optional(),
  paymentStatus: z.string().optional(),
  shippingName: z.string().optional(),
  shippingPhone: z.string().optional(),
  shippingDistrict: z.string().optional(),
  shippingThana: z.string().optional().nullable(),
  shippingArea: z.string().optional().nullable(),
  shippingAddress: z.string().optional().nullable(),
  manualDiscount: z.number().optional(),
  paidAmount: z.number().optional(),
  deliveryCharge: z.number().optional(),
  activityNote: z.string().optional(),
  items: z.array(orderItemSchema).optional(),
});

// GET: Single order
export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminAccess('orders');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Orders permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
        activityLogs: { orderBy: { createdAt: 'desc' } },
        assignedTo: { select: { id: true, name: true, email: true, displayColor: true } },
        customer: { select: { id: true, name: true, phone: true, email: true } },
        appeals: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to get order' }, { status: 500 });
  }
}

// PATCH: Update order
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await verifyAdminAccess('orders');
    if (!auth.authorized) {
      return NextResponse.json(
        { success: false, error: auth.reason === 'forbidden' ? 'Forbidden: Orders permission required' : 'Unauthorized' },
        { status: auth.reason === 'forbidden' ? 403 : 401 }
      );
    }
    const session = auth.session;

    const body = await request.json();
    const result = updateOrderSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error.errors[0]?.message },
        { status: 400 }
      );
    }

    const order = await db.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const { status, activityNote, assignedToId, items, ...restUpdate } = result.data;
    const updateData: Record<string, unknown> = { ...restUpdate };

    if (restUpdate.manualDiscount !== undefined || restUpdate.deliveryCharge !== undefined) {
      const newDelivery = restUpdate.deliveryCharge ?? order.deliveryCharge;
      const newManualDiscount = restUpdate.manualDiscount ?? order.manualDiscount;
      updateData.total = order.subtotal + newDelivery - newManualDiscount - order.discount;
    }

    const activityLogsData: Array<{
      orderId: string;
      adminId: string;
      adminName: string;
      action: string;
      oldValue?: string;
      newValue?: string;
      note?: string;
    }> = [];

    // 1. Status Change
    if (status && status !== order.status) {
      updateData.status = status;
      await db.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status,
          note: activityNote || `Status changed to ${status}`,
          adminId: session.id,
          adminName: session.name,
        },
      });

      activityLogsData.push({
        orderId: params.id,
        adminId: session.id,
        adminName: session.name,
        action: 'STATUS_CHANGED',
        oldValue: order.status,
        newValue: status,
        note: activityNote || `Status updated from ${order.status} to ${status}`,
      });
    }

    // 2. Staff Assignment
    if (assignedToId !== undefined && session.role === 'OWNER') {
      if (assignedToId) {
        // Enforce: Staff MUST be online to receive order assignment
        const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
        const activeSession = await db.staffSession.findFirst({
          where: {
            staffId: assignedToId,
            isActive: true,
            lastSeenAt: { gte: fiveMinAgo },
          },
        });
        if (!activeSession) {
          return NextResponse.json(
            { success: false, error: 'Cannot assign to offline staff. The staff member must be online.' },
            { status: 400 }
          );
        }
      }

      updateData.assignedToId = assignedToId;
      if (assignedToId && assignedToId !== order.assignedToId) {
        const newAssignee = await db.adminUser.findUnique({
          where: { id: assignedToId },
          select: { name: true },
        });
        activityLogsData.push({
          orderId: params.id,
          adminId: session.id,
          adminName: session.name,
          action: 'ASSIGNED',
          oldValue: order.assignedToId || 'Unassigned',
          newValue: newAssignee?.name || assignedToId,
          note: `Reassigned to ${newAssignee?.name || assignedToId} by ${session.name}`,
        });
      }
    }

    // 3. Optional Activity Note
    if (activityNote && !status) {
      activityLogsData.push({
        orderId: params.id,
        adminId: session.id,
        adminName: session.name,
        action: 'NOTE_ADDED',
        note: activityNote,
      });
    }

    // 4. Granular Field-Level Diffs for Edits
    const fieldDefinitions: Array<{
      key: string;
      label: string;
      format?: (val: unknown) => string;
    }> = [
      { key: 'shippingName', label: 'Customer Name' },
      { key: 'shippingPhone', label: 'Phone Number' },
      { key: 'shippingDistrict', label: 'District' },
      { key: 'shippingThana', label: 'Thana' },
      { key: 'shippingArea', label: 'Area' },
      { key: 'shippingAddress', label: 'Address' },
      { key: 'courierName', label: 'Courier' },
      { key: 'courierTrackingNo', label: 'Tracking No' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'paymentStatus', label: 'Payment Status' },
      {
        key: 'deliveryCharge',
        label: 'Delivery Charge',
        format: (v) => `৳${Number(v || 0).toLocaleString()}`,
      },
      {
        key: 'manualDiscount',
        label: 'Discount',
        format: (v) => `৳${Number(v || 0).toLocaleString()}`,
      },
      {
        key: 'paidAmount',
        label: 'Paid Amount',
        format: (v) => `৳${Number(v || 0).toLocaleString()}`,
      },
      { key: 'note', label: 'Customer Note' },
      { key: 'shopNote', label: 'Shop Note' },
    ];

    fieldDefinitions.forEach(({ key, label, format }) => {
      const newVal = (restUpdate as Record<string, unknown>)[key];
      if (newVal !== undefined) {
        const oldRaw = (order as Record<string, unknown>)[key];
        const oldStr = oldRaw !== undefined && oldRaw !== null ? String(oldRaw).trim() : '';
        const newStr = newVal !== null ? String(newVal).trim() : '';

        if (oldStr !== newStr) {
          const formattedOld = format ? format(oldRaw) : oldStr || 'None';
          const formattedNew = format ? format(newVal) : newStr || 'None';

          activityLogsData.push({
            orderId: params.id,
            adminId: session.id,
            adminName: session.name,
            action: 'EDITED',
            oldValue: `${label}: ${formattedOld}`,
            newValue: `${label}: ${formattedNew}`,
            note: `Updated ${label} from "${formattedOld}" to "${formattedNew}"`,
          });
        }
      }
    });

    // 5. Product items changes
    if (items && Array.isArray(items)) {
      const newItems: OrderItemInput[] = items;
      const newSubtotal = newItems.reduce(
        (sum: number, item: OrderItemInput) =>
          sum + (Number(item.priceSnapshot) || 0) * (Number(item.qty) || 1),
        0
      );
      const delivery = restUpdate.deliveryCharge ?? order.deliveryCharge;
      const discount = restUpdate.manualDiscount ?? order.manualDiscount;
      updateData.subtotal = newSubtotal;
      updateData.total = newSubtotal + delivery - discount - order.discount;

      const oldSummary = `${order.items.length} ${order.items.length === 1 ? 'item' : 'items'} (৳${order.subtotal.toLocaleString()})`;
      const newSummary = `${newItems.length} ${newItems.length === 1 ? 'item' : 'items'} (৳${newSubtotal.toLocaleString()})`;

      const oldItemsStr = order.items
        .map(
          (i) =>
            `${i.nameSnapshot} (${i.sizeSnapshot || 'Std'}/${i.colorSnapshot || 'Def'}) x${i.qty}`
        )
        .sort()
        .join(', ');
      const newItemsStr = newItems
        .map(
          (i: OrderItemInput) =>
            `${i.nameSnapshot} (${i.sizeSnapshot || 'Std'}/${i.colorSnapshot || 'Def'}) x${i.qty}`
        )
        .sort()
        .join(', ');

      if (oldItemsStr !== newItemsStr) {
        activityLogsData.push({
          orderId: params.id,
          adminId: session.id,
          adminName: session.name,
          action: 'EDITED',
          oldValue: `Products: ${oldSummary}`,
          newValue: `Products: ${newSummary}`,
          note: `Updated items to: ${newItemsStr}`,
        });
      }
    }

    const txOps: Prisma.PrismaPromise<unknown>[] = [
      db.order.update({
        where: { id: params.id },
        data: updateData,
      }),
    ];

    if (items && Array.isArray(items)) {
      txOps.push(db.orderItem.deleteMany({ where: { orderId: params.id } }));
      if (items.length > 0) {
        txOps.push(
          db.orderItem.createMany({
            data: items.map((item: OrderItemInput) => ({
              orderId: params.id,
              productId: item.productId,
              variantId: item.variantId || null,
              nameSnapshot: item.nameSnapshot,
              sizeSnapshot: item.sizeSnapshot || null,
              colorSnapshot: item.colorSnapshot || null,
              priceSnapshot: Number(item.priceSnapshot) || 0,
              qty: Number(item.qty) || 1,
              imageSnapshot: item.imageSnapshot || null,
            })),
          })
        );
      }
    }

    activityLogsData.forEach((log) => {
      txOps.push(db.orderActivityLog.create({ data: log }));
    });

    await db.$transaction(txOps);

    const updatedOrder = await db.order.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        activityLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
        statusHistory: { orderBy: { createdAt: 'desc' }, take: 5 },
        assignedTo: { select: { id: true, name: true, displayColor: true } },
        customer: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update order' }, { status: 500 });
  }
}
