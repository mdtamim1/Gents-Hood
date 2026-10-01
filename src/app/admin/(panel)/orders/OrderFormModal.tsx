'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Minus,
  Trash2,
  Search,
  Loader2,
  User,
  Phone,
  MapPin,
  Calendar,
  ShoppingCart,
  AlertCircle,
  Hash,
  Check,
  History,
  ArrowRight,
} from 'lucide-react';
import { BD_DISTRICTS, getUpazilas } from '@/lib/constants/bd-locations';

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  colorHex?: string | null;
  stock: number;
  priceOverride?: number | null;
}

interface ActivityLog {
  id: string;
  action: string;
  adminName?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  note?: string | null;
  createdAt: string;
}

function formatHistoryDate(d: string) {
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

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  variants: ProductVariant[];
}

interface OrderItem {
  productId: string;
  variantId?: string;
  nameSnapshot: string;
  sizeSnapshot?: string;
  colorSnapshot?: string;
  priceSnapshot: number;
  qty: number;
  imageSnapshot?: string;
}

const COURIERS = ['Pathao', 'Steadfast', 'Redx', 'Paperfly', 'Sundarban', 'Other'];
const STATUSES = ['PROCESSING', 'PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED'];
const PAYMENT_METHODS = [
  { value: 'COD', label: 'Cash on Delivery (COD)' },
  { value: 'BKASH', label: 'bKash' },
  { value: 'NAGAD', label: 'Nagad' },
  { value: 'ROCKET', label: 'Rocket' },
  { value: 'BANK', label: 'Bank Transfer' },
];

const SHOP_NOTE_TAGS = [
  'Urgent delivery request',
  'Handle with care',
  'Gift wrap please',
  'Call before delivery',
];

interface OrderFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editOrder?: Record<string, unknown> | null;
}

