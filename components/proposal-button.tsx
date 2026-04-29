'use client';

import { ArrowRight } from 'lucide-react';
import { useProposalModal, type ProposalProperty } from './proposal-modal';

interface Props {
  property?: ProposalProperty;
  label: string;
  variant?: 'dark' | 'gold';
  className?: string;
}

export function ProposalButton({ property, label, variant = 'dark', className = '' }: Props) {
  const { open } = useProposalModal();

  const base =
    variant === 'gold'
      ? 'bg-gold text-teak-deep hover:bg-cream hover:shadow-[0_12px_32px_rgba(201,169,97,0.3)]'
      : 'bg-teak-deep text-cream hover:bg-teak-warm';

  return (
    <button
      type="button"
      onClick={() => open(property)}
      className={`group inline-flex items-center gap-2.5 px-7 py-4 text-[11px] font-medium uppercase tracking-[0.18em] transition-all duration-400 hover:-translate-y-px ${base} ${className}`}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" strokeWidth={1.5} />
    </button>
  );
}
