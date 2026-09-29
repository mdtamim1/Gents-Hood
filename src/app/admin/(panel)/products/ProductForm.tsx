'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export interface VariantInput {
  id?: string;
  size: string;
  color: string;
  colorHex?: string | null;
  stock: number;
  sku?: string | null;
}

interface ProductFormData {
  name: string;
  price: number;
  comparePrice?: number | null;
  sku: string;
  shortDescription: string;
  description: string;
  fabric: string;
  fit: string;
  care: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  isTrending: boolean;
  imageUrl: string;
  imageAlt: string;
  variants: VariantInput[];
}

interface ProductFormProps {
  initialData?: {
    id: string;
    name: string;
    price: number;
    comparePrice?: number | null;
    sku?: string | null;
    shortDescription?: string | null;
    description?: string | null;
    fabric?: string | null;
    fit?: string | null;
    care?: string | null;
    status: string;
    isTrending: boolean;
    images: { url: string; alt?: string | null }[];
    variants: VariantInput[];
  };
  isEdit?: boolean;
}

export function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: initialData?.name || '',
    price: initialData?.price || 2500,
    comparePrice: initialData?.comparePrice || null,
    sku: initialData?.sku || '',
    shortDescription: initialData?.shortDescription || '',
    description: initialData?.description || '',
    fabric: initialData?.fabric || '100% High-Density Milled Cotton',
    fit: initialData?.fit || 'Structured Tailored Fit',
    care: initialData?.care || 'Dry clean or cold machine wash.',
    status: (initialData?.status as 'ACTIVE' | 'DRAFT' | 'ARCHIVED') || 'ACTIVE',
    isTrending: initialData?.isTrending ?? true,
    imageUrl: initialData?.images[0]?.url || '/images/gallery-front.jpg',
    imageAlt: initialData?.images[0]?.alt || '',
    variants:
      initialData?.variants && initialData.variants.length > 0
        ? initialData.variants
        : [
            { size: 'M', color: 'Charcoal Black', colorHex: '#171718', stock: 15 },
            { size: 'L', color: 'Charcoal Black', colorHex: '#171718', stock: 12 },
            { size: 'XL', color: 'Charcoal Black', colorHex: '#171718', stock: 8 },
          ],
  });

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        { size: 'L', color: 'Charcoal Black', colorHex: '#171718', stock: 10 },
      ],
    }));
  };

  const handleRemoveVariant = (index: number) => {
    if (formData.variants.length <= 1) {
      showToast('Product must have at least one variant', 'danger');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleVariantChange = (
    index: number,
    field: keyof VariantInput,
    value: string | number
  ) => {
    setFormData((prev) => {
      const nextVariants = [...prev.variants];
      nextVariants[index] = { ...nextVariants[index], [field]: value };
      return { ...prev, variants: nextVariants };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Product name is required', 'danger');
      return;
    }

    if (formData.price <= 0) {
      showToast('Price must be greater than 0', 'danger');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        comparePrice: formData.comparePrice ? Number(formData.comparePrice) : null,
        sku: formData.sku || undefined,
        shortDescription: formData.shortDescription,
        description: formData.description,
        fabric: formData.fabric,
        fit: formData.fit,
        care: formData.care,
        status: formData.status,
        isTrending: formData.isTrending,
        images: [{ url: formData.imageUrl, alt: formData.imageAlt || formData.name }],
        variants: formData.variants.map((v) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || '#171718',
          stock: Number(v.stock),
          sku: v.sku,
        })),
      };

      const url = isEdit ? `/api/admin/products/${initialData?.id}` : '/api/admin/products';

      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save product');
      }

      showToast(
        isEdit ? 'Product updated successfully' : 'Product created successfully',
        'success'
      );
      router.push('/admin/products');
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving product';
      showToast(msg, 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="border-muted/20 flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="hover:bg-muted/20 rounded p-1.5 text-muted transition-colors hover:text-cream"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h2 className="heading-md text-cream">
            {isEdit ? `Edit: ${initialData?.name}` : 'Create New Menswear Product'}
          </h2>
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="bg-cream text-xs font-bold uppercase tracking-wider text-ink hover:bg-cream-soft"
        >
          <Save className="mr-1.5 h-4 w-4" />
          {isEdit ? 'Update Product' : 'Publish Product'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Info */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card: Basic Details */}
          <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
            <h3 className="heading-sm border-muted/10 border-b pb-2 text-cream">Primary Details</h3>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Minimalist Heavyweight Boxy Tee"
                className="border-muted/30 placeholder:text-muted/50 w-full rounded-[1px] border bg-ink px-4 py-2.5 text-sm text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Selling Price (BDT) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="border-muted/30 w-full rounded-[1px] border bg-ink px-4 py-2.5 text-sm text-cream focus:border-cream focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Compare Price (BDT)
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.comparePrice || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      comparePrice: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  placeholder="Regular strikethrough price"
                  className="border-muted/30 w-full rounded-[1px] border bg-ink px-4 py-2.5 text-sm text-cream focus:border-cream focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Base SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="GH-TEE-01"
                  className="border-muted/30 w-full rounded-[1px] border bg-ink px-4 py-2.5 text-sm uppercase text-cream focus:border-cream focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Short Catchphrase / Highlight
              </label>
              <input
                type="text"
                value={formData.shortDescription}
                onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                placeholder="e.g. 280 GSM luxury combed cotton with drop-shoulder silhouette."
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-4 py-2.5 text-sm text-cream focus:border-cream focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Detailed Product Description
              </label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Comprehensive editorial garment description..."
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-4 py-2.5 text-sm text-cream focus:border-cream focus:outline-none"
              />
            </div>
          </div>

          {/* Card: Fabric, Fit & Care Specs */}
          <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
            <h3 className="heading-sm border-muted/10 border-b pb-2 text-cream">
              Atelier Specifications
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Fabric Composition
                </label>
                <input
                  type="text"
                  value={formData.fabric}
                  onChange={(e) => setFormData({ ...formData, fabric: e.target.value })}
                  className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Garment Fit
                </label>
                <input
                  type="text"
                  value={formData.fit}
                  onChange={(e) => setFormData({ ...formData, fit: e.target.value })}
                  className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                  Care Guide
                </label>
                <input
                  type="text"
                  value={formData.care}
                  onChange={(e) => setFormData({ ...formData, care: e.target.value })}
                  className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Card: Variants Matrix (Size, Color, Stock) */}
          <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
            <div className="border-muted/10 flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="heading-sm text-cream">Garment Variants & Stock</h3>
                <p className="text-[11px] text-muted">
                  Define sizes, colorways, and inventory quantities.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-cream underline underline-offset-4 hover:opacity-80"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Variant
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-muted/20 border-b text-[10px] uppercase tracking-wider text-muted">
                    <th className="py-2">Size</th>
                    <th className="py-2">Color Name</th>
                    <th className="py-2">Color Hex</th>
                    <th className="py-2">Stock Units</th>
                    <th className="py-2 text-right">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-muted/10 divide-y">
                  {formData.variants.map((variant, index) => (
                    <tr key={index}>
                      <td className="py-2 pr-2">
                        <select
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          className="border-muted/30 rounded-[1px] border bg-ink px-2.5 py-1.5 text-xs text-cream focus:border-cream focus:outline-none"
                        >
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={variant.color}
                          onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                          placeholder="e.g. Charcoal Black"
                          className="border-muted/30 w-full rounded-[1px] border bg-ink px-2.5 py-1.5 text-xs text-cream focus:border-cream focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="text"
                          value={variant.colorHex || ''}
                          onChange={(e) => handleVariantChange(index, 'colorHex', e.target.value)}
                          placeholder="#171718"
                          className="border-muted/30 w-24 rounded-[1px] border bg-ink px-2.5 py-1.5 font-mono text-xs text-cream focus:border-cream focus:outline-none"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          type="number"
                          min={0}
                          value={variant.stock}
                          onChange={(e) =>
                            handleVariantChange(index, 'stock', Number(e.target.value))
                          }
                          className="border-muted/30 w-20 rounded-[1px] border bg-ink px-2.5 py-1.5 text-xs text-cream focus:border-cream focus:outline-none"
                        />
                      </td>
                      <td className="py-2 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-1 text-muted hover:text-danger"
                          title="Remove variant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Status, Featured Image, Trending */}
        <div className="space-y-6 lg:col-span-4">
          {/* Card: Status & Visibility */}
          <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
            <h3 className="heading-sm border-muted/10 border-b pb-2 text-cream">Status & Tags</h3>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Publishing Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as 'ACTIVE' | 'DRAFT' | 'ARCHIVED',
                  })
                }
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              >
                <option value="ACTIVE">ACTIVE (Visible in Store)</option>
                <option value="DRAFT">DRAFT (Hidden)</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>

            <div className="pt-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.isTrending}
                  onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                  className="border-muted/30 h-4 w-4 rounded bg-ink text-cream focus:ring-0"
                />
                <div>
                  <span className="text-xs font-semibold text-cream">Show in Trending Catalog</span>
                  <p className="text-[10px] text-muted">
                    Displays on homepage &quot;Best of Gents Hood&quot; grid.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Card: Image URL */}
          <div className="border-muted/20 space-y-4 border bg-[#1a1a1c] p-6">
            <h3 className="heading-sm border-muted/10 border-b pb-2 text-cream">Media & Imagery</h3>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Garment Image URL *
              </label>
              <input
                type="text"
                required
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="/images/gallery-front.jpg"
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
              <p className="mt-1 text-[10px] text-muted">
                Cloudinary CDN URL or local public path (e.g. /images/...)
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">
                Image Alt Description
              </label>
              <input
                type="text"
                value={formData.imageAlt}
                onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                placeholder="Front view of garment"
                className="border-muted/30 w-full rounded-[1px] border bg-ink px-3 py-2 text-xs text-cream focus:border-cream focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
