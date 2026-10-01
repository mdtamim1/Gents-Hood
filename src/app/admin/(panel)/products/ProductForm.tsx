'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Upload,
  Link as LinkIcon,
  X,
  ImageIcon,
  Wand2,
  Palette,
  GripVertical,
  Info,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useToast } from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VariantInput {
  id?: string;
  size: string;
  color: string;
  colorHex: string;
  stock: number;
  sku?: string | null;
}

interface ImageEntry {
  url: string;
  alt: string;
  colorHex: string | null; // null = no color mapping
  isPrimary: boolean;
  uploading?: boolean;
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
    cutDrape?: string | null;
    hardware?: string | null;
    fitBadge?: string | null;
    status: string;
    isTrending: boolean;
    images: { url: string; alt?: string | null; colorHex?: string | null; isPrimary?: boolean }[];
    variants: VariantInput[];
  };
  isEdit?: boolean;
}

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];

const PRESET_COLORS = [
  { name: 'Charcoal Black', hex: '#171718' },
  { name: 'Deep Slate', hex: '#2A2E33' },
  { name: 'Midnight Navy', hex: '#1B2A4A' },
  { name: 'Forest Green', hex: '#2D4A3E' },
  { name: 'Burgundy', hex: '#4A0E17' },
  { name: 'Bone White', hex: '#E8E4DC' },
  { name: 'Sand', hex: '#C4A882' },
  { name: 'Olive', hex: '#6B6944' },
];

function generateSku(name: string): string {
  const words = name.trim().toUpperCase().split(/\s+/);
  const prefix = words
    .slice(0, 3)
    .map((w) => w.slice(0, 3))
    .join('-');
  const suffix = Math.floor(Math.random() * 90 + 10).toString();
  return `GH-${prefix}-${suffix}`;
}

// ─── ImageUploadBox ───────────────────────────────────────────────────────────

