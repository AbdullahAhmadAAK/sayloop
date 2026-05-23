import PageShell from '@/components/layout/PageShell';
import PageHeader from '@/components/ui/PageHeader';
import Avatar from '@/components/ui/Avatar';
import { useAppSelector } from '@/hooks/useAppDispatch';

const leaders = [
  { rank: 1, name: 'Elena', xp: 420, avatar: 'Elena' },
  { rank: 2, name: 'Kenji', xp: 380, avatar: 'Kenji' },
  { rank: 3, name: 'Maya', xp: 310, avatar: 'Maya' },
  { rank: 4, name: 'You', xp: 180, avatar: 'You', isUser: true },
  { rank: 5, name: 'Omar', xp: 165, avatar: 'Omar' },
];

export default function LeaderboardPage() {
  const { xpThisWeek } = useAppSelector((s) => s.economy);
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <PageShell title="Leaderboard">
      <div className="mx-auto max-w-lg animate-fade-in-up">
        <PageHeader title="Leaderboard" subtitle="Weekly rankings · resets every Monday" />

        <div className="mb-8 flex items-end justify-center gap-2 sm:gap-4">
          {[top3[1], top3[0], top3[2]].map((user, i) => {
            if (!user) return null;
            const heights = ['h-24', 'h-32', 'h-20'];
            const order = i === 1 ? 2 : i === 0 ? 1 : 3;
            return (
              <div
                key={user.rank}
                className={`flex flex-col items-center ${i === 1 ? 'order-2' : i === 0 ? 'order-1' : 'order-3'}`}
              >
                <Avatar
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                  alt={user.name}
                  size={i === 1 ? 'lg' : 'md'}
                />
                <p className="mt-2 text-sm font-extrabold text-ink">{user.name}</p>
                <p className="text-xs font-bold text-brand">{user.xp} XP</p>
                <div
                  className={`mt-2 w-16 rounded-t-xl bg-brand/20 sm:w-20 ${heights[i]}`}
                  style={{ opacity: 0.4 + order * 0.15 }}
                />
                <span className="mt-1 text-lg font-extrabold text-gold">#{user.rank}</span>
              </div>
            );
          })}
        </div>

        <ul className="space-y-2">
          {rest.map((user) => (
            <li
              key={user.rank}
              className={`flex items-center gap-3 rounded-2xl p-4 ${
                user.isUser ? 'bg-brand/10 ring-2 ring-brand' : 'bg-white shadow-sm'
              }`}
            >
              <span className="w-6 text-center font-extrabold text-ink/40">#{user.rank}</span>
              <Avatar
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.avatar}`}
                alt={user.name}
                size="sm"
              />
              <span className="flex-1 font-bold text-ink">{user.name}</span>
              <span className="font-bold text-brand">{user.xp} XP</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-sm text-ink/50">
          Your rank · <strong className="text-brand">{xpThisWeek} XP</strong> this week
        </p>
      </div>
    </PageShell>
  );
}
