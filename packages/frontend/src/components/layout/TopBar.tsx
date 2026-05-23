import Logo from '@/components/ui/Logo';
import ClerkAuthControls from '@/components/auth/ClerkAuthControls';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { Link } from 'react-router-dom';

type Props = {
  onMenuOpen: () => void;
  title?: string;
};

export default function TopBar({ onMenuOpen, title }: Props) {
  const pending = useAppSelector((s) => s.match.pendingRequestCount);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink/10 bg-cream/95 px-4 py-3 backdrop-blur lg:hidden">
      <button
        type="button"
        onClick={onMenuOpen}
        className="rounded-xl p-2 text-xl hover:bg-ink/5"
        aria-label="Open menu"
      >
        ☰
      </button>
      {title ? (
        <h1 className="text-sm font-extrabold text-ink">{title}</h1>
      ) : (
        <Logo variant="icon" />
      )}
      <div className="flex items-center gap-2">
        <Link
          to="/match"
          className="relative rounded-xl p-2 hover:bg-ink/5"
          aria-label="Match requests"
        >
          🎯
          {pending > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
              {pending}
            </span>
          )}
        </Link>
        <ClerkAuthControls compact signUpLabel="Join" />
      </div>
    </header>
  );
}