function ImageUploadBox({
  image,
  isPrimary,
  onRemove,
  onAltChange,
  onColorHexChange,
  onUpload,
  onUrlChange,
  availableColors,
}: {
  image: ImageEntry;
  isPrimary: boolean;
  onRemove: () => void;
  onAltChange: (v: string) => void;
  onColorHexChange: (v: string | null) => void;
  onUpload: (file: File) => void;
  onUrlChange: (v: string) => void;
  availableColors: { name: string; hex: string }[];
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isUploaded =
    image.url.startsWith('/uploads') ||
    image.url.includes('media.gentshood.com') ||
    image.url.includes('r2.cloudflarestorage.com') ||
    image.url.startsWith('blob');
  const [urlMode, setUrlMode] = useState(!isUploaded && Boolean(image.url));
  const [showColorPicker, setShowColorPicker] = useState(false);

  return (
    <div
      className={`relative rounded-xl border p-3 transition-all ${isPrimary ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/[0.08] bg-[#1a1a1d]'}`}
    >
      {isPrimary && (
        <span className="absolute -top-2.5 left-3 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-400">
          Main Image
        </span>
      )}

      <div className="flex gap-3">
        {/* Preview */}
        <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-800">
          {image.url ? (
            <Image src={image.url} alt={image.alt || 'preview'} fill className="object-cover" />
          ) : image.uploading ? (
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
            </div>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1">
              <ImageIcon className="h-5 w-5 text-zinc-600" />
            </div>
          )}
          {/* drag handle placeholder */}
          <div className="absolute left-0.5 top-0.5">
            <GripVertical className="h-3.5 w-3.5 text-white/20" />
          </div>
        </div>

        {/* Controls */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* URL / Upload toggle */}
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setUrlMode(false)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${!urlMode ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Upload className="h-3 w-3" /> Upload
            </button>
            <button
              type="button"
              onClick={() => setUrlMode(true)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-semibold transition-all ${urlMode ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <LinkIcon className="h-3 w-3" /> URL
            </button>
          </div>

          {urlMode ? (
            <input
              type="text"
              value={image.url}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder="https://... or /images/..."
              className="w-full rounded-lg border border-white/[0.08] bg-zinc-900 px-2.5 py-1.5 text-[11px] text-white placeholder-zinc-500 outline-none focus:border-zinc-500"
            />
          ) : (
            <>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-600 bg-zinc-900 px-2 py-2 text-[10px] font-semibold text-zinc-400 transition-all hover:border-zinc-400 hover:text-white"
              >
                <Upload className="h-3 w-3" />
                {image.url ? 'Replace image' : 'Click to upload'}
              </button>
            </>
          )}

          {/* Alt text */}
          <div>
            <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-500">
              Image Alt Text / SEO (Optional)
            </label>
            <input
              type="text"
              value={image.alt}
              onChange={(e) => onAltChange(e.target.value)}
              placeholder="e.g. Front view on model (for Google SEO)"
              className="w-full rounded-lg border border-white/[0.06] bg-zinc-900 px-2.5 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 outline-none focus:border-zinc-500"
            />
          </div>

          {/* Color mapping */}
          {!isPrimary && availableColors.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowColorPicker((p) => !p)}
                className="flex w-full items-center gap-2 rounded-lg border border-white/[0.06] bg-zinc-900 px-2.5 py-1.5 text-[11px] transition-all hover:border-zinc-500"
              >
                {image.colorHex ? (
                  <>
                    <span
                      className="h-3 w-3 flex-shrink-0 rounded-full border border-white/20"
                      style={{ backgroundColor: image.colorHex }}
                    />
                    <span className="flex-1 text-left text-white">
                      {availableColors.find((c) => c.hex === image.colorHex)?.name ||
                        image.colorHex}
                    </span>
                  </>
                ) : (
                  <>
                    <Palette className="h-3 w-3 flex-shrink-0 text-zinc-500" />
                    <span className="flex-1 text-left text-zinc-500">Map to color (optional)</span>
                  </>
                )}
                <ChevronDown
                  className={`h-3 w-3 text-zinc-500 transition-transform ${showColorPicker ? 'rotate-180' : ''}`}
                />
              </button>
              {showColorPicker && (
                <div className="absolute left-0 top-full z-50 mt-1 w-full rounded-xl border border-white/[0.12] bg-[#18181b] p-2 shadow-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      onColorHexChange(null);
                      setShowColorPicker(false);
                    }}
                    className="mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-zinc-400 hover:bg-white/[0.06]"
                  >
                    <X className="h-3 w-3" /> No mapping
                  </button>
                  {availableColors.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => {
                        onColorHexChange(c.hex);
                        setShowColorPicker(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] transition-colors hover:bg-white/[0.06] ${image.colorHex === c.hex ? 'text-white' : 'text-zinc-400'}`}
                    >
                      <span
                        className="h-3 w-3 shrink-0 rounded-full border border-white/20"
                        style={{ backgroundColor: c.hex }}
                      />
                      {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Remove */}
        <button
          type="button"
          onClick={onRemove}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main ProductForm ─────────────────────────────────────────────────────────

export function ProductForm({ initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignature = searchParams.get('signature') === 'true';
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // ── Basic fields
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price || 2500);
  const [comparePrice, setComparePrice] = useState<number | ''>(initialData?.comparePrice || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [shortDesc, setShortDesc] = useState(initialData?.shortDescription || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [fabric, setFabric] = useState(initialData?.fabric || '100% High-Density Milled Cotton');
  const [fit, setFit] = useState(initialData?.fit || 'Structured Tailored Fit');
  const [care, setCare] = useState(initialData?.care || 'Dry clean or cold machine wash.');
  const [cutDrape, setCutDrape] = useState(initialData?.cutDrape || 'Relaxed Drop Shoulder');
  const [hardware, setHardware] = useState(initialData?.hardware || 'Concealed Storm Placket');
  const [fitBadge, setFitBadge] = useState(initialData?.fitBadge || 'True to Size');
  const [specsActiveTab, setSpecsActiveTab] = useState<'details' | 'fabric' | 'fit'>('details');
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT' | 'ARCHIVED'>(
    (initialData?.status as 'ACTIVE' | 'DRAFT' | 'ARCHIVED') || 'ACTIVE'
  );
  const [isTrending, setIsTrending] = useState(initialData?.isTrending ?? true);

  // ── Images state
  const [images, setImages] = useState<ImageEntry[]>(() => {
    if (initialData?.images && initialData.images.length > 0) {
      return initialData.images.map((img, idx) => ({
        url: img.url,
        alt: img.alt || '',
        colorHex: img.colorHex || null,
        isPrimary: idx === 0,
      }));
    }
    return [];
  });

  // ── Color-image mapping toggle
  const [colorImageEnabled, setColorImageEnabled] = useState(() => {
    return initialData?.images?.some((img) => img.colorHex) ?? false;
  });

  // ── Variants
  const [variants, setVariants] = useState<VariantInput[]>(
    initialData?.variants && initialData.variants.length > 0
      ? initialData.variants
      : [
          { size: 'M', color: 'Charcoal Black', colorHex: '#171718', stock: 15 },
          { size: 'L', color: 'Charcoal Black', colorHex: '#171718', stock: 12 },
          { size: 'XL', color: 'Charcoal Black', colorHex: '#171718', stock: 8 },
        ]
  );

  // ── Unique colors derived from variants
  const availableColors = React.useMemo(() => {
    const map = new Map<string, string>();
    variants.forEach((v) => {
      if (v.color && v.colorHex && !map.has(v.colorHex)) {
        map.set(v.colorHex, v.color);
      }
    });
    return Array.from(map.entries()).map(([hex, name]) => ({ hex, name }));
  }, [variants]);

  // ── Upload image helper
  const uploadImage = useCallback(
    async (file: File, index: number) => {
      setImages((prev) => prev.map((img, i) => (i === index ? { ...img, uploading: true } : img)));
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed');
        setImages((prev) =>
          prev.map((img, i) =>
            i === index
              ? { ...img, url: data.url, uploading: false, alt: img.alt || file.name }
              : img
          )
        );
        showToast('Image uploaded & compressed!', 'success');
      } catch (err: unknown) {
        setImages((prev) =>
          prev.map((img, i) => (i === index ? { ...img, uploading: false } : img))
        );
        showToast(err instanceof Error ? err.message : 'Upload failed', 'danger');
      }
    },
    [showToast]
  );

  const addImage = () => {
    if (images.length >= 15) {
      showToast('Maximum 15 images allowed', 'danger');
      return;
    }
    setImages((prev) => [...prev, { url: '', alt: '', colorHex: null, isPrimary: false }]);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ── Variants helpers
  const addVariant = () => {
    const lastColor = variants[variants.length - 1];
    setVariants((prev) => [
      ...prev,
      {
        size: 'L',
        color: lastColor?.color || 'Charcoal Black',
        colorHex: lastColor?.colorHex || '#171718',
        stock: 10,
      },
    ]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      showToast('At least one variant required', 'danger');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantInput, value: string | number) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      // If color name changes, try to sync colorHex from preset
      if (field === 'color') {
        const preset = PRESET_COLORS.find(
          (p) => p.name.toLowerCase() === String(value).toLowerCase()
        );
        if (preset) next[index].colorHex = preset.hex;
      }
      return next;
    });
  };

  // ── Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Product name is required', 'danger');
      return;
    }
    if (price <= 0) {
      showToast('Price must be > 0', 'danger');
      return;
    }
    if (images.length === 0) {
      showToast('At least one image is required', 'danger');
      return;
    }
    if (images.some((img) => !img.url)) {
      showToast('All image entries need a URL or upload', 'danger');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        comparePrice: comparePrice ? Number(comparePrice) : null,
        sku: sku.trim() || undefined,
        shortDescription: shortDesc || null,
        description: description || null,
        fabric: fabric || null,
        fit: fit || null,
        care: care || null,
        cutDrape: cutDrape || null,
        hardware: hardware || null,
        fitBadge: fitBadge || 'True to Size',
        status,
        isTrending,
        isSignature,
        images: images.map((img, idx) => ({
          url: img.url,
          alt: img.alt || name,
          isPrimary: idx === 0,
          colorHex: colorImageEnabled ? img.colorHex : null,
        })),
        variants: variants.map((v) => ({
          size: v.size,
          color: v.color,
          colorHex: v.colorHex || '#171718',
          stock: Number(v.stock),
          sku: v.sku || undefined,
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
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to save');

      showToast(
        isSignature
          ? 'Signature Product uploaded and set live on Homepage!'
          : isEdit
            ? 'Product updated!'
            : 'Product published!',
        'success'
      );
      router.push('/admin/products');
      router.refresh();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error saving product', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit}>
      {/* ── Top bar ── */}
      <div className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0f0f11]/90 backdrop-blur-lg">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link
              href="/admin/products"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-zinc-400 transition-colors hover:border-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-white">
                {isEdit ? `Edit: ${initialData?.name}` : 'New Product'}
              </h1>
              <p className="text-[10px] text-zinc-500">
                {isEdit ? 'Update product details' : 'Fill all required fields to publish'}
              </p>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 rounded-lg bg-[#e4e4e7] px-5 py-2 text-xs font-black uppercase tracking-wider text-zinc-900 shadow-lg transition-all hover:bg-white hover:shadow-xl disabled:opacity-60"
          >
            {isLoading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-800" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? 'Update Product' : 'Publish Product'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 p-6 lg:grid-cols-12">
        {/* ── LEFT: Main info ── */}
        <div className="space-y-5 lg:col-span-8">
          {/* Signature Product Flagship Banner */}
          {isSignature && (
            <div className="rounded-xl border border-[#D4AF37]/50 bg-gradient-to-r from-[#2A0E14] via-[#4A0E17] to-[#2A0E14] p-4 text-white shadow-[0_0_25px_rgba(212,175,55,0.25)]">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D4AF37]/20 text-[#D4AF37] ring-1 ring-[#D4AF37]/40">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-[#D4AF37] px-2 py-0.5 font-mono text-[9px] font-black uppercase text-black">
                      Homepage Signature Product
                    </span>
                    <span className="text-xs font-bold text-white">Flagship Masterpiece</span>
                  </div>
                  <p className="mt-1 text-xs text-white/80">
                    You are uploading the official Signature Product for the homepage. When
                    published, this piece will immediately be showcased under the Hero & Gallery
                    section on your live storefront.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary Details */}
          <section className="rounded-xl border border-white/[0.06] bg-[#141416] p-6">
            <h2 className="mb-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">
              Primary Details
            </h2>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Minimalist Heavyweight Boxy Tee"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#1a1a1d] px-4 py-3 text-sm font-semibold text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-500"
                />
              </div>

              {/* Price / Compare / SKU */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Selling Price (BDT) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#1a1a1d] px-4 py-3 text-sm text-white outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Compare Price (BDT)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Strikethrough price"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#1a1a1d] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                </div>
                <div>
                  <label className="mb-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Base SKU
                    <button
                      type="button"
                      onClick={() => setSku(generateSku(name || 'PRODUCT'))}
                      title="Auto-generate SKU"
                      className="flex items-center gap-1 rounded-md border border-zinc-700 px-1.5 py-0.5 text-[9px] text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
                    >
                      <Wand2 className="h-2.5 w-2.5" /> Auto
                    </button>
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value.toUpperCase())}
                    placeholder="GH-TEE-01 (auto if empty)"
                    className="w-full rounded-xl border border-white/[0.08] bg-[#1a1a1d] px-4 py-3 font-mono text-sm uppercase text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                </div>
              </div>

              {/* Short description */}
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Short Highlight / Catchphrase
                </label>
                <input
                  type="text"
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="e.g. 280 GSM luxury combed cotton with drop-shoulder silhouette."
                  className="w-full rounded-xl border border-white/[0.08] bg-[#1a1a1d] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                />
              </div>
            </div>
          </section>

          {/* ═══ FRONTEND PRODUCT TABS (DETAILS • FABRIC • FIT) ═══ */}
          <section className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-xs text-amber-400">
                    ✨
                  </span>
                  <h2 className="text-[12px] font-black uppercase tracking-wider text-white">
                    Frontend Product Tabs (DETAILS • FABRIC • FIT)
                  </h2>
                </div>
                <p className="mt-1 text-[10px] text-zinc-500">
                  Manage the exact contents of the 3 tabs shown on your live store product page.
                </p>
              </div>

              {/* Tab Selector matching frontend style */}
              <div className="flex overflow-hidden rounded-xl border border-white/[0.1] bg-[#1a1a1d] p-1">
                {[
                  { id: 'details', label: '1. DETAILS Tab' },
                  { id: 'fabric', label: '2. FABRIC Tab' },
                  { id: 'fit', label: '3. FIT Tab' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSpecsActiveTab(t.id as 'details' | 'fabric' | 'fit')}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all ${
                      specsActiveTab === t.id
                        ? 'bg-[#4A0E17] text-white shadow-md'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* TAB 1: DETAILS */}
            {specsActiveTab === 'details' && (
              <div className="space-y-4 rounded-xl border border-white/[0.06] bg-[#1a1a1d]/60 p-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Tab 1: DETAILS Content
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Controls editorial description + the 2 highlight cards
                  </span>
                </div>

                {/* Full Description */}
                <div>
                  <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Editorial Product Description
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Engineered from custom heavy-weight milled twill featuring relaxed drop shoulders, deep welt pockets, and an architectural storm collar. Built to endure cold city breezes while maintaining fluid effortless silhouette."
                    className="w-full resize-y rounded-xl border border-white/[0.08] bg-[#141416] px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                </div>

                {/* 2 Spec Boxes (Cut & Drape and Hardware) */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* Box 1: Cut & Drape */}
                  <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                        Box 1: Cut & Drape (↗)
                      </label>
                      <span className="text-[9px] text-zinc-500">Left card</span>
                    </div>
                    <input
                      type="text"
                      value={cutDrape}
                      onChange={(e) => setCutDrape(e.target.value)}
                      placeholder="e.g. Relaxed Drop Shoulder or Tailored Cargo Leg"
                      className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                    />
                    {/* Quick suggestion pills */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {[
                        'Relaxed Drop Shoulder',
                        'Tailored Cargo Silhouette',
                        'Straight Leg Cut',
                        'Oversized Boxy Fit',
                        'Structured Tapered Leg',
                      ].map((pill) => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => setCutDrape(pill)}
                          className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[9px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
                        >
                          + {pill}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Box 2: Hardware & Features */}
                  <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-3.5">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                        Box 2: Hardware & Features (⚙)
                      </label>
                      <span className="text-[9px] text-zinc-500">Right card</span>
                    </div>
                    <input
                      type="text"
                      value={hardware}
                      onChange={(e) => setHardware(e.target.value)}
                      placeholder="e.g. Concealed Storm Placket or Toggle Ankle Cords"
                      className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                    />
                    {/* Quick suggestion pills */}
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {[
                        'Concealed Storm Placket',
                        'Adjustable Toggle Ankles & Pockets',
                        'YKK Heavy Matte Metal Zippers',
                        'Matte Snap Buttons',
                        'Reinforced Dual Stitching',
                      ].map((pill) => (
                        <button
                          key={pill}
                          type="button"
                          onClick={() => setHardware(pill)}
                          className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[9px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
                        >
                          + {pill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: FABRIC */}
            {specsActiveTab === 'fabric' && (
              <div className="space-y-4 rounded-xl border border-white/[0.06] bg-[#1a1a1d]/60 p-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Tab 2: FABRIC & CARE Content
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Controls material composition and washing guide
                  </span>
                </div>

                {/* Fabric Composition */}
                <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-3.5">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-300">
                    Material Composition (🧵)
                  </label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    placeholder="e.g. 100% Premium Heavyweight Milled Twill / Combed Cotton"
                    className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                  {/* Quick pills */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      '100% Premium Heavyweight Milled Twill',
                      '100% High-Density Milled Cotton',
                      '65% Cotton, 35% Wool Blend',
                      'Heavyweight French Terry (380 GSM)',
                      'Premium Cotton & Spandex Stretch Twill',
                    ].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setFabric(pill)}
                        className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[9px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
                      >
                        + {pill}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Garment Care */}
                <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-3.5">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-300">
                    Garment Care Guide (🧼)
                  </label>
                  <input
                    type="text"
                    value={care}
                    onChange={(e) => setCare(e.target.value)}
                    placeholder="e.g. Dry clean recommended. Gentle cold machine wash with like colors."
                    className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                  {/* Quick pills */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      'Dry clean recommended. Gentle cold machine wash.',
                      'Machine wash cold with like colors. Tumble dry low.',
                      'Gentle hand wash cold. Do not bleach. Hang dry.',
                    ].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setCare(pill)}
                        className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[9px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
                      >
                        + {pill}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: FIT */}
            {specsActiveTab === 'fit' && (
              <div className="space-y-4 rounded-xl border border-white/[0.06] bg-[#1a1a1d]/60 p-4">
                <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    Tab 3: SILHOUETTE & FIT Content
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Controls the fit tag badge and silhouette narrative
                  </span>
                </div>

                {/* Fit Badge */}
                <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-wider text-zinc-300">
                      Silhouette Fit Badge (Top Right Badge)
                    </label>
                    <span className="rounded-md bg-[#4A0E17] px-2 py-0.5 text-[9px] font-bold text-white">
                      Preview: {fitBadge}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={fitBadge}
                    onChange={(e) => setFitBadge(e.target.value)}
                    placeholder="e.g. True to Size or Relaxed Fit"
                    className="w-full rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-3 py-2 text-xs font-semibold text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                  {/* Quick preset badge buttons */}
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {[
                      'True to Size',
                      'Relaxed Fit',
                      'Oversized Fit',
                      'Structured Fit',
                      'Tailored Regular',
                      'Slim Fit',
                    ].map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => setFitBadge(b)}
                        className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold transition-all ${
                          fitBadge === b
                            ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                            : 'border-white/[0.08] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        {fitBadge === b ? '✓ ' : ''}
                        {b}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Silhouette & Fit Description */}
                <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-3.5">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-wider text-zinc-300">
                    Silhouette & Fit Description
                  </label>
                  <textarea
                    rows={3}
                    value={fit}
                    onChange={(e) => setFit(e.target.value)}
                    placeholder="e.g. Engineered with relaxed shoulders for seamless layering. Fits true to size with a clean contemporary profile."
                    className="w-full resize-y rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-3 py-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                  />
                  {/* Quick pills */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      'Engineered with relaxed shoulders for seamless layering. Fits true to size.',
                      'Tailored waist with relaxed thigh and adjustable toggle ankles for versatile styling.',
                      'Modern oversized silhouette with drop shoulders and structured drape.',
                    ].map((pill) => (
                      <button
                        key={pill}
                        type="button"
                        onClick={() => setFit(pill)}
                        className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-0.5 text-[9px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
                      >
                        + {pill.slice(0, 45)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Gallery / Images */}
          <section className="rounded-xl border border-white/[0.06] bg-[#141416] p-6">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Media & Imagery
                </h2>
                <p className="mt-0.5 text-[10px] text-zinc-600">
                  1 main image + up to 14 gallery images (max 15 total) • Auto-compressed to WebP
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* Color-image mapping toggle */}
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-3 py-1.5">
                  <div
                    className={`relative h-4 w-7 rounded-full transition-colors ${colorImageEnabled ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                    onClick={() => setColorImageEnabled((p) => !p)}
                  >
                    <div
                      className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${colorImageEnabled ? 'translate-x-3' : 'translate-x-0.5'}`}
                    />
                  </div>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    Color → Image Mapping
                  </span>
                  <div title="When enabled, gallery images can be linked to specific colors. Customers will see the matched image when selecting a color.">
                    <Info className="h-3 w-3 text-zinc-600" />
                  </div>
                </label>

                <button
                  type="button"
                  onClick={addImage}
                  disabled={images.length >= 15}
                  className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-all hover:border-white/20 hover:text-white disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Image ({images.length}/15)
                </button>
              </div>
            </div>

            {images.length === 0 ? (
              <button
                type="button"
                onClick={addImage}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[0.08] bg-white/[0.01] py-10 text-zinc-600 transition-all hover:border-zinc-600 hover:text-zinc-400"
              >
                <ImageIcon className="h-8 w-8" />
                <span className="text-xs font-semibold">Click to add your first image</span>
              </button>
            ) : (
              <div className="space-y-3">
                {images.map((img, idx) => (
                  <ImageUploadBox
                    key={idx}
                    image={img}
                    isPrimary={idx === 0}
                    availableColors={colorImageEnabled ? availableColors : []}
                    onRemove={() => removeImage(idx)}
                    onAltChange={(v) =>
                      setImages((prev) => prev.map((m, i) => (i === idx ? { ...m, alt: v } : m)))
                    }
                    onColorHexChange={(v) =>
                      setImages((prev) =>
                        prev.map((m, i) => (i === idx ? { ...m, colorHex: v } : m))
                      )
                    }
                    onUpload={(file) => uploadImage(file, idx)}
                    onUrlChange={(v) =>
                      setImages((prev) => prev.map((m, i) => (i === idx ? { ...m, url: v } : m)))
                    }
                  />
                ))}
              </div>
            )}

            {colorImageEnabled && availableColors.length === 0 && (
              <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-400">
                ⚠ Add variants with colors first to enable color → image mapping.
              </p>
            )}
          </section>

          {/* Variants */}
          <section className="rounded-xl border border-white/[0.06] bg-[#141416] p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-black uppercase tracking-wider text-zinc-400">
                  Garment Variants & Stock
                </h2>
                <p className="mt-0.5 text-[10px] text-zinc-600">
                  Define sizes, colorways, and inventory quantities.
                </p>
              </div>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] font-semibold text-zinc-300 transition-all hover:border-white/20 hover:text-white"
              >
                <Plus className="h-3.5 w-3.5" /> Add Variant
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06] text-[10px] uppercase tracking-wider text-zinc-500">
                    <th className="pb-2.5 pr-3 text-left font-bold">Size</th>
                    <th className="pb-2.5 pr-3 text-left font-bold">Color Name</th>
                    <th className="pb-2.5 pr-3 text-left font-bold">Color</th>
                    <th className="pb-2.5 pr-3 text-left font-bold">Stock</th>
                    <th className="pb-2.5 text-right font-bold">Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {variants.map((v, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 pr-3">
                        <select
                          value={v.size}
                          onChange={(e) => updateVariant(idx, 'size', e.target.value)}
                          className="rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-2.5 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
                        >
                          {SIZES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="relative">
                          <input
                            type="text"
                            list={`color-list-${idx}`}
                            value={v.color}
                            onChange={(e) => updateVariant(idx, 'color', e.target.value)}
                            placeholder="e.g. Charcoal Black"
                            className="w-36 rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                          />
                          <datalist id={`color-list-${idx}`}>
                            {PRESET_COLORS.map((c) => (
                              <option key={c.hex} value={c.name} />
                            ))}
                          </datalist>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-2">
                          {/* Color preview swatch — click to pick */}
                          <label className="relative cursor-pointer">
                            <span
                              className="block h-7 w-7 rounded-lg border border-white/20 shadow-inner"
                              style={{ backgroundColor: v.colorHex || '#888' }}
                            />
                            <input
                              type="color"
                              value={v.colorHex || '#171718'}
                              onChange={(e) => updateVariant(idx, 'colorHex', e.target.value)}
                              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              title="Pick color"
                            />
                          </label>
                          <input
                            type="text"
                            value={v.colorHex || ''}
                            onChange={(e) => updateVariant(idx, 'colorHex', e.target.value)}
                            placeholder="#171718"
                            maxLength={7}
                            className="w-20 rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-2 py-1.5 font-mono text-[11px] uppercase text-white placeholder-zinc-600 outline-none focus:border-zinc-500"
                          />
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <input
                          type="number"
                          min={0}
                          value={v.stock}
                          onChange={(e) => updateVariant(idx, 'stock', Number(e.target.value))}
                          className="w-20 rounded-lg border border-white/[0.08] bg-[#1a1a1d] px-2.5 py-1.5 text-xs text-white outline-none focus:border-zinc-500"
                        />
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-600 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* ── RIGHT: Sidebar ── */}
        <div className="space-y-5 lg:col-span-4">
          {/* Status */}
          <section className="rounded-xl border border-white/[0.06] bg-[#141416] p-5">
            <h2 className="mb-4 text-[11px] font-black uppercase tracking-wider text-zinc-400">
              Publishing
            </h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'DRAFT' | 'ARCHIVED')}
                  className="w-full rounded-xl border border-white/[0.08] bg-[#1a1a1d] px-3 py-2.5 text-sm text-white outline-none focus:border-zinc-500"
                >
                  <option value="ACTIVE">🟢 ACTIVE (Visible in Store)</option>
                  <option value="DRAFT">🟡 DRAFT (Hidden)</option>
                  <option value="ARCHIVED">⚫ ARCHIVED</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.04]">
                <input
                  type="checkbox"
                  checked={isTrending}
                  onChange={(e) => setIsTrending(e.target.checked)}
                  className="h-4 w-4 rounded accent-amber-500"
                />
                <div>
                  <span className="text-xs font-bold text-white">Show in Trending</span>
                  <p className="text-[10px] text-zinc-500">
                    Displays in &quot;Best of Gents Hood&quot; grid
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Image preview panel */}
          {images.length > 0 && (
            <section className="rounded-xl border border-white/[0.06] bg-[#141416] p-5">
              <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Gallery Preview
              </h2>
              <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-800">
                {images[0]?.url ? (
                  <Image src={images[0].url} alt="Main preview" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-zinc-600" />
                  </div>
                )}
                <div className="absolute bottom-2 left-2 rounded-md border border-amber-500/30 bg-amber-500/20 px-2 py-0.5 text-[9px] font-black text-amber-400">
                  MAIN
                </div>
              </div>
              {/* Thumbnail strip — scrollable */}
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                  {images.slice(1).map((img, i) => (
                    <div
                      key={i}
                      className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg border border-white/[0.08] bg-zinc-800"
                    >
                      {img.url && (
                        <Image
                          src={img.url}
                          alt={img.alt || `gallery ${i + 2}`}
                          fill
                          className="object-cover"
                        />
                      )}
                      {img.colorHex && colorImageEnabled && (
                        <div
                          className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border border-white/30"
                          style={{ backgroundColor: img.colorHex }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <p className="mt-2 text-center text-[10px] text-zinc-600">
                {images.length} image{images.length !== 1 ? 's' : ''} total
              </p>
            </section>
          )}

          {/* Color summary */}
          {availableColors.length > 0 && (
            <section className="rounded-xl border border-white/[0.06] bg-[#141416] p-5">
              <h2 className="mb-3 text-[11px] font-black uppercase tracking-wider text-zinc-400">
                Available Colors
              </h2>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((c) => (
                  <div
                    key={c.hex}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1.5"
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-white/20"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-[11px] font-semibold text-zinc-300">{c.name}</span>
                  </div>
                ))}
              </div>
              {colorImageEnabled && (
                <p className="mt-2 text-[10px] text-indigo-400">
                  ✓ Color → Image mapping is active
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </form>
  );
}
