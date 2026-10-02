'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  PhoneCall,
  MessageSquare,
  Truck,
  Printer,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils/money';
import { Button } from '@/components/ui/Button';

interface OrderItem {
  id: string;
  nameSnapshot: string;
  sizeSnapshot?: string | null;
  colorSnapshot?: string | null;
  priceSnapshot: number;
  qty: number;
  imageSnapshot?: string | null;
}

interface OrderSuccessClientProps {
  order: {
    orderNo: string;
    total: number;
    subtotal: number;
    deliveryCharge: number;
    shippingName: string;
    shippingPhone: string;
    shippingDistrict: string;
    shippingArea: string;
    shippingAddress: string;
    note?: string | null;
    paymentMethod: string;
    paymentStatus: string;
    createdAt: Date | string;
    items: OrderItem[];
  };
  siteSettings?: {
    whatsapp?: string | null;
    contactPhone?: string | null;
  };
}

export function OrderSuccessClient({ order, siteSettings }: OrderSuccessClientProps) {
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Confetti Particle Celebration Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Luxury palette: Gold, Charcoal, Crimson, Cream, Emerald
    const colors = ['#d4af37', '#171718', '#8b0000', '#2d5a27', '#e8dfd3', '#b8860b'];

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: string;
      size: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
    }

    const particles: Particle[] = [];
    const count = 75;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: width / 2 + (Math.random() - 0.5) * 80,
        y: height * 0.25 + (Math.random() - 0.5) * 50,
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 12 - 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 7 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 8,
        opacity: 1,
      });
    }

    const startTime = Date.now();

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      const elapsed = Date.now() - startTime;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.98; // friction
        p.rotation += p.rotationSpeed;

        if (elapsed > 2500) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
      });

      if (elapsed < 4500) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleCopyOrderNo = () => {
    navigator.clipboard.writeText(order.orderNo);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const whatsappNumber = siteSettings?.whatsapp || '01623-095187';
  const cleanWaNumber = whatsappNumber.replace(/[^\d]/g, '');
  const firstName = order.shippingName.split(' ')[0] || 'Sir';

  return (
    <div className="relative min-h-screen bg-cream py-10 text-ink sm:py-16">
      {/* Celebration Confetti Canvas Overlay */}
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50 h-full w-full" />

      <div className="mx-auto max-w-[840px] px-4 sm:px-8">
        {/* Animated Celebration Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 text-center"
        >
          {/* Animated Luxury Checkmark Badge */}
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            {/* Ambient Pulse Ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md"
            />

            {/* Checkmark Circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: 0.1,
              }}
              className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-ink text-cream shadow-xl"
            >
              <svg
                className="h-10 w-10 text-cream"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
                  d="M20 6L9 17L4 12"
                />
              </svg>
            </motion.div>
          </div>

          {/* Subtitle & Congratulations Message */}
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-cream-soft px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Order Confirmed • Gents Hood Atelier
            </span>

            <h1 className="text-2xl font-extrabold uppercase tracking-tight text-ink sm:text-4xl">
              অভিনন্দন, {firstName}!
            </h1>

            <p className="mx-auto max-w-lg text-xs leading-relaxed text-muted sm:text-sm">
              Your luxury order has been confirmed. Our concierge team is now preparing your
              garments for priority doorstep dispatch.
            </p>
          </div>

          {/* Interactive Order Number Pill with Copy Button */}
          <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-[2px] border border-line bg-cream-soft px-4 py-2 text-xs shadow-sm">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted">
              Reference:
            </span>
            <span className="font-mono font-bold uppercase tracking-wider text-ink">
              {order.orderNo}
            </span>
            <button
              type="button"
              onClick={handleCopyOrderNo}
              className="hover:text-ink/70 ml-1 inline-flex items-center gap-1 border-l border-line pl-2.5 font-sans text-[11px] font-semibold text-ink transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Live Order Timeline Progress Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="bg-cream-soft/80 mt-8 border border-line p-5 shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-line pb-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-ink">
              Order Dispatch Tracker
            </span>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />
              Processing
            </span>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {/* Step 1 */}
            <div className="space-y-1.5">
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-cream">
                ✓
              </div>
              <p className="text-[11px] font-bold uppercase leading-tight tracking-wider text-ink">
                Order Placed
              </p>
              <p className="text-[10px] text-muted">Confirmed</p>
            </div>

            {/* Step 2 */}
            <div className="space-y-1.5">
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border-2 border-ink bg-cream text-[11px] font-bold text-ink">
                <span className="h-2 w-2 animate-pulse rounded-full bg-amber-600" />
              </div>
              <p className="text-[11px] font-bold uppercase leading-tight tracking-wider text-ink">
                Phone Verification
              </p>
              <p className="text-[10px] font-medium text-amber-700">Pending Call</p>
            </div>

            {/* Step 3 */}
            <div className="space-y-1.5 opacity-50">
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-line bg-cream text-[11px] text-muted">
                3
              </div>
              <p className="text-[11px] font-medium uppercase leading-tight tracking-wider text-muted">
                Courier Dispatch
              </p>
              <p className="text-[10px] text-muted">Next</p>
            </div>

            {/* Step 4 */}
            <div className="space-y-1.5 opacity-50">
              <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full border border-line bg-cream text-[11px] text-muted">
                4
              </div>
              <p className="text-[11px] font-medium uppercase leading-tight tracking-wider text-muted">
                Doorstep Delivery
              </p>
              <p className="text-[10px] text-muted">Final</p>
            </div>
          </div>
        </motion.div>

        {/* Luxury Digital Receipt Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 border border-line bg-cream-soft p-6 shadow-sm sm:p-10"
        >
          {/* Receipt Top Bar */}
          <div className="flex flex-col items-start justify-between gap-4 border-b border-line pb-6 sm:flex-row sm:items-center">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Recipient &amp; Delivery Destination
              </span>
              <p className="mt-1 text-sm font-bold text-ink">{order.shippingName}</p>
              <p className="font-mono text-xs text-muted">{order.shippingPhone}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted">
                {order.shippingAddress}, {order.shippingArea}, {order.shippingDistrict}
              </p>
            </div>

            <div className="space-y-1 text-left sm:text-right">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                Payment Details
              </span>
              <p className="text-xs font-bold uppercase tracking-wider text-ink">
                Cash on Delivery (COD)
              </p>
              <span className="inline-block rounded-[1px] border border-line bg-cream px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-700">
                ✓ Pay Upon Inspection
              </span>
              <p className="text-[10px] text-muted">{formattedDate}</p>
            </div>
          </div>

          {/* Ordered Garments List */}
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-ink">
                Ordered Pieces ({order.items.length})
              </h2>
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted">
                GH Authentic Garments
              </span>
            </div>

            <div className="divide-y divide-line border-b border-t border-line">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div className="relative h-16 w-14 shrink-0 overflow-hidden border border-line bg-cream shadow-sm">
                      <Image
                        src={item.imageSnapshot || '/images/logo.png'}
                        alt={item.nameSnapshot}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-xs font-bold uppercase tracking-wider text-ink">
                        {item.nameSnapshot}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] uppercase text-muted">
                        {item.sizeSnapshot && (
                          <span className="rounded-[1px] border border-line bg-cream px-1.5 py-0.5 font-mono">
                            Size: {item.sizeSnapshot}
                          </span>
                        )}
                        {item.colorSnapshot && (
                          <span className="rounded-[1px] border border-line bg-cream px-1.5 py-0.5">
                            {item.colorSnapshot}
                          </span>
                        )}
                        <span className="font-semibold text-ink">Qty: {item.qty}</span>
                      </div>
                    </div>
                  </div>

                  <span className="shrink-0 font-mono text-xs font-bold text-ink">
                    {formatPrice(item.priceSnapshot * item.qty)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="mt-6 space-y-2.5 border-b border-line pb-6 text-xs uppercase tracking-wider text-ink">
            <div className="flex justify-between">
              <span className="text-muted">Subtotal</span>
              <span className="font-mono font-medium">{formatPrice(order.subtotal)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted">Courier Delivery Fee</span>
              <span className="font-mono font-medium">
                {order.deliveryCharge === 0 ? 'FREE' : formatPrice(order.deliveryCharge)}
              </span>
            </div>

            <div className="flex items-baseline justify-between border-t border-line pt-3 text-sm font-bold">
              <span>Total Payable on Delivery</span>
              <span className="font-mono text-xl font-extrabold text-ink">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

          {/* Verification Call Reminder Alert Box */}
          <div className="mt-6 flex items-start gap-3 border border-line bg-cream p-4 text-xs">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[1px] bg-ink text-cream">
              <PhoneCall className="h-4 w-4" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold uppercase tracking-wider text-ink">
                Verification Call Reminder
              </h3>
              <p className="text-[11px] leading-relaxed text-muted">
                Our representative will call your mobile number ({order.shippingPhone}) before
                handing over your parcel to the courier rider. Please answer to ensure priority
                dispatch.
              </p>
            </div>
          </div>

          {/* WhatsApp Direct Concierge Card */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 border border-line bg-cream-soft p-4 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-cream">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-ink">
                  Direct WhatsApp Concierge
                </p>
                <p className="text-[11px] text-muted">Have inquiries regarding delivery time?</p>
              </div>
            </div>

            <a
              href={`https://wa.me/${cleanWaNumber}?text=Hello%20Gents%20Hood%2C%20I%20have%20an%20inquiry%20regarding%20my%20order%20${order.orderNo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-wider text-cream transition-opacity hover:opacity-85"
            >
              <span>Chat on WhatsApp</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>

          {/* Action Buttons: Track Order, Continue Shopping, Print */}
          <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href={`/track-order?orderNo=${order.orderNo}`} className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto">
                  <Truck className="mr-2 h-4 w-4" />
                  Track Order
                </Button>
              </Link>

              <Link href="/trending" className="w-full sm:w-auto">
                <Button variant="outline" size="md" className="w-full sm:w-auto">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continue Shopping
                </Button>
              </Link>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted transition-colors hover:text-ink"
            >
              <Printer className="h-4 w-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
