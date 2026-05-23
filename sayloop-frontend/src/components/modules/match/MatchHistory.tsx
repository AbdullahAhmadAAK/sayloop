import type { MatchRequest } from '@/types';
import { getTopic } from '@/constants/topics';
import Avatar from '@/components/ui/Avatar';
import Badge from '@/components/ui/Badge';

type Props = {
  history: MatchRequest[];
};

export default function MatchHistory({ history }: Props) {
  if (history.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-ink/50">
        Completed matches will appear here.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {history.map((item) => {
        const topic = getTopic(item.topic);
        return (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <Avatar src={item.requester.avatarUrl} alt={item.requester.nickname} size="sm" />
              <div>
                <p className="font-bold text-ink">{item.requester.nickname}</p>
                <p className="text-xs text-ink/50">
                  {topic?.label} · {new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <Badge tone={item.status === 'ACCEPTED' ? 'success' : 'neutral'}>
              {item.status}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
}
