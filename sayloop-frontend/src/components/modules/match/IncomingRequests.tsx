import type { MatchRequest } from '@/types';
import { getTopic } from '@/constants/topics';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

type Props = {
  requests: MatchRequest[];
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
};

export default function IncomingRequests({ requests, onAccept, onReject }: Props) {
  if (requests.length === 0) {
    return (
      <div className="py-12 text-center">
        <span className="text-4xl">📭</span>
        <p className="mt-3 font-bold text-ink">No duel invites</p>
        <p className="mt-1 text-sm text-ink/50">
          When someone challenges you, it also pops up bottom-right on any page.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {requests.map((req) => {
        const topic = getTopic(req.topic);
        return (
          <li
            key={req.id}
            className="overflow-hidden rounded-2xl border border-brand/15 bg-white shadow-sm"
          >
            <div className="bg-brand/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand">
              ♟️ Incoming challenge
            </div>
            <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <Avatar src={req.requester.avatarUrl} alt={req.requester.nickname} ring />
                <div>
                  <p className="font-extrabold text-ink">{req.requester.nickname}</p>
                  <p className="text-sm text-ink/60">
                    {topic?.emoji} {topic?.label}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => onReject(req.id)}>
                  Decline
                </Button>
                <Button size="sm" onClick={() => onAccept(req.id)}>
                  Accept duel
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
