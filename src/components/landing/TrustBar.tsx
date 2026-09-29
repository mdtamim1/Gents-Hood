import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Lock } from 'lucide-react';

interface TrustItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: <Truck className="h-6 w-6 stroke-[1.25] text-ink" />,
    title: 'FAST DELIVERY',
    description: 'Quick & safe delivery nationwide',
  },
  {
    icon: <RotateCcw className="h-6 w-6 stroke-[1.25] text-ink" />,
    title: 'EASY RETURNS',
    description: 'Hassle-free within 7 days',
  },
  {
    icon: <ShieldCheck className="h-6 w-6 stroke-[1.25] text-ink" />,
    title: 'QUALITY ASSURED',
    description: 'Best menswear, tailored precision',
  },
  {
    icon: <Lock className="h-6 w-6 stroke-[1.25] text-ink" />,
    title: 'SECURE PAYMENT',
    description: 'Cash on delivery across BD',
  },
];

export function TrustBar() {
  return (
    <section
      aria-label="Trust & Guarantees"
      className="w-full border-b border-line bg-cream py-12 sm:py-16"
    >
      <div className="mx-auto max-w-[1440px] px-6 sm:px-10 lg:px-14">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex flex-col items-start gap-4 sm:flex-row sm:items-center"
            >
              <div className="flex-shrink-0 rounded-[1px] border border-line bg-cream-soft p-2.5">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                  {item.title}
                </h3>
                <p className="mt-0.5 text-[11px] leading-tight text-muted">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
