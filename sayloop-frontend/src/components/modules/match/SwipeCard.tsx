import type { PartnerUser } from '@/types';
import { getTopic, type TopicId } from '@/constants/topics';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

type Props = {
  user: PartnerUser;
  topic: TopicId;
  exiting: boolean;
  exitDir: 'left' | 'right';
};

export default function SwipeCard({ user, topic, exiting, exitDir }: Props) {
  const topicMeta = getTopic(topic);

  return (
    <div
      className={`relative mx-auto w-full max-w-sm overflow-hidden rounded-3xl border-2 border-brand/20 bg-white shadow-xl ${
        exiting ? (exitDir === 'left' ? 'card-exit-left' : 'card-exit-right') : ''
      }`}
    >
      <div className="bg-gradient-to-r from-brand to-brand/80 px-4 py-2 text-center text-xs font-bold uppercase tracking-wider text-white">
        Opponent found · Lv.{user.level}
      </div>

      <div className="p-6">
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <Avatar src={user.avatarUrl} alt={user.nickname} size="xl" ring />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-white">
              LIVE
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-ink">{user.nickname}</h2>
          <Badge tone="gold">{user.levelTitle}</Badge>
          <p className="mt-2 text-sm text-ink/60">Practices {user.languages.join(' · ')}</p>

          <div className="mt-4 flex gap-4 text-xs font-extrabold">
            <span className="rounded-full bg-cream px-3 py-1 text-ink">
              🔥 {user.streak} streak
            </span>
            <span className="rounded-full bg-cream px-3 py-1 text-ink">
              ♟️ {user.winRate}% wins
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-dashed border-brand/30 bg-brand/5 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand">
            Debate topic
          </p>
          <p className="mt-1 text-lg font-extrabold text-ink">
            {topicMeta?.emoji} {topicMeta?.label}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink/65">{topicMeta?.prompt}</p>
        </div>
      </div>
    </div>
  );
}
