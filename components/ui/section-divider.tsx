/**
 * Subtle section divider: a thin gold line with a center diamond.
 * Use to mark transitions between major sections on the same background.
 */
export function SectionDivider({
  variant = 'light',
  className = '',
}: {
  variant?: 'light' | 'dark';
  className?: string;
}) {
  const isDark = variant === 'dark';
  const lineColor = isDark ? 'bg-cream/15' : 'bg-teak/15';
  const dotColor = isDark ? 'bg-gold' : 'bg-gold-deep';

  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      <span className={`h-px w-32 ${lineColor}`} aria-hidden="true" />
      <span className={`h-1.5 w-1.5 rotate-45 ${dotColor}`} aria-hidden="true" />
      <span className={`h-px w-32 ${lineColor}`} aria-hidden="true" />
    </div>
  );
}
