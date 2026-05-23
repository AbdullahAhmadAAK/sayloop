import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SignOutButton, useUser } from '@clerk/react';
import Avatar from '@/components/ui/Avatar';
import { getDisplayName } from '@/hooks/useOnboardingComplete';
import { useUserAvatar } from '@/hooks/useUserAvatar';

type Props = {
  compact?: boolean;
};

export default function AppUserMenu({ compact }: Props) {
  const { user } = useUser();
  const avatarUrl = useUserAvatar();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const name = getDisplayName(user);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-2xl p-1 transition hover:bg-ink/5"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar src={avatarUrl} alt={name} size={compact ? 'sm' : 'md'} ring />
        {!compact && (
          <span className="max-w-[100px] truncate text-sm font-bold text-ink">{name}</span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute bottom-full right-0 z-50 mb-2 w-48 overflow-hidden rounded-2xl border border-ink/10 bg-white py-1 shadow-xl lg:bottom-auto lg:top-full lg:mt-2"
        >
          <Link
            to="/profile"
            role="menuitem"
            className="block px-4 py-2.5 text-sm font-bold text-ink hover:bg-cream"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            to="/home"
            role="menuitem"
            className="block px-4 py-2.5 text-sm font-bold text-ink hover:bg-cream"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>
          <SignOutButton>
            <button
              type="button"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left text-sm font-bold text-brand hover:bg-brand/5"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      )}
    </div>
  );
}
