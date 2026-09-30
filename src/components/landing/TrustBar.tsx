import React from 'react';
import { Truck, RotateCcw, ShieldCheck, Lock } from 'lucide-react';

interface TrustItem {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const TRUST_ITEMS: TrustItem[] = [
  {
    icon: <Truck className="h-5 w-5 flex-shrink-0 stroke-[1.25] text-ink sm:h-5 sm:w-5" />,
    title: 'FAST DELIVERY',
    description: 'Quick & safe delivery',
  },
  {
    icon: <RotateCcw className="h-5 w-5 flex-shrink-0 stroke-[1.25] text-ink sm:h-5 sm:w-5" />,
    title: 'EASY RETURNS',
    description: 'Within 15 days',
  },
  {
    icon: <ShieldCheck className="h-5 w-5 flex-shrink-0 stroke-[1.25] text-ink sm:h-5 sm:w-5" />,
    title: 'QUALITY ASSURED',
    description: 'Best fashion, best quality',
  },
  {
    icon: <Lock className="h-5 w-5 flex-shrink-0 stroke-[1.25] text-ink sm:h-5 sm:w-5" />,
    title: 'SECURE PAYMENT',
    description: '100% secure checkout',
  },
];

export function TrustBar() {
  return (
    <section
      aria-label="Trust & Guarantees"
      className="w-full border-y border-line bg-cream py-4 sm:py-5"
    >
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 lg:px-14">
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 sm:grid-cols-4 sm:gap-6 lg:gap-8">
          {TRUST_ITEMS.map((item) => (
            <div key={item.title} className="flex items-center gap-2.5 sm:gap-3">
              {item.icon}
              <div className="min-w-0">
                <h4 className="text-[10px] font-bold uppercase leading-tight tracking-wider text-ink sm:text-xs">
                  {item.title}
                </h4>
                <p className="mt-0.5 truncate text-[9px] leading-tight text-muted sm:text-[10px]">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
