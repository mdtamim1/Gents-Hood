'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
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
} from 'lucide-react';
import { BD_DISTRICTS, getUpazilas } from '@/lib/constants/bd-locations';

interface ProductVariant {
  id: string;
  size: string;
  color: string;
  stock: number;
  priceOverride?: number | null;
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

  const addProduct = (product: Product, variant?: ProductVariant) => {
    const size = variant?.size || 'Standard';
    const color = variant?.color || 'Default';
    const price = variant?.priceOverride ?? product.price;

    const existingIdx = items.findIndex(
      (i) =>
        i.productId === product.id &&
        i.variantId === variant?.id &&
        i.sizeSnapshot === size &&
        i.colorSnapshot === color
    );

    if (existingIdx >= 0) {
      const updated = [...items];
      updated[existingIdx].qty += 1;
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          variantId: variant?.id,
          nameSnapshot: product.name,
          sizeSnapshot: size,
          colorSnapshot: color,
          priceSnapshot: price,
          qty: 1,
          imageSnapshot: product.images?.[0]?.url,
        },
      ]);
    }
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
          items: editOrder ? undefined : items,
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
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search product name..."
                      className="w-full rounded-lg border border-white/[0.08] bg-[#141416] py-2 pl-9 pr-8 text-xs text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-zinc-400" />
                    )}
                  </div>

                  {/* Dropdown Results with Variants (Size & Color) */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#131315] shadow-lg">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="border-b border-white/[0.04] p-2.5 last:border-0 hover:bg-white/[0.02]"
                        >
                          <div className="flex items-center gap-2.5">
                            {product.images?.[0] ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="h-9 w-9 rounded-md border border-white/10 object-cover"
                              />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-800 text-[9px] text-zinc-500">
                                No Img
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-xs font-semibold text-white">
                                {product.name}
                              </p>
                              <p className="text-[11px] font-medium text-amber-400">
                                ৳{product.price}
                              </p>
                            </div>
                          </div>

                          {/* Variants selection with Color and Size */}
                          <div className="mt-2 flex flex-wrap gap-1">
                            {product.variants && product.variants.length > 0 ? (
                              product.variants.map((v) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => addProduct(product, v)}
                                  disabled={v.stock === 0}
                                  className="flex items-center gap-1 rounded border border-white/[0.1] bg-[#1a1a1e] px-2 py-1 text-[10px] text-zinc-300 transition-colors hover:border-zinc-400 hover:text-white disabled:opacity-30"
                                >
                                  <span>{v.size}</span>
                                  {v.color && (
                                    <span className="text-[9px] text-zinc-400">({v.color})</span>
                                  )}
                                  <span className="font-mono text-[9px] text-zinc-500">
                                    [{v.stock}]
                                  </span>
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => addProduct(product)}
                                className="rounded border border-white/[0.1] bg-[#1a1a1e] px-2.5 py-1 text-[10px] font-medium text-zinc-300 hover:border-zinc-400 hover:text-white"
                              >
                                + Add Default
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
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
              <div className="text-xs font-medium text-zinc-400">
                <span>
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </span>
                <span className="mx-1.5 text-zinc-600">·</span>
                <span>Total ৳{total.toLocaleString()}</span>
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
    </div>
  );
}
