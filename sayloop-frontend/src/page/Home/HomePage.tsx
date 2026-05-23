import { Link } from 'react-router-dom';
import { useUser } from '@clerk/react';
import PageShell from '@/components/layout/PageShell';
import Badge from '@/components/ui/Badge';
import { getDisplayName } from '@/hooks/useOnboardingComplete';
import { useAppSelector } from '@/hooks/useAppDispatch';

const cards = [
  {
    to: '/learn',
    title: 'Continue learning',
    desc: 'Pick up your next lesson',
    emoji: '📖',
    color: 'bg-success/10',
  },
  {
    to: '/match',
    title: 'Find a partner',
    desc: 'Start a live debate now',
    emoji: '🎯',
    color: 'bg-brand/10',
    primary: true,
  },
  {
    to: '/leaderboard',
    title: 'Leaderboard',
    desc: 'See where you rank this week',
    emoji: '🏆',
    color: 'bg-gold/10',
  },
];

export default function HomePage() {
  const { user } = useUser();
  const { streak, xp, levelTitle } = useAppSelector((s) => s.economy);

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
            Welcome back, {getDisplayName(user)} 👋
          </h1>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="gold">🔥 {streak} day streak</Badge>
            <Badge tone="brand">{xp} XP</Badge>
            <Badge tone="neutral">{levelTitle}</Badge>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {cards.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={`group rounded-3xl p-6 transition hover:shadow-md ${card.color} ${
                card.primary ? 'sm:col-span-2' : ''
              }`}
            >
              <span className="text-3xl">{card.emoji}</span>
              <h2 className="mt-3 text-lg font-extrabold text-ink group-hover:text-brand">
                {card.title}
              </h2>
              <p className="text-sm text-ink/60">{card.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
