import { useEffect, type ReactNode } from 'react';

type Props = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  title?: string;
};

export default function Modal({ open, onClose, children, title }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <button
        type="button"
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="animate-pop relative z-10 w-full max-w-md rounded-3xl bg-cream p-6 shadow-xl">
        {title && (
          <h2 id="modal-title" className="mb-4 text-center text-xl font-extrabold text-ink">
            {title}
          </h2>
        )}
        {children}
      </div>
    </div>
  );
}
