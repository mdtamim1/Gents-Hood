'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Plus, Edit2, Trash2, Star, ExternalLink } from 'lucide-react';
import { formatPrice } from '@/lib/utils/money';
import { Badge } from '@/components/ui/Badge';
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
  variants: { id: string; size: string; color: string; stock: number }[];
}

export function ProductsTableClient({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = useState<ProductItem[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const { showToast } = useToast();

  const filtered = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      p.slug.toLowerCase().includes(search.toLowerCase());

    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleToggleTrending = async (id: string, currentVal: boolean) => {
    setTogglingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}/toggle-trending`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to toggle');
      }

      setProducts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isTrending: !currentVal } : item))
      );
      showToast(data.message, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error updating trending';
      showToast(msg, 'danger');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete');
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      showToast(`Product "${name}" deleted.`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting product';
      showToast(msg, 'danger');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Filter and Search Bar */}
      <div className="border-muted/20 flex flex-col justify-between gap-4 border-b pb-4 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search product or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-muted/30 placeholder:text-muted/50 w-full rounded-[1px] border bg-ink px-4 py-2 pl-9 text-xs text-cream focus:border-cream focus:outline-none"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border-muted/30 rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>

        <Link
          href="/admin/products/new"
          className="flex items-center justify-center gap-2 rounded-[1px] bg-cream px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink transition-opacity hover:opacity-90"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Products Table */}
      <div className="border-muted/20 overflow-x-auto border bg-[#1a1a1c]">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-muted/20 bg-muted/5 border-b text-[10px] uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-semibold">Product</th>
              <th className="px-4 py-3 font-semibold">SKU</th>
              <th className="px-4 py-3 font-semibold">Price</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="px-4 py-3 font-semibold">Trending</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-muted/10 divide-y">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-muted">
                  No products found matching criteria.
                </td>
              </tr>
            ) : (
              filtered.map((product) => {
                const totalStock = product.variants.reduce((acc, v) => acc + v.stock, 0);
                const isToggling = togglingId === product.id;
                const isDeleting = deletingId === product.id;

                return (
                  <tr key={product.id} className="hover:bg-muted/5 transition-colors">
                    {/* Image & Name */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="border-muted/20 bg-muted/10 relative h-12 w-10 shrink-0 overflow-hidden rounded-[1px] border">
                          {product.images[0]?.url ? (
                            <Image
                              src={product.images[0].url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[8px] text-muted">
                              No Img
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="truncate font-semibold text-cream">{product.name}</p>
                          <Link
                            href={`/product/${product.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-[10px] text-muted hover:text-cream"
                          >
                            <span>view on store</span>
                            <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="px-4 py-3 font-mono text-muted">{product.sku || '—'}</td>

                    {/* Price */}
                    <td className="px-4 py-3">
                      <span className="font-bold text-cream">{formatPrice(product.price)}</span>
                      {product.comparePrice && (
                        <span className="ml-1 text-[10px] text-muted line-through">
                          {formatPrice(product.comparePrice)}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="px-4 py-3">
                      <span
                        className={`font-semibold ${
                          totalStock === 0
                            ? 'text-danger'
                            : totalStock <= 5
                              ? 'text-amber-400'
                              : 'text-cream'
                        }`}
                      >
                        {totalStock} in {product.variants.length} size(s)
                      </span>
                    </td>

                    {/* Trending Toggle */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleTrending(product.id, product.isTrending)}
                        disabled={isToggling}
                        className={`flex items-center gap-1.5 rounded-[1px] px-2.5 py-1 text-[11px] font-semibold tracking-wider transition-colors ${
                          product.isTrending
                            ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                            : 'bg-muted/10 hover:bg-muted/20 text-muted hover:text-cream'
                        }`}
                      >
                        <Star className={`h-3 w-3 ${product.isTrending ? 'fill-amber-300' : ''}`} />
                        {product.isTrending ? 'Trending' : 'No'}
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <Badge
                        variant={product.status === 'ACTIVE' ? 'success' : 'default'}
                        size="sm"
                      >
                        {product.status}
                      </Badge>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="hover:bg-muted/20 rounded p-1.5 text-muted hover:text-cream"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          disabled={isDeleting}
                          className="hover:bg-danger/20 rounded p-1.5 text-muted hover:text-danger disabled:opacity-50"
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
    </div>
  );
}
