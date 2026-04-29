import type { ReactNode } from 'react';

type Variant = 'light' | 'dark';

/**
 * Section eyebrow: golden hairline + uppercase label.
 * Larger and more present than the previous version, but still
 * graceful (no pills, no boxes).
 */
export function Eyebrow({
  children,
  variant = 'light',
  className = '',
}: {
  children: ReactNode;
  /** light = on cream/paper backgrounds; dark = on teak-deep backgrounds */
  variant?: Variant;
  className?: string;
}) {
  const isDark = variant === 'dark';

  return (
    <div
      className={`flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] sm:text-[12px] ${
        isDark ? 'text-gold' : 'text-gold-deep'
      } ${className}`}
    >
      <span
        className={`h-px w-9 sm:w-12 ${isDark ? 'bg-gold' : 'bg-gold-deep'}`}
        aria-hidden="true"
      />
      <span>{children}</span>
    </div>
  );
}