export function OrderFormModal({ onClose, onSuccess, editOrder }: OrderFormModalProps) {
  // Generate random 4-digit GH invoice number if creating new order
  const [invoiceNo] = useState(() => {
    if (editOrder?.orderNo && typeof editOrder.orderNo === 'string') {
      return editOrder.orderNo;
    }
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `GH-${rand}`;
  });

  const [form, setForm] = useState({
    shippingName: (editOrder?.shippingName as string) || '',
    shippingPhone: (editOrder?.shippingPhone as string) || '',
    shippingDistrict: (editOrder?.shippingDistrict as string) || 'Dhaka',
    shippingThana: (editOrder?.shippingThana as string) || '',
    shippingArea: (editOrder?.shippingArea as string) || '',
    shippingAddress: (editOrder?.shippingAddress as string) || '',
    paymentMethod: (editOrder?.paymentMethod as string) || 'COD',
    paymentStatus: (editOrder?.paymentStatus as string) || 'UNPAID',
    courierName: (editOrder?.courierName as string) || 'Pathao',
    status: (editOrder?.status as string) || 'PROCESSING',
    note: (editOrder?.note as string) || '',
    shopNote: (editOrder?.shopNote as string) || '',
    memo: '',
    deliveryCharge: typeof editOrder?.deliveryCharge === 'number' ? editOrder.deliveryCharge : 120,
    manualDiscount: (editOrder?.manualDiscount as number) || 0,
    paidAmount: (editOrder?.paidAmount as number) || 0,
    couponCode: (editOrder?.couponCode as string) || '',
  });

  // Date formatted for date input
  const [orderDate, setOrderDate] = useState(() => {
    if (editOrder?.createdAt) {
      try {
        return new Date(editOrder.createdAt as string).toISOString().split('T')[0];
      } catch {
        // fallback
      }
    }
    return new Date().toISOString().split('T')[0];
  });

  // Items state populated from editOrder or empty
  const [items, setItems] = useState<OrderItem[]>(() => {
    if (editOrder?.items && Array.isArray(editOrder.items)) {
      return (
        editOrder.items as Array<{
          productId: string;
          variantId?: string;
          nameSnapshot: string;
          sizeSnapshot?: string;
          colorSnapshot?: string;
          priceSnapshot: number;
          qty: number;
          imageSnapshot?: string;
        }>
      ).map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        nameSnapshot: i.nameSnapshot,
        sizeSnapshot: i.sizeSnapshot || 'Standard',
        colorSnapshot: i.colorSnapshot || 'Default',
        priceSnapshot: i.priceSnapshot,
        qty: i.qty,
        imageSnapshot: i.imageSnapshot,
      }));
    }
    return [];
  });

  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Selected product configuration state (automated color & size)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQty, setSelectedQty] = useState<number>(1);

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<ActivityLog[]>(() => {
    if (editOrder?.activityLogs && Array.isArray(editOrder.activityLogs)) {
      return editOrder.activityLogs as ActivityLog[];
    }
    return [];
  });
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Fetch full live history logs when history modal opens
  useEffect(() => {
    if (showHistoryModal && editOrder?.id) {
      setLoadingHistory(true);
      fetch(`/api/admin/orders/${editOrder.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success && data.order?.activityLogs) {
            setHistoryLogs(data.order.activityLogs);
          }
        })
        .catch((e) => console.error('History fetch error:', e))
        .finally(() => setLoadingHistory(false));
    }
  }, [showHistoryModal, editOrder]);

  // Available upazilas for the selected district
  const upazilaList = useMemo(() => {
    return form.shippingDistrict ? getUpazilas(form.shippingDistrict) : [];
  }, [form.shippingDistrict]);

  // Search products debounced
  useEffect(() => {
    if (!productSearch.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `/api/admin/products?search=${encodeURIComponent(productSearch)}&status=ACTIVE`
        );
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.products?.slice(0, 8) || []);
        }
      } catch {
        // ignore
      } finally {
        setIsSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Handle selecting a product from search -> automate color and size selection
  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedQty(1);

    if (product.variants && product.variants.length > 0) {
      // Find first in-stock variant if possible
      const firstInStock = product.variants.find((v) => v.stock > 0) || product.variants[0];
      const initialColor = firstInStock?.color || product.variants[0]?.color || '';
      setSelectedColor(initialColor);

      // Filter available sizes for this color
      const matchingVariant =
        product.variants.find((v) => v.color === initialColor && v.stock > 0) ||
        product.variants.find((v) => v.color === initialColor) ||
        firstInStock;

      setSelectedSize(matchingVariant?.size || 'Standard');
    } else {
      setSelectedColor('');
      setSelectedSize('Standard');
    }
  };

  // When color is changed, auto-select size from available in-stock sizes for that color
  const handleColorChange = (newColor: string) => {
    setSelectedColor(newColor);
    if (!selectedProduct?.variants) return;

    const variantsForColor = selectedProduct.variants.filter((v) => v.color === newColor);
    const sameSizeInStock = variantsForColor.find((v) => v.size === selectedSize && v.stock > 0);
    if (!sameSizeInStock) {
      const firstInStock = variantsForColor.find((v) => v.stock > 0);
      setSelectedSize(firstInStock?.size || variantsForColor[0]?.size || 'Standard');
    }
    setSelectedQty(1);
  };

  // Unique available colors for selected product
  const availableColors = useMemo(() => {
    if (!selectedProduct?.variants) return [];
    return Array.from(new Set(selectedProduct.variants.map((v) => v.color).filter(Boolean)));
  }, [selectedProduct]);

  // Available variants for selected color
  const variantsForCurrentColor = useMemo(() => {
    if (!selectedProduct?.variants) return [];
    if (!selectedColor) return selectedProduct.variants;
    return selectedProduct.variants.filter((v) => v.color === selectedColor);
  }, [selectedProduct, selectedColor]);

  // Current active variant matching color + size
  const activeVariant = useMemo(() => {
    if (!selectedProduct?.variants || selectedProduct.variants.length === 0) return null;
    return (
      variantsForCurrentColor.find((v) => v.size === selectedSize) ||
      variantsForCurrentColor[0] ||
      null
    );
  }, [selectedProduct?.variants, variantsForCurrentColor, selectedSize]);

  const activePrice = activeVariant?.priceOverride ?? selectedProduct?.price ?? 0;
  const activeStock = activeVariant ? activeVariant.stock : 999;
  const isOutOfStock = activeVariant ? activeVariant.stock <= 0 : false;

  const handleAddConfiguredProduct = () => {
    if (!selectedProduct) return;
    if (isOutOfStock) return;

    const size = selectedSize || 'Standard';
    const color = selectedColor || 'Default';
    const price = activePrice;
    const qty = Math.max(1, selectedQty);

    const existingIdx = items.findIndex(
      (i) =>
        i.productId === selectedProduct.id &&
        i.variantId === activeVariant?.id &&
        i.sizeSnapshot === size &&
        i.colorSnapshot === color
    );

    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].qty += qty;
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: selectedProduct.id,
          variantId: activeVariant?.id,
          nameSnapshot: selectedProduct.name,
          sizeSnapshot: size,
          colorSnapshot: color,
          priceSnapshot: price,
          qty: qty,
          imageSnapshot: selectedProduct.images?.[0]?.url,
        },
      ]);
    }

    // Reset configurator and search
    setSelectedProduct(null);
    setProductSearch('');
    setSearchResults([]);
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQty = (idx: number, newQty: number) => {
    if (newQty < 1) return;
    const updated = [...items];
    updated[idx].qty = newQty;
    setItems(updated);
  };

  const updateItemColor = (idx: number, newColor: string) => {
    const updated = [...items];
    updated[idx].colorSnapshot = newColor;
    setItems(updated);
  };

  const updateItemSize = (idx: number, newSize: string) => {
    const updated = [...items];
    updated[idx].sizeSnapshot = newSize;
    setItems(updated);
  };

  const handleAppendShopNote = (tag: string) => {
    setForm((f) => ({
      ...f,
      shopNote: f.shopNote ? `${f.shopNote}, ${tag}` : tag,
    }));
  };

  const subtotal = items.reduce((s, i) => s + i.priceSnapshot * i.qty, 0);
  const total = Math.max(
    0,
    subtotal + Number(form.deliveryCharge || 0) - Number(form.manualDiscount || 0)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shippingName.trim() || !form.shippingPhone.trim()) {
      setError('Customer name and phone number are required.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one product to the order.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      const endpoint = editOrder ? `/api/admin/orders/${editOrder.id}` : '/api/admin/orders';
      const method = editOrder ? 'PATCH' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderNo: invoiceNo,
          shippingName: form.shippingName.trim(),
          shippingPhone: form.shippingPhone.trim(),
          shippingDistrict: form.shippingDistrict,
          shippingThana: form.shippingThana,
          shippingArea: form.shippingArea,
          shippingAddress: form.shippingAddress,
          courierName: form.courierName,
          status: form.status,
          paymentMethod: form.paymentMethod,
          paymentStatus: form.paymentStatus,
          note: form.note,
          shopNote: form.shopNote,
          memo: form.memo,
          deliveryCharge: Number(form.deliveryCharge) || 0,
          manualDiscount: Number(form.manualDiscount) || 0,
          paidAmount: Number(form.paidAmount) || 0,
          couponCode: form.couponCode,
          subtotal,
          total,
          items: items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save order.');
      }
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-5">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 my-auto flex max-h-[94vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#141416] text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#17171a] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-white shadow-sm">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold tracking-tight text-white">
                {editOrder ? 'Edit Order' : 'Create New Order'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {editOrder
                  ? `Editing invoice ${editOrder.orderNo}`
                  : 'Fill in the details below to create a manual order'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Invoice Badge */}
            <span className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-1 font-mono text-xs font-semibold text-amber-400">
              {invoiceNo}
            </span>
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Form Body */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} id="order-create-form">
            <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12">
              {/* LEFT COLUMN: Store, Customer & Shipping Details (7 cols) */}
              <div className="space-y-4 lg:col-span-7">
                {/* Row 1: Store Name & Invoice Number */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      STORE NAME
                    </label>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value="Gents Hood"
                      className="w-full cursor-default select-none rounded-lg border border-white/[0.08] bg-[#1b1b1e] px-3.5 py-2.5 text-xs font-medium text-zinc-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      INVOICE NUMBER
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={invoiceNo}
                        className="w-full select-none rounded-lg border border-white/[0.08] bg-[#1b1b1e] py-2.5 pl-3.5 pr-9 font-mono text-xs text-zinc-300 outline-none"
                      />
                      <Hash className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    </div>
                  </div>
                </div>

                {/* Row 2: Customer Name & Phone (Email removed as requested) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      CUSTOMER NAME <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        required
                        value={form.shippingName}
                        onChange={(e) => setForm((f) => ({ ...f, shippingName: e.target.value }))}
                        placeholder="Full Name"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      CUSTOMER PHONE <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="tel"
                        required
                        maxLength={11}
                        value={form.shippingPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                          setForm((f) => ({ ...f, shippingPhone: val }));
                        }}
                        placeholder="01XXXXXXXXX"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] py-2.5 pl-9 pr-3 font-mono text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Customer Address */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    CUSTOMER ADDRESS
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={form.shippingAddress}
                      onChange={(e) => setForm((f) => ({ ...f, shippingAddress: e.target.value }))}
                      placeholder="House No, Road, Village / Area... (optional)"
                      className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] py-2.5 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Row 4: Courier | Order Status | Order Date (3 columns) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      COURIER
                    </label>
                    <select
                      value={form.courierName}
                      onChange={(e) => setForm((f) => ({ ...f, courierName: e.target.value }))}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-500"
                    >
                      {COURIERS.map((c) => (
                        <option key={c} value={c} className="bg-[#18181b] text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      ORDER STATUS
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                      className={`w-full rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2.5 text-xs font-semibold outline-none focus:border-zinc-500 ${
                        form.status === 'PROCESSING'
                          ? 'text-amber-400'
                          : form.status === 'PENDING'
                            ? 'text-yellow-400'
                            : form.status === 'SHIPPED'
                              ? 'text-blue-400'
                              : form.status === 'COMPLETED'
                                ? 'text-emerald-400'
                                : 'text-red-400'
                      }`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-[#18181b] text-white">
                          {s.charAt(0) + s.slice(1).toLowerCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      ORDER DATE
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2 text-xs text-white outline-none [color-scheme:dark] focus:border-zinc-500"
                      />
                      <Calendar className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    </div>
                  </div>
                </div>

                {/* Row 5: District | Thana / Upazila | Area / Neighborhood / Union (3 columns) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      DISTRICT
                    </label>
                    <select
                      value={form.shippingDistrict}
                      onChange={(e) => {
                        const d = e.target.value;
                        setForm((f) => ({
                          ...f,
                          shippingDistrict: d,
                          shippingThana: '',
                          deliveryCharge: d === 'Dhaka' ? 70 : 130,
                        }));
                      }}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-500"
                    >
                      <option value="" className="bg-[#18181b] text-white">
                        Select District
                      </option>
                      {BD_DISTRICTS.map((d) => (
                        <option key={d} value={d} className="bg-[#18181b] text-white">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      THANA / UPAZILA
                    </label>
                    <select
                      value={form.shippingThana}
                      onChange={(e) => setForm((f) => ({ ...f, shippingThana: e.target.value }))}
                      disabled={!form.shippingDistrict}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2.5 text-xs text-white outline-none focus:border-zinc-500 disabled:opacity-40"
                    >
                      <option value="" className="bg-[#18181b] text-white">
                        Select Thana
                      </option>
                      {upazilaList.map((u) => (
                        <option key={u} value={u} className="bg-[#18181b] text-white">
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      AREA / NEIGHBORHOOD / UNION
                    </label>
                    <input
                      type="text"
                      value={form.shippingArea}
                      onChange={(e) => setForm((f) => ({ ...f, shippingArea: e.target.value }))}
                      placeholder="Block C, Section 7..."
                      className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Row 6: Customer Note | Shop Note (2 columns) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      CUSTOMER NOTE
                    </label>
                    <textarea
                      value={form.note}
                      onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                      placeholder="Note for customer..."
                      rows={3}
                      className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#18181b] p-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      SHOP NOTE
                    </label>
                    <textarea
                      value={form.shopNote}
                      onChange={(e) => setForm((f) => ({ ...f, shopNote: e.target.value }))}
                      placeholder="Internal note..."
                      rows={2}
                      className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#18181b] p-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
                    />
                    {/* Quick Tags under Shop Note */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {SHOP_NOTE_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleAppendShopNote(tag)}
                          className="rounded border border-white/[0.08] bg-[#1f1f23] px-2 py-0.5 text-[10px] font-medium text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Products, Payment & Calculation Summary (5 cols) */}
              <div className="space-y-4 lg:col-span-5">
                {/* Add Products Section */}
                <div className="rounded-xl border border-white/[0.06] bg-[#17171a] p-4">
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    ADD PRODUCTS
                  </label>

                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => {
                        setProductSearch(e.target.value);
                        if (selectedProduct) setSelectedProduct(null);
                      }}
                      placeholder="Search product name..."
                      className="w-full rounded-lg border border-white/[0.08] bg-[#141416] py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400" />
                    )}
                  </div>

                  {/* Dropdown Search Results */}
                  {searchResults.length > 0 && !selectedProduct && (
                    <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#131315] shadow-xl">
                      {searchResults.map((product) => {
                        const colorsCount = new Set(
                          product.variants?.map((v) => v.color).filter(Boolean)
                        ).size;
                        const sizesCount = new Set(
                          product.variants?.map((v) => v.size).filter(Boolean)
                        ).size;

                        return (
                          <div
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            className="flex cursor-pointer items-center justify-between border-b border-white/[0.04] p-2.5 transition-colors hover:bg-white/[0.04] last:border-0"
                          >
                            <div className="flex min-w-0 items-center gap-2.5">
                              {product.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.images[0].url}
                                  alt={product.name}
                                  className="h-10 w-10 shrink-0 rounded-md border border-white/10 object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[9px] text-zinc-500">
                                  No Img
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold text-white">
                                  {product.name}
                                </p>
                                <div className="mt-0.5 flex items-center gap-2 text-[11px]">
                                  <span className="font-semibold text-amber-400">
                                    ৳{product.price}
                                  </span>
                                  {product.variants && product.variants.length > 0 && (
                                    <span className="text-[10px] text-zinc-400">
                                      {colorsCount > 0 &&
                                        `${colorsCount} ${colorsCount === 1 ? 'color' : 'colors'} · `}
                                      {sizesCount > 0 &&
                                        `${sizesCount} ${sizesCount === 1 ? 'size' : 'sizes'}`}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectProduct(product);
                              }}
                              className="shrink-0 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition-all hover:bg-amber-500/20"
                            >
                              Select
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* AUTOMATED PRODUCT CONFIGURATOR PANEL */}
                  {selectedProduct && (
                    <div className="mt-3 rounded-xl border border-amber-500/30 bg-[#161619] p-3.5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                      {/* Product Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                        <div className="flex items-center gap-2.5">
                          {selectedProduct.images?.[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={selectedProduct.images[0].url}
                              alt={selectedProduct.name}
                              className="h-10 w-10 shrink-0 rounded-md border border-white/10 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-zinc-800 text-[9px] text-zinc-500">
                              No Img
                            </div>
                          )}
                          <div>
                            <h4 className="line-clamp-1 text-xs font-bold text-white">
                              {selectedProduct.name}
                            </h4>
                            <p className="text-[11px] font-mono text-amber-400">
                              ৳{activePrice.toLocaleString()}{' '}
                              <span className="text-[10px] text-zinc-400">
                                ({isOutOfStock ? 'Out of stock' : `${activeStock} available`})
                              </span>
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedProduct(null)}
                          className="rounded p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
                          title="Change Product"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Automated Color Selection */}
                      {availableColors.length > 0 && (
                        <div className="mt-3">
                          <label className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            <span>Available Colors</span>
                            <span className="capitalize text-amber-400">{selectedColor}</span>
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {availableColors.map((color) => {
                              const isSelected = selectedColor === color;
                              const colorHasStock = selectedProduct.variants.some(
                                (v) => v.color === color && v.stock > 0
                              );
                              return (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() => handleColorChange(color)}
                                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                                    isSelected
                                      ? 'border-amber-400 bg-amber-400/10 font-bold text-white shadow-sm'
                                      : 'border-white/[0.08] bg-[#1a1a1e] text-zinc-300 hover:border-zinc-400'
                                  }`}
                                >
                                  <span
                                    className={`h-2 w-2 rounded-full ${
                                      isSelected ? 'bg-amber-400' : 'bg-zinc-500'
                                    }`}
                                  />
                                  <span>{color}</span>
                                  {!colorHasStock && (
                                    <span className="text-[9px] text-red-400">(Out)</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Automated Size Selection (filtered for selected color) */}
                      {variantsForCurrentColor.length > 0 && (
                        <div className="mt-3">
                          <label className="mb-1.5 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            <span>Available Sizes</span>
                            <span className="font-bold text-amber-400">{selectedSize}</span>
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {variantsForCurrentColor.map((v) => {
                              const isSelected = selectedSize === v.size;
                              const inStock = v.stock > 0;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  disabled={!inStock}
                                  onClick={() => {
                                    setSelectedSize(v.size);
                                    setSelectedQty(1);
                                  }}
                                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs transition-all ${
                                    isSelected
                                      ? 'border-amber-400 bg-amber-400/10 font-bold text-white shadow-sm'
                                      : inStock
                                        ? 'border-white/[0.08] bg-[#1a1a1e] text-zinc-300 hover:border-zinc-400'
                                        : 'cursor-not-allowed border-white/[0.04] bg-white/[0.01] text-zinc-600 line-through'
                                  }`}
                                >
                                  <span>{v.size}</span>
                                  <span
                                    className={`font-mono text-[10px] ${
                                      inStock ? 'text-zinc-400' : 'text-zinc-600'
                                    }`}
                                  >
                                    [{v.stock}]
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Quantity & Add Action Row */}
                      <div className="mt-3.5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-3">
                        {/* Quantity Counter */}
                        <div className="flex items-center rounded-lg border border-white/[0.08] bg-[#1a1a1e] p-0.5">
                          <button
                            type="button"
                            onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                            disabled={selectedQty <= 1 || isOutOfStock}
                            className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center font-mono text-xs font-bold text-white">
                            {selectedQty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedQty((q) => Math.min(activeStock, q + 1))}
                            disabled={selectedQty >= activeStock || isOutOfStock}
                            className="flex h-7 w-7 items-center justify-center rounded text-zinc-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Add Button */}
                        <button
                          type="button"
                          onClick={handleAddConfiguredProduct}
                          disabled={isOutOfStock}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-zinc-950 shadow-md transition-all hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                          <span>
                            {isOutOfStock
                              ? 'Out of Stock'
                              : `Add to Order · ৳${(activePrice * selectedQty).toLocaleString()}`}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Added Items List / Table */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      <span>PRODUCT / SIZE & COLOR</span>
                      <div className="flex items-center gap-6">
                        <span>QTY</span>
                        <span>PRICE</span>
                      </div>
                    </div>

                    <div className="mt-2 space-y-2">
                      {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.06] py-7 text-center">
                          <ShoppingCart className="mb-2 h-7 w-7 text-zinc-600" />
                          <p className="text-xs font-semibold text-zinc-400">
                            No products added yet
                          </p>
                          <p className="mt-0.5 text-[11px] text-zinc-500">
                            Search above to add products
                          </p>
                        </div>
                      ) : (
                        items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-[#141416] p-2.5 transition-colors"
                          >
                            <div className="flex min-w-0 flex-1 items-center gap-2.5">
                              {item.imageSnapshot ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={item.imageSnapshot}
                                  alt={item.nameSnapshot}
                                  className="h-9 w-9 shrink-0 rounded border border-white/10 object-cover"
                                />
                              ) : (
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-zinc-800 text-[9px] text-zinc-500">
                                  No Img
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-white/90">
                                  {item.nameSnapshot}
                                </p>

                                {/* Size & Color Options attached from customer/admin */}
                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                  {/* Size pill/input */}
                                  <div className="flex items-center gap-1 rounded border border-white/[0.08] bg-[#1a1a1d] px-1.5 py-0.5 text-[10px]">
                                    <span className="text-zinc-500">Size:</span>
                                    <input
                                      type="text"
                                      value={item.sizeSnapshot || ''}
                                      onChange={(e) => updateItemSize(idx, e.target.value)}
                                      placeholder="Size"
                                      className="w-12 bg-transparent text-[10px] font-medium text-zinc-300 outline-none"
                                    />
                                  </div>

                                  {/* Color Option pill / editable input */}
                                  <div className="flex items-center gap-1 rounded border border-white/[0.08] bg-[#1a1a1d] px-1.5 py-0.5 text-[10px]">
                                    <span className="text-zinc-500">Color:</span>
                                    <input
                                      type="text"
                                      value={item.colorSnapshot || ''}
                                      onChange={(e) => updateItemColor(idx, e.target.value)}
                                      placeholder="Color"
                                      className="w-14 bg-transparent text-[10px] font-medium text-amber-300 outline-none"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Qty & Price */}
                            <div className="flex shrink-0 items-center gap-4 pl-2">
                              {/* Quantity Stepper */}
                              <div className="flex items-center rounded border border-white/[0.1] bg-[#1a1a1d]">
                                <button
                                  type="button"
                                  onClick={() => updateQty(idx, item.qty - 1)}
                                  className="flex h-6 w-5 items-center justify-center text-xs text-zinc-400 hover:text-white"
                                >
                                  −
                                </button>
                                <span className="w-5 text-center font-mono text-xs font-semibold text-white">
                                  {item.qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQty(idx, item.qty + 1)}
                                  className="flex h-6 w-5 items-center justify-center text-xs text-zinc-400 hover:text-white"
                                >
                                  +
                                </button>
                              </div>

                              {/* Price */}
                              <div className="min-w-[60px] text-right">
                                <p className="font-mono text-xs font-bold text-white">
                                  ৳{(item.priceSnapshot * item.qty).toLocaleString()}
                                </p>
                              </div>

                              {/* Remove */}
                              <button
                                type="button"
                                onClick={() => removeItem(idx)}
                                className="p-0.5 text-zinc-500 transition-colors hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Method & Memo / Transaction No (2 columns) */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      PAYMENT METHOD
                    </label>
                    <select
                      value={form.paymentMethod}
                      onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                      className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2 text-xs text-white outline-none focus:border-zinc-500"
                    >
                      {PAYMENT_METHODS.map((pm) => (
                        <option key={pm.value} value={pm.value} className="bg-[#18181b] text-white">
                          {pm.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      MEMO / TRANSACTION NO
                    </label>
                    <input
                      type="text"
                      value={form.memo}
                      onChange={(e) => setForm((f) => ({ ...f, memo: e.target.value }))}
                      placeholder="e.g. 8D3F9 (bKash ref)"
                      className="w-full rounded-lg border border-white/[0.08] bg-[#18181b] px-3 py-2 font-mono text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                {/* Calculation Summary Box */}
                <div className="space-y-2.5 rounded-xl border border-white/[0.06] bg-[#17171a] p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Sub Total</span>
                    <span className="font-mono font-semibold text-white">
                      ৳{subtotal.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Delivery Charge</span>
                    <input
                      type="number"
                      value={form.deliveryCharge}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, deliveryCharge: Number(e.target.value) || 0 }))
                      }
                      className="w-24 rounded border border-white/[0.08] bg-[#141416] px-2 py-1 text-right font-mono text-xs text-white outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Coupon</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={form.couponCode}
                        onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value }))}
                        placeholder="CODE"
                        className="w-24 rounded border border-white/[0.08] bg-[#141416] px-2 py-1 text-center font-mono text-xs uppercase text-white placeholder-zinc-500 outline-none"
                      />
                      <button
                        type="button"
                        className="rounded border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-zinc-300 hover:bg-white/10 hover:text-white"
                      >
                        Apply
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Manual Discount (৳)</span>
                    <input
                      type="number"
                      value={form.manualDiscount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, manualDiscount: Number(e.target.value) || 0 }))
                      }
                      className="w-24 rounded border border-white/[0.08] bg-[#141416] px-2 py-1 text-right font-mono text-xs text-white outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">Paid Amount (৳)</span>
                    <input
                      type="number"
                      value={form.paidAmount}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, paidAmount: Number(e.target.value) || 0 }))
                      }
                      className="w-24 rounded border border-white/[0.08] bg-[#141416] px-2 py-1 text-right font-mono text-xs text-white outline-none focus:border-zinc-500"
                    />
                  </div>

                  {/* Big Total */}
                  <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
                    <span className="text-sm font-bold uppercase tracking-wider text-white">
                      Total
                    </span>
                    <span className="font-mono text-2xl font-black text-amber-400">
                      ৳{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Validation Info Notice */}
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.06] px-3.5 py-2 text-[11px] font-medium text-amber-400/90">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  <span>Name and Phone are required to save the order</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-4 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.06] bg-[#17171a] px-6 py-4">
              <div className="flex items-center gap-3">
                {editOrder && (
                  <button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    className="flex items-center gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 px-3.5 py-2 text-xs font-semibold text-purple-300 transition-all hover:border-purple-500/50 hover:bg-purple-500/20 active:scale-95"
                    title="View order activity history"
                  >
                    <History className="h-3.5 w-3.5 text-purple-400" />
                    <span>Order History</span>
                  </button>
                )}

                <div className="text-xs font-medium text-zinc-400">
                  <span>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                  <span className="mx-1.5 text-zinc-600">·</span>
                  <span>Total ৳{total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isSaving || items.length === 0 || !form.shippingName || !form.shippingPhone
                  }
                  className="flex items-center gap-2 rounded-lg bg-[#e4e4e7] px-5 py-2 text-xs font-bold text-zinc-900 shadow-md transition-all hover:bg-white hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  )}
                  {editOrder ? 'Save Changes' : 'Create Order'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* ORDER HISTORY SUB-MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowHistoryModal(false)}
          />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/[0.1] bg-[#141416] text-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <History className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Order Activity History</h3>
                  <p className="text-[11px] font-mono text-zinc-400">Invoice: {invoiceNo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Loader2 className="mb-2 h-6 w-6 animate-spin text-purple-400" />
                  <span className="text-xs">Loading activity logs...</span>
                </div>
              ) : historyLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                  <History className="mb-2 h-8 w-8 stroke-[1.5] text-zinc-600" />
                  <p className="text-xs font-semibold text-zinc-400">No activity recorded yet</p>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    Changes and actions will appear here in chronological order.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historyLogs.map((log, idx) => (
                    <div
                      key={log.id || idx}
                      className="flex gap-3 rounded-xl border border-white/[0.06] bg-[#18181c] p-3 text-xs"
                    >
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-500/10 font-mono text-[10px] font-bold text-purple-400">
                        {idx + 1}
                      </div>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              log.action === 'EDITED'
                                ? 'border-amber-500/30 bg-amber-500/15 text-amber-300'
                                : log.action === 'STATUS_CHANGED'
                                  ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
                                  : log.action === 'CREATED'
                                    ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
                                    : log.action === 'ASSIGNED'
                                      ? 'border-purple-500/30 bg-purple-500/15 text-purple-300'
                                      : 'border-white/10 bg-white/[0.06] text-zinc-300'
                            }`}
                          >
                            {log.action.replace('_', ' ')}
                          </span>
                          <span className="font-mono text-[10px] text-zinc-500">
                            {formatHistoryDate(log.createdAt)}
                          </span>
                        </div>
                        {log.adminName && (
                          <p className="text-[11px] text-zinc-400">
                            Action by:{' '}
                            <span className="font-semibold text-zinc-200">{log.adminName}</span>
                          </p>
                        )}
                        {(log.oldValue || log.newValue) && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-[11px]">
                            {log.oldValue && (
                              <span className="rounded bg-rose-500/10 px-2 py-0.5 font-medium text-rose-300 line-through decoration-rose-400/60">
                                {log.oldValue}
                              </span>
                            )}
                            {log.oldValue && log.newValue && (
                              <ArrowRight className="h-3 w-3 shrink-0 text-zinc-500" />
                            )}
                            {log.newValue && (
                              <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-300">
                                {log.newValue}
                              </span>
                            )}
                          </div>
                        )}
                        {log.note && (
                          <p className="text-[11px] text-zinc-300/80">
                            &ldquo;{log.note}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/[0.08] bg-[#18181b] px-5 py-3 text-right">
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
