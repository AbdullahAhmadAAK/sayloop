import { NavLink } from 'react-router-dom';
import { UserButton } from '@clerk/react';
import Logo from '@/components/ui/Logo';
import Badge from '@/components/ui/Badge';
import { clerkAppearance } from '@/components/auth/ClerkAuthControls';
import { useAppSelector } from '@/hooks/useAppDispatch';

const links = [
  { to: '/home', label: 'Home', icon: '🏠' },
  { to: '/learn', label: 'Learn', icon: '📖' },
  { to: '/match', label: 'Match', icon: '🎯', badge: true },
  { to: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { to: '/quests', label: 'Quests', icon: '⚡' },
  { to: '/shop', label: 'Shop', icon: '💎' },
  { to: '/profile', label: 'Profile', icon: '👤' },
];

export default function Sidebar() {
  const { streak, xp, levelTitle } = useAppSelector((s) => s.economy);
  const pending = useAppSelector((s) => s.match.pendingRequestCount);

  return (
    <aside className="hidden h-full w-56 shrink-0 flex-col border-r border-ink/10 bg-white/60 p-4 lg:flex xl:w-60">
      <NavLink to="/home" className="mb-8 flex items-center gap-2 px-2">
        <Logo variant="icon" />
        <span className="sr-only">SayLoop home</span>
      </NavLink>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition ${
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink/70 hover:bg-ink/5 hover:text-ink'
              }`
            }
          >
            <span className="text-lg" aria-hidden>
              {link.icon}
            </span>
            {link.label}
            {link.badge && pending > 0 && (
              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-extrabold text-brand">
                {pending}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-2xl bg-cream p-3">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-ink/60">Streak</span>
            <Badge tone="gold">🔥 {streak} days</Badge>
          </div>
          <div className="mt-1 text-xs text-ink/60">
            <span className="font-bold text-ink">{xp} XP</span> · {levelTitle}
          </div>
        </div>
        <div className="flex justify-center">
          <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
        </div>
      </div>
    </aside>
  );
}
