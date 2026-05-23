import type { ReactNode } from 'react';
import Logo from '@/components/ui/Logo';

const STEP_LABELS = ['Account', 'Nickname', 'Avatar', 'Topics'];

type Props = {
  step: number;
  children: ReactNode;
};

export default function OnboardingShell({ step, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 py-10">
      <Logo className="mb-6 h-9" />
      <div className="w-full max-w-lg rounded-3xl border border-ink/[0.06] bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-2 flex justify-between text-[10px] font-bold uppercase tracking-wide text-ink/40">
          {STEP_LABELS.map((label, i) => (
            <span key={label} className={i === step ? 'text-brand' : ''}>
              {label}
            </span>
          ))}
        </div>
        <div className="mb-8 flex gap-2">
          {STEP_LABELS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition ${i <= step ? 'bg-brand' : 'bg-ink/10'}`}
            />
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}
