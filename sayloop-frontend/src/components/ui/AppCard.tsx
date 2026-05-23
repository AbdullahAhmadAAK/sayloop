import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  children: ReactNode;
  className?: string;
  to?: string;
  onClick?: () => void;
};

export default function AppCard({ children, className = '', to, onClick }: Props) {
  const base =
    'block rounded-3xl border border-ink/[0.06] bg-white p-5 shadow-sm transition hover:shadow-md ' +
    className;

  if (to) {
    return (
      <Link to={to} className={`group ${base}`}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`group w-full text-left ${base}`}>
        {children}
      </button>
    );
  }

  return <div className={base}>{children}</div>;
}
