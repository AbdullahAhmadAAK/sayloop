import type { ReactNode } from 'react';

export default function Badge({
  children,
  tone = 'brand',
}: {
  children: ReactNode;
  tone?: 'brand' | 'gold' | 'success' | 'neutral';
}) {
  const tones = {
    brand: 'bg-brand/10 text-brand',
    gold: 'bg-gold/15 text-gold',
    success: 'bg-success/15 text-success',
    neutral: 'bg-ink/8 text-ink/70',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
