import { NavLink } from 'react-router-dom';

const items = [
  { to: '/home', icon: '🏠', label: 'Home' },
  { to: '/match', icon: '🎯', label: 'Match' },
  { to: '/leaderboard', icon: '🏆', label: 'Ranks' },
  { to: '/profile', icon: '👤', label: 'You' },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex justify-around border-t border-ink/10 bg-white/95 px-2 py-2 backdrop-blur lg:hidden">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[10px] font-bold ${
              isActive ? 'text-brand' : 'text-ink/50'
            }`
          }
        >
          <span className="text-xl">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
