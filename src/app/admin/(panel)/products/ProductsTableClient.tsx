'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Star,
  ExternalLink,
  Package,
  TrendingUp,
  AlertTriangle,
  ChevronDown,
  Filter,
  Box,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/money';
import { useToast } from '@/components/ui/Toast';

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  sku?: string | null;
  status: string;
  isTrending: boolean;
  trendingOrder: number;
  images: { url: string; alt?: string | null }[];
  variants: { id: string; size: string; color: string; colorHex?: string | null; stock: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  ACTIVE: { label: 'Active', dot: 'bg-emerald-400', badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' },
  DRAFT: { label: 'Draft', dot: 'bg-amber-400', badge: 'border-amber-500/30 bg-amber-500/10 text-amber-400' },
  ARCHIVED: { label: 'Archived', dot: 'bg-zinc-500', badge: 'border-zinc-600/40 bg-zinc-600/10 text-zinc-400' },
};

export function ProductsTableClient({
  initialProducts,
  initialSignatureProductId,
}: {
  initialProducts: ProductItem[];
  initialSignatureProductId?: string | null;
}) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [signatureProductId, setSignatureProductId] = useState<string | null>(
    initialSignatureProductId || null
  );
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isRemovingSignature, setIsRemovingSignature] = useState(false);
  const [isSettingSignature, setIsSettingSignature] = useState(false);
  const [selectedProductToSet, setSelectedProductToSet] = useState<string>('');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const currentSignatureProduct = products.find((p) => p.id === signatureProductId);

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const getStock = (p: ProductItem) => p.variants?.reduce((acc, v) => acc + v.stock, 0) ?? 0;

  const stats = {
    total: products.length,
    active: products.filter((p) => p.status === 'ACTIVE').length,
    trending: products.filter((p) => p.isTrending).length,
    lowStock: products.filter((p) => getStock(p) <= 5).length,
  };

  const handleToggleTrending = async (id: string, currentVal: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}/toggle-trending`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to toggle');
      setProducts((prev) => prev.map((item) => (item.id === id ? { ...item, isTrending: !currentVal } : item)));
      showToast(data.message, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error updating trending', 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to delete');
      setProducts((prev) => prev.filter((p) => p.id !== id));
      if (id === signatureProductId) {
        setSignatureProductId(null);
      }
      showToast(`"${name}" deleted.`, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error deleting product', 'danger');
    } finally {
      setDeletingId(null);
    }
  };

  const handleRemoveSignature = async () => {
    if (
      !window.confirm(
        'Are you sure you want to remove this product from the Signature section? Once removed, you can upload or set a new Signature product.'
      )
    ) {
      return;
    }

    setIsRemovingSignature(true);
    try {
      const res = await fetch('/api/admin/featured', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to remove signature product');
      }

      setSignatureProductId(null);
      showToast('Signature product removed! You can now add or upload a new signature product.', 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error removing signature product', 'danger');
    } finally {
      setIsRemovingSignature(false);
    }
  };

  const handleSetExistingSignature = async (prodId: string) => {
    if (!prodId) {
      showToast('Please select a product first', 'danger');
      return;
    }

    setIsSettingSignature(true);
    try {
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: prodId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to set signature product');
      }

      setSignatureProductId(prodId);
      showToast(data.message || 'Product set as Signature Product!', 'success');
      setShowSignatureModal(false);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error setting signature product', 'danger');
    } finally {
      setIsSettingSignature(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total Products', value: stats.total, icon: Box, color: 'text-zinc-300', bg: 'border-white/[0.06] bg-[#141416]' },
          { label: 'Active', value: stats.active, icon: Package, color: 'text-emerald-400', bg: 'border-emerald-500/20 bg-emerald-500/5' },
          { label: 'Trending', value: stats.trending, icon: TrendingUp, color: 'text-amber-400', bg: 'border-amber-500/20 bg-amber-500/5' },
          { label: 'Low Stock', value: stats.lowStock, icon: AlertTriangle, color: 'text-rose-400', bg: 'border-rose-500/20 bg-rose-500/5' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</span>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <div className={`mt-2 font-mono text-2xl font-black ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search & Status Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-64 sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-[#141416] py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500"
            />
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowStatusMenu((p) => !p)}
              className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-[#141416] px-3 py-2 text-xs font-semibold text-zinc-300 transition-all hover:border-white/20 hover:text-white"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>{statusFilter === 'ALL' ? 'All Status' : statusFilter}</span>
              <ChevronDown className={`h-3 w-3 transition-transform ${showStatusMenu ? 'rotate-180' : ''}`} />
            </button>
            {showStatusMenu && (
              <div className="absolute left-0 top-full z-50 mt-1.5 w-40 overflow-hidden rounded-xl border border-white/[0.12] bg-[#18181b] py-1 shadow-2xl">
                {['ALL', 'ACTIVE', 'DRAFT', 'ARCHIVED'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setStatusFilter(s); setShowStatusMenu(false); }}
                    className={`flex w-full items-center px-3 py-2 text-xs transition-colors hover:bg-white/[0.06] ${statusFilter === s ? 'font-bold text-white' : 'text-zinc-400'}`}
                  >
                    {s === 'ALL' ? 'All Status' : s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Signature Product Button (IN MARKED RED SPOT) + Regular Add Product Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* ═══ SIGNATURE PRODUCT BUTTON (MARKED SPOT) ═══ */}
          {currentSignatureProduct ? (
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="group flex items-center gap-2 rounded-lg border border-[#D4AF37]/50 bg-gradient-to-r from-[#2A0E14] via-[#4A0E17] to-[#2A0E14] px-4 py-2 text-xs font-bold text-white shadow-[0_0_20px_rgba(212,175,55,0.25)] transition-all hover:border-[#D4AF37] hover:brightness-110 active:scale-95"
              title="Click to manage Signature Product"
            >
              <Sparkles className="h-4 w-4 text-[#D4AF37] animate-pulse" />
              <span className="hidden sm:inline">Signature Product:</span>
              <span className="text-[#f6d884]">
                {currentSignatureProduct.name.length > 18
                  ? `${currentSignatureProduct.name.slice(0, 18)}...`
                  : currentSignatureProduct.name}
              </span>
              <span className="rounded-full bg-[#D4AF37] px-1.5 py-0.5 font-mono text-[9px] font-black text-black">
                1/1 Active
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowSignatureModal(true)}
              className="flex items-center gap-2 rounded-lg border border-[#D4AF37]/40 bg-[#1e1518] px-4 py-2 text-xs font-bold text-[#f2dfb1] shadow-sm transition-all hover:border-[#D4AF37] hover:bg-[#2b1b20] hover:text-white active:scale-95"
              title="Add or Upload Signature Product"
            >
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <span>+ Add Signature Product</span>
              <span className="rounded-full bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400">
                0/1
              </span>
            </button>
          )}

          {/* ═══ STANDARD ADD PRODUCT BUTTON ═══ */}
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 rounded-lg bg-[#e4e4e7] px-4 py-2 text-xs font-bold text-zinc-900 shadow-md transition-all hover:bg-white hover:shadow-lg"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            Add Product
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[#141416] shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.06] bg-[#17171a] text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                <th className="px-4 py-3.5">Product</th>
                <th className="px-4 py-3.5">SKU</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">Stock</th>
                <th className="px-4 py-3.5">Trending</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Package className="mb-2 h-9 w-9 text-zinc-700" />
                      <p className="text-xs font-medium text-zinc-400">No products found</p>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {search ? 'Try adjusting your search' : 'Add your first product'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((product) => {
                  const stock = getStock(product);
                  const isToggling = togglingId === product.id;
                  const isDeleting = deletingId === product.id;
                  const statusConf = STATUS_CONFIG[product.status] || STATUS_CONFIG.DRAFT;
                  const uniqueColors = [...new Set(product.variants.map((v) => v.color))];
                  const isSignatureItem = product.id === signatureProductId;

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        isSignatureItem
                          ? 'bg-[#4A0E17]/10 hover:bg-[#4A0E17]/20'
                          : 'hover:bg-white/[0.02]'
                      }`}
                    >
                      {/* Product */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`relative h-12 w-10 shrink-0 overflow-hidden rounded-lg border ${
                              isSignatureItem
                                ? 'border-[#D4AF37]/50 shadow-[0_0_10px_rgba(212,175,55,0.3)]'
                                : 'border-white/[0.08]'
                            } bg-zinc-800`}
                          >
                            {product.images[0]?.url ? (
                              <Image src={product.images[0].url} alt={product.name} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-4 w-4 text-zinc-600" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 max-w-[240px]">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-xs font-bold text-white">{product.name}</p>
                              {isSignatureItem && (
                                <span className="inline-flex items-center gap-1 rounded bg-[#D4AF37]/20 px-2 py-0.5 font-mono text-[9px] font-black uppercase tracking-wider text-[#f6d884] ring-1 ring-[#D4AF37]/50 shadow-[0_0_8px_rgba(212,175,55,0.3)]">
                                  <Sparkles className="h-2.5 w-2.5 text-[#D4AF37]" />
                                  Signature
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                              {uniqueColors.slice(0, 5).map((c, i) => {
                                const v = product.variants.find((vv) => vv.color === c);
                                return (
                                  <span
                                    key={i}
                                    title={c}
                                    className="h-2.5 w-2.5 shrink-0 rounded-full border border-white/20"
                                    style={{ backgroundColor: v?.colorHex || '#888' }}
                                  />
                                );
                              })}
                              {uniqueColors.length > 5 && (
                                <span className="text-[10px] text-zinc-500">+{uniqueColors.length - 5}</span>
                              )}
                            </div>
                            <Link
                              href={`/product/${product.slug}`}
                              target="_blank"
                              className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300"
                            >
                              <span>view on store</span>
                              <ExternalLink className="h-2.5 w-2.5" />
                            </Link>
                          </div>
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-[11px] text-zinc-400">{product.sku || '—'}</span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-xs font-bold text-white">{formatPrice(product.price)}</div>
                        {product.comparePrice && (
                          <div className="mt-0.5 font-mono text-[10px] text-zinc-500 line-through">
                            {formatPrice(product.comparePrice)}
                          </div>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3.5">
                        <span className={`font-mono text-xs font-semibold ${stock === 0 ? 'text-rose-400' : stock <= 5 ? 'text-amber-400' : 'text-zinc-200'}`}>
                          {stock}
                        </span>
                        <div className="mt-0.5 text-[10px] text-zinc-500">
                          in {product.variants?.length ?? 0} variant(s)
                        </div>
                      </td>

                      {/* Trending */}
                      <td className="px-4 py-3.5">
                        <button
                          onClick={() => handleToggleTrending(product.id, product.isTrending)}
                          disabled={isToggling}
                          className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all disabled:opacity-60 ${product.isTrending ? 'border-amber-500/30 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25' : 'border-white/[0.06] bg-white/[0.02] text-zinc-500 hover:border-white/[0.12] hover:text-zinc-300'}`}
                        >
                          <Star className={`h-3 w-3 ${product.isTrending ? 'fill-amber-400' : ''}`} />
                          {product.isTrending ? 'Trending' : 'No'}
                        </button>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${statusConf.badge}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isSignatureItem && (
                            <button
                              type="button"
                              onClick={() => setShowSignatureModal(true)}
                              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#D4AF37]/50 bg-[#D4AF37]/15 text-[#D4AF37] transition-all hover:brightness-125"
                              title="Signature Product Details"
                            >
                              <Sparkles className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:border-zinc-400 hover:text-white"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name)}
                            disabled={isDeleting}
                            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.03] text-zinc-400 transition-colors hover:border-rose-500/50 hover:text-rose-400 disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-white/[0.06] bg-[#17171a] px-4 py-3">
          <p className="text-xs text-zinc-400">Showing {filtered.length} of {products.length} products</p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SIGNATURE PRODUCT MANAGEMENT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.12] bg-[#141416] p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#D4AF37]/50 bg-white p-1 shadow-md shadow-black/40">
                  <Image
                    src="/images/logo.png"
                    alt="Gents Hood Logo"
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                    Homepage Signature Product
                  </h3>
                  <p className="text-[11px] text-zinc-400">
                    ওয়েবসাইটের হোমপেইজের &quot;ICONIC MASTERPIECE&quot; সেকশনের মূল প্রডাক্ট
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSignatureModal(false)}
                className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content: STATE 1 (Signature Product Exists) */}
            {currentSignatureProduct ? (
              <div className="mt-5 space-y-5">
                {/* Active Product Card */}
                <div className="relative overflow-hidden rounded-xl border border-[#D4AF37]/40 bg-gradient-to-br from-[#2A0E14]/70 via-[#1a1a1d] to-[#0E0E10] p-4 shadow-lg">
                  <div className="flex items-start gap-4">
                    <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-[#D4AF37]/50 bg-black">
                      {currentSignatureProduct.images[0]?.url ? (
                        <Image
                          src={currentSignatureProduct.images[0].url}
                          alt={currentSignatureProduct.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[#D4AF37] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black">
                          Active (1/1)
                        </span>
                        <span className="font-mono text-[10px] text-zinc-400">
                          {currentSignatureProduct.sku || 'NO SKU'}
                        </span>
                      </div>
                      <h4 className="mt-1 text-sm font-bold text-white">{currentSignatureProduct.name}</h4>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-mono text-sm font-black text-white">
                          {formatPrice(currentSignatureProduct.price)}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          • {getStock(currentSignatureProduct)} in stock ({currentSignatureProduct.variants.length} variants)
                        </span>
                      </div>
                      <div className="mt-2">
                        <Link
                          href="/#new-vibes"
                          target="_blank"
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[#f6d884] hover:underline"
                        >
                          <span>View Live on Homepage</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Important Strict Rule Notice (As Requested) */}
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-amber-300">
                  <div className="flex gap-2.5">
                    <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" />
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold">গুরুত্বপূর্ণ নিয়ম (Strict 1-Product Limit):</p>
                      <p className="mt-0.5 text-[11px] text-amber-300/90">
                        Signature section-এ সর্বোচ্চ <strong>১টি মাত্র প্রডাক্ট</strong> রাখা সম্ভব। আপনি যদি নতুন কোনো প্রডাক্ট আপলোড করতে চান বা অন্য কোনো প্রডাক্টকে Signature বানাতে চান, তবে বর্তমান সিগনেচার প্রডাক্টটি আগে এখান থেকে <strong>Remove / Delete</strong> করতে হবে।
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.08] pt-4">
                  <button
                    type="button"
                    disabled={isRemovingSignature}
                    onClick={handleRemoveSignature}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/50 bg-red-500/15 px-4 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500/25 active:scale-95 disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>{isRemovingSignature ? 'Removing...' : 'Remove / Delete from Signature'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/products/${currentSignatureProduct.id}/edit`}
                      className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      Edit Product
                    </Link>
                    <button
                      type="button"
                      onClick={() => setShowSignatureModal(false)}
                      className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Content: STATE 2 (No Signature Product Exists - Ready to Add) */
              <div className="mt-5 space-y-5">
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-emerald-300">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>স্লট খালি রয়েছে (0/1 Active)</span>
                  </div>
                  <p className="mt-1 text-[11px] text-emerald-300/80">
                    বর্তমানে কোনো প্রডাক্ট Signature Section-এ নেই। আপনি সরাসরি নতুন প্রডাক্ট আপলোড করতে পারেন অথবা বর্তমান ক্যাটালগ থেকে যেকোনো প্রডাক্টকে সিলেক্ট করতে পারেন।
                  </p>
                </div>

                {/* Option 1: Upload Brand New Signature Product */}
                <div className="rounded-xl border border-white/[0.08] bg-[#0E0E10] p-4 transition-all hover:border-[#D4AF37]/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-[9px] font-black uppercase text-[#D4AF37]">Option 1</span>
                      <h4 className="text-xs font-bold text-white">Upload New Signature Product</h4>
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        সরাসরি সম্পূর্ণ নতুন প্রডাক্ট (ছবি, কালার, সাইজ সহ) তৈরি করে সিগনেচার করুন।
                      </p>
                    </div>
                    <Link
                      href="/admin/products/new?signature=true"
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#800020] to-[#5C0612] px-3.5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 active:scale-95"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Upload New</span>
                    </Link>
                  </div>
                </div>

                {/* Option 2: Pick from Existing Products */}
                <div className="rounded-xl border border-white/[0.08] bg-[#0E0E10] p-4">
                  <span className="font-mono text-[9px] font-black uppercase text-zinc-400">Option 2</span>
                  <h4 className="text-xs font-bold text-white">Select from Existing Catalog</h4>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    বিদ্যমান যেকোনো অ্যাক্টিভ প্রডাক্টকে সিগনেচার প্রডাক্ট হিসেবে নির্ধারণ করুন:
                  </p>

                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <select
                      value={selectedProductToSet}
                      onChange={(e) => setSelectedProductToSet(e.target.value)}
                      className="flex-1 rounded-lg border border-white/10 bg-[#141416] px-3 py-2 text-xs text-white focus:border-[#D4AF37] focus:outline-none"
                    >
                      <option value="">-- Choose a Product --</option>
                      {products
                        .filter((p) => p.status === 'ACTIVE')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({formatPrice(p.price)})
                          </option>
                        ))}
                    </select>

                    <button
                      type="button"
                      disabled={!selectedProductToSet || isSettingSignature}
                      onClick={() => handleSetExistingSignature(selectedProductToSet)}
                      className="rounded-lg bg-[#D4AF37] px-4 py-2 text-xs font-bold text-black transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
                    >
                      {isSettingSignature ? 'Setting...' : 'Set as Signature'}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end border-t border-white/[0.08] pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSignatureModal(false)}
                    className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
