'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search, Loader2 } from 'lucide-react';
import { BD_DISTRICTS, getUpazilas } from '@/lib/constants/bd-locations';

interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
  variants: { id: string; size: string; color: string; stock: number }[];
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

const COURIERS = ['Steadfast', 'Pathao', 'Redx', 'Paperfly', 'Sundarban', 'Other'];

interface OrderFormModalProps {
  onClose: () => void;
  onSuccess: () => void;
  editOrder?: Record<string, unknown> | null;
}

export function OrderFormModal({ onClose, onSuccess, editOrder }: OrderFormModalProps) {
  const [form, setForm] = useState({
    shippingName: (editOrder?.shippingName as string) || '',
    shippingPhone: (editOrder?.shippingPhone as string) || '',
    email: '',
    shippingDistrict: (editOrder?.shippingDistrict as string) || 'Dhaka',
    shippingThana: (editOrder?.shippingThana as string) || '',
    shippingArea: (editOrder?.shippingArea as string) || '',
    shippingAddress: (editOrder?.shippingAddress as string) || '',
    paymentMethod: (editOrder?.paymentMethod as string) || 'COD',
    paymentStatus: (editOrder?.paymentStatus as string) || 'UNPAID',
    courierName: (editOrder?.courierName as string) || '',
    status: (editOrder?.status as string) || 'PROCESSING',
    note: (editOrder?.note as string) || '',
    shopNote: (editOrder?.shopNote as string) || '',
    deliveryCharge: (editOrder?.deliveryCharge as number) || 120,
    manualDiscount: (editOrder?.manualDiscount as number) || 0,
    paidAmount: (editOrder?.paidAmount as number) || 0,
  });

  const [items, setItems] = useState<OrderItem[]>(
    editOrder?.items
      ? (
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
          sizeSnapshot: i.sizeSnapshot,
          colorSnapshot: i.colorSnapshot,
          priceSnapshot: i.priceSnapshot,
          qty: i.qty,
          imageSnapshot: i.imageSnapshot,
        }))
      : []
  );

  const [productSearch, setProductSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const shopNoteTags = [
    'Urgent delivery',
    'Handle with care',
    'Gift wrap please',
    'Call before delivery',
    'Leave at door',
  ];

  // Search products
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
        if (data.success) setSearchResults(data.products?.slice(0, 6) || []);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  const addProduct = (
    product: Product,
    variant?: { id: string; size: string; color: string; stock: number }
  ) => {
    const existing = items.findIndex(
      (i) => i.productId === product.id && i.variantId === variant?.id
    );
    if (existing >= 0) {
      const updated = [...items];
      updated[existing].qty += 1;
      setItems(updated);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          variantId: variant?.id,
          nameSnapshot: product.name,
          sizeSnapshot: variant?.size,
          colorSnapshot: variant?.color,
          priceSnapshot: product.price,
          qty: 1,
          imageSnapshot: product.images?.[0]?.url,
        },
      ]);
    }
    setProductSearch('');
    setSearchResults([]);
  };

  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateQty = (idx: number, qty: number) => {
    if (qty < 1) return;
    const updated = [...items];
    updated[idx].qty = qty;
    setItems(updated);
  };

  const subtotal = items.reduce((s, i) => s + i.priceSnapshot * i.qty, 0);
  const total = Math.max(0, subtotal + form.deliveryCharge - form.manualDiscount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shippingName || !form.shippingPhone) {
      setError('Name and phone are required');
      return;
    }
    if (items.length === 0) {
      setError('Add at least one product');
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
          ...form,
          subtotal,
          total,
          items: editOrder ? undefined : items,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onSuccess();
      } else {
        setError(data.error || 'Failed to save order');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-5xl flex-col rounded-2xl border border-white/[0.08] bg-[#111113] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <div>
            <h2 className="text-[15px] font-bold text-white">
              {editOrder ? 'Edit Order' : 'Create New Order'}
            </h2>
            <p className="text-[12px] text-white/35">
              {editOrder
                ? `Editing ${editOrder.orderNo}`
                : 'Fill in the details to create a manual order'}
            </p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/70">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 p-6 lg:grid-cols-2">
              {/* Left: Customer + Shipping */}
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    Customer Information
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/50">
                        Customer Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={form.shippingName}
                        onChange={(e) => setForm((f) => ({ ...f, shippingName: e.target.value }))}
                        placeholder="Full Name"
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-white/50">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={form.shippingPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                            setForm((f) => ({ ...f, shippingPhone: val }));
                          }}
                          placeholder="01XXXXXXXXX"
                          maxLength={11}
                          className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-white/50">
                          Email
                        </label>
                        <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                          placeholder="customer@email.com"
                          className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    Delivery Address
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-white/50">
                          District
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
                          className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none focus:border-indigo-500/50"
                        >
                          <option value="">Select District</option>
                          {BD_DISTRICTS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] font-medium text-white/50">
                          Thana / Upazila
                        </label>
                        <select
                          value={form.shippingThana}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, shippingThana: e.target.value }))
                          }
                          disabled={!form.shippingDistrict}
                          className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none focus:border-indigo-500/50 disabled:opacity-40"
                        >
                          <option value="">
                            {form.shippingDistrict ? 'Select Thana' : 'Select district first'}
                          </option>
                          {getUpazilas(form.shippingDistrict).map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/50">
                        Area / Road / House
                      </label>
                      <input
                        type="text"
                        value={form.shippingAddress}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, shippingAddress: e.target.value }))
                        }
                        placeholder="House No, Road, Area..."
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Order Settings */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    Order Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/50">
                        Courier
                      </label>
                      <select
                        value={form.courierName}
                        onChange={(e) => setForm((f) => ({ ...f, courierName: e.target.value }))}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none"
                      >
                        <option value="">Select Courier</option>
                        {COURIERS.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/50">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none"
                      >
                        {['PROCESSING', 'PENDING', 'SHIPPED', 'COMPLETED', 'CANCELLED'].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/50">
                        Payment
                      </label>
                      <select
                        value={form.paymentMethod}
                        onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none"
                      >
                        <option value="COD">Cash on Delivery</option>
                        <option value="BKASH">bKash</option>
                        <option value="NAGAD">Nagad</option>
                        <option value="ROCKET">Rocket</option>
                        <option value="BANK">Bank Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/50">
                        Payment Status
                      </label>
                      <select
                        value={form.paymentStatus}
                        onChange={(e) => setForm((f) => ({ ...f, paymentStatus: e.target.value }))}
                        className="w-full rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2.5 text-[13px] text-white outline-none"
                      >
                        <option value="UNPAID">Unpaid</option>
                        <option value="PAID">Paid</option>
                        <option value="PARTIAL">Partial</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    Notes
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-[11px] font-medium text-white/50">
                        Customer Note
                      </label>
                      <textarea
                        value={form.note}
                        onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                        placeholder="Note for customer..."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium text-white/50">
                        Shop Note (Quick Tags)
                      </label>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {shopNoteTags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => {
                              const sep = form.shopNote ? ', ' : '';
                              setForm((f) => ({ ...f, shopNote: f.shopNote + sep + tag }));
                            }}
                            className="rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/50 transition-colors hover:bg-white/[0.08] hover:text-white/80"
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={form.shopNote}
                        onChange={(e) => setForm((f) => ({ ...f, shopNote: e.target.value }))}
                        placeholder="Internal note..."
                        rows={2}
                        className="w-full resize-none rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Products + Pricing */}
              <div className="space-y-4">
                {/* Product Search */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    Add Products
                  </h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Search product name..."
                      className="w-full rounded-lg border border-white/[0.08] bg-[#141416] py-2.5 pl-9 pr-4 text-[13px] text-white placeholder-white/25 outline-none focus:border-indigo-500/50"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/30" />
                    )}
                  </div>

                  {searchResults.length > 0 && (
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-white/[0.08] bg-[#141416]">
                      {searchResults.map((product) => (
                        <div
                          key={product.id}
                          className="border-b border-white/[0.04] last:border-0"
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            {product.images?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={product.images[0].url}
                                alt={product.name}
                                className="h-8 w-8 rounded object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <p className="text-[12px] font-medium text-white">{product.name}</p>
                              <p className="text-[11px] text-white/40">৳{product.price}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1 px-3 pb-2">
                            {product.variants.length > 0 ? (
                              product.variants.map((v) => (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => addProduct(product, v)}
                                  disabled={v.stock === 0}
                                  className="rounded border border-white/[0.1] px-2 py-0.5 text-[10px] text-white/60 hover:bg-white/[0.08] hover:text-white disabled:opacity-30"
                                >
                                  {v.size}/{v.color} ({v.stock})
                                </button>
                              ))
                            ) : (
                              <button
                                type="button"
                                onClick={() => addProduct(product)}
                                className="rounded border border-white/[0.1] px-2 py-0.5 text-[10px] text-white/60 hover:bg-white/[0.08]"
                              >
                                + Add
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Items list */}
                  <div className="mt-3 space-y-2">
                    {items.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed border-white/[0.06] py-6 text-center text-[12px] text-white/25">
                        No products added yet. Search above to add.
                      </div>
                    ) : (
                      items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-medium text-white/90">
                              {item.nameSnapshot}
                            </p>
                            <p className="text-[11px] text-white/35">
                              {[item.sizeSnapshot, item.colorSnapshot].filter(Boolean).join(' · ')}{' '}
                              · ৳{item.priceSnapshot}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateQty(idx, item.qty - 1)}
                              className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:bg-white/[0.08] hover:text-white"
                            >
                              −
                            </button>
                            <span className="w-6 text-center text-[13px] font-semibold text-white">
                              {item.qty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQty(idx, item.qty + 1)}
                              className="flex h-6 w-6 items-center justify-center rounded text-white/50 hover:bg-white/[0.08] hover:text-white"
                            >
                              +
                            </button>
                          </div>
                          <span className="min-w-[60px] text-right text-[12px] font-semibold text-white">
                            ৳{(item.priceSnapshot * item.qty).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-white/25 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="rounded-xl border border-white/[0.06] bg-[#0f0f11] p-4">
                  <h3 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-white/40">
                    Pricing
                  </h3>
                  <div className="space-y-2.5">
                    <div className="flex justify-between text-[13px]">
                      <span className="text-white/50">Sub Total</span>
                      <span className="text-white">৳{subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/50">Delivery Charge</span>
                      <input
                        type="number"
                        value={form.deliveryCharge}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, deliveryCharge: Number(e.target.value) || 0 }))
                        }
                        className="w-24 rounded-lg border border-white/[0.08] bg-[#141416] px-2 py-1 text-right text-[13px] text-white outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/50">Manual Discount</span>
                      <input
                        type="number"
                        value={form.manualDiscount}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, manualDiscount: Number(e.target.value) || 0 }))
                        }
                        className="w-24 rounded-lg border border-white/[0.08] bg-[#141416] px-2 py-1 text-right text-[13px] text-white outline-none"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-white/50">Paid Amount</span>
                      <input
                        type="number"
                        value={form.paidAmount}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, paidAmount: Number(e.target.value) || 0 }))
                        }
                        className="w-24 rounded-lg border border-white/[0.08] bg-[#141416] px-2 py-1 text-right text-[13px] text-white outline-none"
                      />
                    </div>
                    <div className="border-t border-white/[0.08] pt-2.5">
                      <div className="flex justify-between">
                        <span className="text-[15px] font-bold text-white">Total</span>
                        <span className="text-[15px] font-bold text-indigo-400">
                          ৳{total.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div className="mx-6 mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-[13px] text-red-400">
                {error}
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[13px] font-medium text-white/50 hover:text-white/80"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSaving || items.length === 0 || !form.shippingName || !form.shippingPhone
                }
                className="flex items-center gap-2 rounded-lg bg-indigo-500 px-6 py-2.5 text-[13px] font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-400 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {editOrder ? 'Save Changes' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
