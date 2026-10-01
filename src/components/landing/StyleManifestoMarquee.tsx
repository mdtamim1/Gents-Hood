import React from 'react';

/**
 * Clean & Standard Style Manifesto Marquee
 * Features clean, high-contrast, luxury editorial typography without excessive glow or visual clutter.
 */
interface StyleManifestoMarqueeProps {
  line1?: string | null;
  line2?: string | null;
}

function parseManifestoLine(text: string | null | undefined, defaultPrimary: string, defaultSecondary: string) {
  if (!text || !text.trim()) return { primary: defaultPrimary, secondary: defaultSecondary };
  const words = text.trim().split(/\s+/);
  if (words.length <= 1) return { primary: words[0], secondary: '' };
  const splitIndex = Math.min(2, Math.max(1, Math.floor(words.length / 2)));
  return {
    primary: words.slice(0, splitIndex).join(' '),
    secondary: words.slice(splitIndex).join(' '),
  };
}

export function StyleManifestoMarquee({ line1, line2 }: StyleManifestoMarqueeProps) {
  const itemOne = parseManifestoLine(line1, 'Signature Style', 'for Modern Men.');
  const itemTwo = parseManifestoLine(line2, 'Everyday Style,', 'Made Exceptional.');

  const lineOneItems = [itemOne, itemOne, itemOne, itemOne];
  const lineTwoItems = [itemTwo, itemTwo, itemTwo, itemTwo];

  return (
    <section
      aria-label="Style Manifesto"
      className="relative w-full select-none overflow-hidden border-b border-t border-white/[0.08] bg-[#0A0708] py-8 sm:py-12 md:py-14"
    >
      {/* Top golden hairline accent */}
      <div className="pointer-events-none absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/35 to-transparent" />

      {/* Atmospheric center ambient glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(74,14,23,0.32),transparent_75%)]" />

      {/* Screen-reader accessible announcement */}
      <div className="sr-only">
        <p>Signature Style for Modern Men. Everyday Style, Made Exceptional.</p>
      </div>

      {/* Subtle edge fade masks for smooth entrance/exit */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 w-12 bg-gradient-to-r from-[#0A0708] to-transparent sm:w-24 md:w-36"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 w-12 bg-gradient-to-l from-[#0A0708] to-transparent sm:w-24 md:w-36"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col space-y-4 sm:space-y-6">
        {/* ── ROW 1: Slides Left ── */}
        <div className="group relative flex overflow-hidden">
          <div className="animate-marquee-ticker flex shrink-0 [animation-duration:34s]">
            {/* Set A */}
            <div className="flex shrink-0 items-center">
              {lineOneItems.map((item, idx) => (
                <div key={`row1-a-${idx}`} className="flex shrink-0 items-center">
                  <span className="whitespace-nowrap px-3 font-cinzel text-xl font-bold uppercase tracking-[0.12em] sm:px-6 sm:text-2xl sm:tracking-[0.16em] md:text-3xl lg:text-4xl xl:text-5xl">
                    <span className="text-[#FFFFF3]">{item.primary} </span>
                    <span className="text-[#C5A880]">{item.secondary}</span>
                  </span>
                  <span
                    className="mx-4 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-[#C5A880]/85 shadow-[0_0_6px_rgba(197,168,128,0.4)] sm:mx-7 sm:h-2 sm:w-2"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>

            {/* Set B (Identical clone for seamless continuous infinite loop) */}
            <div className="flex shrink-0 items-center" aria-hidden="true">
              {lineOneItems.map((item, idx) => (
                <div key={`row1-b-${idx}`} className="flex shrink-0 items-center">
                  <span className="whitespace-nowrap px-3 font-cinzel text-xl font-bold uppercase tracking-[0.12em] sm:px-6 sm:text-2xl sm:tracking-[0.16em] md:text-3xl lg:text-4xl xl:text-5xl">
                    <span className="text-[#FFFFF3]">{item.primary} </span>
                    <span className="text-[#C5A880]">{item.secondary}</span>
                  </span>
                  <span
                    className="mx-4 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-[#C5A880]/85 shadow-[0_0_6px_rgba(197,168,128,0.4)] sm:mx-7 sm:h-2 sm:w-2"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── ROW 2: Slides Right (Reverse) ── */}
        <div className="group relative flex overflow-hidden">
          <div className="animate-marquee-reverse flex shrink-0 [animation-duration:30s]">
            {/* Set A */}
            <div className="flex shrink-0 items-center">
              {lineTwoItems.map((item, idx) => (
                <div key={`row2-a-${idx}`} className="flex shrink-0 items-center">
                  <span className="whitespace-nowrap px-3 font-cinzel text-xl font-bold uppercase tracking-[0.12em] sm:px-6 sm:text-2xl sm:tracking-[0.16em] md:text-3xl lg:text-4xl xl:text-5xl">
                    <span className="text-[#C5A880]">{item.primary} </span>
                    <span className="text-[#FFFFF3]">{item.secondary}</span>
                  </span>
                  <span
                    className="mx-4 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-[#C5A880]/85 shadow-[0_0_6px_rgba(197,168,128,0.4)] sm:mx-7 sm:h-2 sm:w-2"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>

            {/* Set B (Identical clone for seamless continuous infinite loop) */}
            <div className="flex shrink-0 items-center" aria-hidden="true">
              {lineTwoItems.map((item, idx) => (
                <div key={`row2-b-${idx}`} className="flex shrink-0 items-center">
                  <span className="whitespace-nowrap px-3 font-cinzel text-xl font-bold uppercase tracking-[0.12em] sm:px-6 sm:text-2xl sm:tracking-[0.16em] md:text-3xl lg:text-4xl xl:text-5xl">
                    <span className="text-[#C5A880]">{item.primary} </span>
                    <span className="text-[#FFFFF3]">{item.secondary}</span>
                  </span>
                  <span
                    className="mx-4 inline-block h-1.5 w-1.5 shrink-0 rotate-45 bg-[#C5A880]/85 shadow-[0_0_6px_rgba(197,168,128,0.4)] sm:mx-7 sm:h-2 sm:w-2"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
