import { useState } from 'react';
import { useUser, SignOutButton } from '@clerk/react';
import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { getDisplayName } from '@/hooks/useOnboardingComplete';
import { useUserAvatar } from '@/hooks/useUserAvatar';
import { useAppSelector } from '@/hooks/useAppDispatch';

type Tab = 'stats' | 'achievements' | 'settings';

export default function ProfilePage() {
  const { user } = useUser();
  const avatarUrl = useUserAvatar();
  const economy = useAppSelector((s) => s.economy);
  const [tab, setTab] = useState<Tab>('stats');

  const meta = user?.unsafeMetadata as {
    learningLanguage?: string;
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stats', label: 'Stats' },
    { id: 'achievements', label: 'Achievements' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <PageShell title="Profile">
      <div className="mx-auto max-w-2xl animate-fade-in-up">
        <PageHeader title="Your profile" subtitle="Stats, achievements, and account" />
        <div className="rounded-3xl border border-ink/[0.06] bg-gradient-to-br from-brand/15 to-white p-6 text-center shadow-sm">
          <Avatar
            src={avatarUrl}
            alt={getDisplayName(user)}
            size="xl"
            ring
          />
          <h1 className="mt-4 text-2xl font-extrabold text-ink">{getDisplayName(user)}</h1>
          <Badge tone="brand">
            Lv.{economy.level} · {economy.levelTitle}
          </Badge>
          <p className="mt-2 text-sm text-ink/60">
            Learning {meta?.learningLanguage || 'English'}
          </p>
        </div>

        <div className="mt-6 flex rounded-2xl bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-xl py-2 text-sm font-bold ${
                tab === t.id ? 'bg-brand text-white' : 'text-ink/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
          {tab === 'stats' && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Total XP', economy.xp],
                ['This week', economy.xpThisWeek],
                ['Streak', `${economy.streak} days`],
                ['Gems', economy.gems],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-cream p-4">
                  <p className="text-xs font-bold text-ink/50">{label}</p>
                  <p className="text-xl font-extrabold text-ink">{value}</p>
                </div>
              ))}
            </div>
          )}
          {tab === 'achievements' && (
            <ul className="space-y-3">
              {[
                { title: 'First debate', done: true },
                { title: '7-day streak', done: economy.streak >= 7 },
                { title: 'Win 10 debates', done: false },
              ].map((a) => (
                <li
                  key={a.title}
                  className={`flex items-center gap-3 rounded-xl p-3 ${a.done ? 'bg-success/10' : 'bg-cream'}`}
                >
                  <span>{a.done ? '✅' : '🔒'}</span>
                  <span className="font-bold text-ink">{a.title}</span>
                </li>
              ))}
            </ul>
          )}
          {tab === 'settings' && (
            <div className="space-y-4">
              <p className="text-sm text-ink/60">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <SignOutButton>
                <Button variant="danger">Sign out</Button>
              </SignOutButton>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
