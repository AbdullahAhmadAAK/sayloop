import { Link } from 'react-router-dom';
import { useUser } from '@clerk/react';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import AppCard from '@/components/ui/AppCard';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { getDisplayName } from '@/hooks/useOnboardingComplete';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useAppSelector } from '@/hooks/useAppDispatch';

const actions = [
  {
    to: '/match',
    title: 'Challenge someone',
    desc: 'Pick a topic and debate live with a partner',
    emoji: '🎯',
    accent: 'from-brand/20 to-brand/5',
    featured: true,
  },
  {
    to: '/learn',
    title: 'Continue learning',
    desc: 'Lessons and speaking drills',
    emoji: '📖',
    accent: 'from-success/15 to-cream',
  },
  {
    to: '/leaderboard',
    title: 'Leaderboard',
    desc: 'See who leads this week',
    emoji: '🏆',
    accent: 'from-gold/20 to-cream',
  },
];

export default function HomePage() {
  const { user } = useUser();
  const avatarUrl = useUserAvatar();
  const { streak, xp, levelTitle, level } = useAppSelector((s) => s.economy);
  const pending = useAppSelector((s) => s.match.pendingRequestCount);

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl animate-fade-in-up">
        <div className="mb-8 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-brand/15 via-white to-cream p-5 shadow-sm sm:p-6">
          <Avatar src={avatarUrl} alt={getDisplayName(user)} size="lg" ring />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-wide text-ink/45">Welcome back</p>
            <h1 className="font-display truncate text-xl font-extrabold text-ink sm:text-2xl">
              {getDisplayName(user)} 👋
            </h1>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge tone="gold">🔥 {streak} day streak</Badge>
              <Badge tone="brand">{xp} XP</Badge>
              <Badge tone="neutral">Lv.{level} · {levelTitle}</Badge>
            </div>
          </div>
        </div>

        {pending > 0 && (
          <AppCard to="/match" className="mb-6 !border-brand/25 !bg-brand/5">
            <p className="text-sm font-extrabold text-brand">
              ♟️ {pending} duel invite{pending > 1 ? 's' : ''} waiting — tap to respond
            </p>
          </AppCard>
        )}

        <PageHeader
          title="What’s next?"
          subtitle="Speak with confidence — one debate at a time."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {actions.map((card) => (
            <AppCard
              key={card.to}
              to={card.to}
              className={`bg-gradient-to-br ${card.accent} ${card.featured ? 'sm:col-span-2 sm:flex sm:items-center sm:gap-6' : ''}`}
            >
              <span className={`text-4xl ${card.featured ? 'sm:text-5xl' : ''}`}>{card.emoji}</span>
              <div className={card.featured ? 'sm:flex-1' : ''}>
                <h2 className="mt-3 font-display text-lg font-extrabold text-ink group-hover:text-brand">
                  {card.title}
                </h2>
                <p className="mt-1 text-sm text-ink/55">{card.desc}</p>
              </div>
            </AppCard>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-ink/40">
          SayLoop — learn languages by debating, not drilling alone.
        </p>
      </div>
    </PageShell>
  );
}
