'use client';

interface OrderItem {
  id: string;
  nameSnapshot: string;
  sizeSnapshot?: string | null;
  colorSnapshot?: string | null;
  priceSnapshot: number;
  qty: number;
  imageSnapshot?: string | null;
}

export interface PrintableOrder {
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
  shippingArea?: string | null;
  shippingAddress?: string | null;
  note?: string | null;
  shopNote?: string | null;
  courierName?: string | null;
  courierTrackingNo?: string | null;
  assignedTo?: { id: string; name: string; displayColor: string } | null;
  items: OrderItem[];
  createdAt: string;
  activityLogs?: Array<{
    id: string;
    action: string;
    adminName?: string | null;
    createdAt: string;
  }>;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#eab308',
  PROCESSING: '#f59e0b',
  SHIPPED: '#8b5cf6',
  COMPLETED: '#10b981',
  CANCELLED: '#ef4444',
  RETURNED: '#f97316',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  COMPLETED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

function formatDate(d: string) {
  try {
    return new Intl.DateTimeFormat('en-BD', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(d));
  } catch {
    return d;
  }
}

function buildInvoicePage(order: PrintableOrder, confirmedBy: string): string {
  const createdByLog = order.activityLogs?.find((l) => l.action === 'CREATED');
  const createdByName = createdByLog?.adminName || confirmedBy;
  const assignedName = order.assignedTo?.name || '';
  const processedBy = assignedName || createdByName;
  const statusColor = STATUS_COLOR[order.status] || '#6b7280';
  const statusLabel = STATUS_LABEL[order.status] || order.status;

  const itemRows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;vertical-align:middle;">
          <div style="display:flex;align-items:center;gap:12px;">
            ${
              item.imageSnapshot
                ? `<img src="${item.imageSnapshot}" alt="" style="width:54px;height:54px;object-fit:cover;border-radius:8px;border:1px solid #e5e7eb;flex-shrink:0;" onerror="this.parentNode.innerHTML='<div style=\\'width:54px;height:54px;border-radius:8px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;\\'>👕</div>'">`
                : `<div style="width:54px;height:54px;border-radius:8px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">👕</div>`
            }
            <div>
              <div style="font-weight:700;font-size:13px;color:#111827;line-height:1.3;">${item.nameSnapshot}</div>
              <div style="margin-top:4px;display:flex;gap:5px;flex-wrap:wrap;">
                ${item.sizeSnapshot ? `<span style="font-size:11px;background:#f3f4f6;padding:1px 7px;border-radius:4px;color:#374151;">Size: ${item.sizeSnapshot}</span>` : ''}
                ${item.colorSnapshot ? `<span style="font-size:11px;background:#f3f4f6;padding:1px 7px;border-radius:4px;color:#374151;">Color: ${item.colorSnapshot}</span>` : ''}
              </div>
            </div>
          </div>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:center;font-size:13px;color:#374151;font-weight:700;">${item.qty}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:13px;color:#374151;font-weight:600;">৳${Number(item.priceSnapshot).toLocaleString()}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-size:14px;font-weight:800;color:#111827;">৳${(item.priceSnapshot * item.qty).toLocaleString()}</td>
      </tr>`
    )
    .join('');

  const shippingParts = [
    order.shippingAddress,
    order.shippingThana,
    order.shippingArea,
    order.shippingDistrict,
  ]
    .filter(Boolean)
    .join(', ');

  const due = Math.max(0, order.total - order.paidAmount);

  return `
  <div class="page">
    <!-- TOP HEADER BAR -->
    <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:18px;margin-bottom:20px;border-bottom:2.5px solid #111827;">
      <!-- Brand -->
      <div>
        <img src="/images/logo.png" alt="Gents Hood"
          style="height:56px;width:auto;object-fit:contain;"
          onerror="this.src='/images/logo.jpg'" />
      </div>
      <!-- Invoice meta -->
      <div style="text-align:right;">
        <div style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#9ca3af;font-weight:700;">INVOICE</div>
        <div style="font-size:20px;font-weight:900;color:#111827;font-family:monospace;letter-spacing:1px;margin-top:2px;">${order.orderNo}</div>
        <div style="display:inline-block;margin-top:6px;padding:3px 12px;border-radius:20px;font-size:10px;font-weight:800;color:#fff;background:${statusColor};letter-spacing:0.5px;">${statusLabel.toUpperCase()}</div>
      </div>
    </div>

    <!-- THREE INFO BOXES -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:22px;">
      <!-- Ship To -->
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;padding:13px 14px;">
        <div style="font-size:8.5px;font-weight:800;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">📦 Ship To</div>
        <div style="font-size:14px;font-weight:800;color:#111827;">${order.shippingName}</div>
        <div style="font-size:12px;font-family:monospace;color:#374151;font-weight:600;margin-top:3px;">${order.shippingPhone}</div>
        <div style="font-size:11px;color:#6b7280;margin-top:6px;line-height:1.6;">${shippingParts || '—'}</div>
      </div>

      <!-- Order Info -->
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;padding:13px 14px;">
        <div style="font-size:8.5px;font-weight:800;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">📋 Order Info</div>
        <table style="width:100%;font-size:11px;border-collapse:collapse;">
          <tr><td style="color:#9ca3af;padding:1.5px 0;white-space:nowrap;">Date</td><td style="font-weight:700;color:#111827;padding-left:8px;">${formatDate(order.createdAt)}</td></tr>
          <tr><td style="color:#9ca3af;padding:1.5px 0;">Payment</td><td style="font-weight:700;color:#111827;padding-left:8px;">${order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentMethod}</td></tr>
          <tr><td style="color:#9ca3af;padding:1.5px 0;">Status</td><td style="font-weight:700;padding-left:8px;color:${order.paymentStatus === 'PAID' ? '#10b981' : '#ef4444'};">${order.paymentStatus}</td></tr>
          ${order.courierName ? `<tr><td style="color:#9ca3af;padding:1.5px 0;">Courier</td><td style="font-weight:700;color:#111827;padding-left:8px;">${order.courierName}</td></tr>` : ''}
          ${order.courierTrackingNo ? `<tr><td style="color:#9ca3af;padding:1.5px 0;">Tracking</td><td style="font-weight:700;color:#111827;font-family:monospace;padding-left:8px;">${order.courierTrackingNo}</td></tr>` : ''}
        </table>
      </div>

      <!-- Processed By -->
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:10px;padding:13px 14px;">
        <div style="font-size:8.5px;font-weight:800;color:#9ca3af;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:8px;">✅ Processed By</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:38px;height:38px;border-radius:50%;background:${order.assignedTo?.displayColor || '#6366f1'};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:#fff;flex-shrink:0;">
            ${processedBy.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style="font-size:13px;font-weight:800;color:#111827;">${processedBy}</div>
            <div style="font-size:10px;color:#9ca3af;margin-top:2px;">Confirmed this order</div>
          </div>
        </div>
        ${
          createdByName && createdByName !== processedBy
            ? `<div style="margin-top:9px;padding-top:9px;border-top:1px solid #e5e7eb;font-size:10px;color:#6b7280;">
                Created by: <strong style="color:#374151;">${createdByName}</strong>
               </div>`
            : ''
        }
      </div>
    </div>

    <!-- PRODUCTS TABLE -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
      <thead>
        <tr style="background:#111827;">
          <th style="padding:10px 12px;text-align:left;font-size:9.5px;font-weight:700;color:#e5e7eb;text-transform:uppercase;letter-spacing:1px;border-radius:8px 0 0 0;">Product</th>
          <th style="padding:10px 12px;text-align:center;font-size:9.5px;font-weight:700;color:#e5e7eb;text-transform:uppercase;letter-spacing:1px;width:60px;">Qty</th>
          <th style="padding:10px 12px;text-align:right;font-size:9.5px;font-weight:700;color:#e5e7eb;text-transform:uppercase;letter-spacing:1px;width:110px;">Unit Price</th>
          <th style="padding:10px 12px;text-align:right;font-size:9.5px;font-weight:700;color:#e5e7eb;text-transform:uppercase;letter-spacing:1px;border-radius:0 8px 0 0;width:110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- TOTALS -->
    <div style="display:flex;justify-content:flex-end;margin-bottom:18px;">
      <div style="width:270px;">
        <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#6b7280;border-bottom:1px dashed #e5e7eb;">
          <span>Subtotal</span><span style="font-weight:600;color:#374151;">৳${order.subtotal.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#6b7280;border-bottom:1px dashed #e5e7eb;">
          <span>Delivery Charge</span><span style="font-weight:600;color:#374151;">৳${order.deliveryCharge.toLocaleString()}</span>
        </div>
        ${order.manualDiscount > 0 ? `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-bottom:1px dashed #e5e7eb;"><span style="color:#ef4444;">Discount</span><span style="font-weight:600;color:#ef4444;">−৳${order.manualDiscount.toLocaleString()}</span></div>` : ''}
        ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:5px 0;font-size:12px;border-bottom:1px dashed #e5e7eb;"><span style="color:#ef4444;">Coupon</span><span style="font-weight:600;color:#ef4444;">−৳${order.discount.toLocaleString()}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:2px;border-top:2px solid #111827;">
          <span style="font-size:14px;font-weight:800;color:#111827;">GRAND TOTAL</span>
          <span style="font-size:18px;font-weight:900;color:#111827;">৳${order.total.toLocaleString()}</span>
        </div>
        ${order.paidAmount > 0 ? `
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#10b981;">Paid Amount</span><span style="font-weight:700;color:#10b981;">৳${order.paidAmount.toLocaleString()}</span></div>
          <div style="display:flex;justify-content:space-between;padding:3px 0;font-size:12px;"><span style="color:#ef4444;">Due Amount</span><span style="font-weight:700;color:#ef4444;">৳${due.toLocaleString()}</span></div>
        ` : ''}
      </div>
    </div>

    <!-- NOTES -->
    ${
      order.note || order.shopNote
        ? `<div style="display:grid;grid-template-columns:${order.note && order.shopNote ? '1fr 1fr' : '1fr'};gap:12px;margin-bottom:18px;">
            ${order.note ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:11px 13px;"><div style="font-size:8.5px;font-weight:800;color:#92400e;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;">💬 Customer Note</div><div style="font-size:12px;color:#78350f;line-height:1.5;">${order.note}</div></div>` : ''}
            ${order.shopNote ? `<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:11px 13px;"><div style="font-size:8.5px;font-weight:800;color:#166534;letter-spacing:1px;text-transform:uppercase;margin-bottom:5px;">🏪 Shop Note</div><div style="font-size:12px;color:#15803d;line-height:1.5;">${order.shopNote}</div></div>` : ''}
          </div>`
        : ''
    }

    <!-- FOOTER -->
    <div style="margin-top:auto;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-size:11px;font-weight:700;color:#374151;">Thank you for shopping with Gents Hood! 🧡</div>
        <div style="font-size:10px;color:#9ca3af;margin-top:2px;">Premium Fashion — Quality You Can Trust</div>
      </div>
      <div style="font-size:9px;color:#d1d5db;font-family:monospace;">Printed: ${new Date().toLocaleString('en-BD')}</div>
    </div>
  </div>`;
}

export function printOrders(orders: PrintableOrder[], confirmedBy: string) {
  const pages = orders.map((o) => buildInvoicePage(o, confirmedBy)).join('\n');
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice — Gents Hood</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#111827;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .page{width:210mm;min-height:277mm;margin:0 auto;padding:18mm 16mm;display:flex;flex-direction:column;background:#fff;}
  @media print{
    body{margin:0;}
    .page{page-break-after:always;break-after:page;padding:14mm 12mm;}
    .page:last-child{page-break-after:avoid;break-after:avoid;}
  }
  @media screen{
    body{background:#e5e7eb;padding:24px;}
    .page{border-radius:8px;box-shadow:0 4px 32px rgba(0,0,0,.15);margin-bottom:24px;}
  }
</style>
</head>
<body>
${pages}
<script>
  window.addEventListener('load',function(){
    setTimeout(function(){
      window.print();
      window.addEventListener('afterprint',function(){ window.close(); });
    },600);
  });
<\/script>
</body>
</html>`;

  const w = window.open('', '_blank', 'width=960,height=750,scrollbars=yes');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
