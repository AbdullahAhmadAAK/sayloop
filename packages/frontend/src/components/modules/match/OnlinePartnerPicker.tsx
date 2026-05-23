import type { PartnerUser } from '@/types';
import Avatar from '@/components/ui/Avatar';

type Props = {
  users: PartnerUser[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRefresh: () => void;
  loading?: boolean;
};

export default function OnlinePartnerPicker({
  users,
  selectedId,
  onSelect,
  onRefresh,
  loading,
}: Props) {
  if (users.length === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-ink/15 bg-white p-6 text-center">
        <span className="text-4xl">👥</span>
        <p className="mt-3 text-lg font-extrabold text-ink">No one online yet</p>
        <p className="mt-2 text-sm leading-relaxed text-ink/55">
          Ask your friend to sign in and open SayLoop in another browser (incognito works).
          Keep both tabs open — they will show up here within a few seconds.
        </p>
        <button
          type="button"
          onClick={onRefresh}
          className="mt-4 text-sm font-bold text-brand underline"
        >
          Refresh list
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/45">
          Tap someone to challenge
        </p>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="text-xs font-bold text-brand hover:underline disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : '↻ Refresh'}
        </button>
      </div>

      <ul className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
        {users.map((user) => {
          const selected = user.id === selectedId;
          return (
            <li key={user.id}>
              <button
                type="button"
                onClick={() => onSelect(user.id)}
                className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left transition ${
                  selected
                    ? 'border-brand bg-brand/10 shadow-md ring-2 ring-brand/30'
                    : 'border-transparent bg-white hover:border-ink/10 hover:bg-cream'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar src={user.avatarUrl} alt={user.nickname} size="md" ring={selected} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-extrabold text-ink">{user.nickname}</p>
                  <p className="text-xs text-ink/55">
                    Lv.{user.level} · {user.levelTitle} · 🔥 {user.streak}
                  </p>
                </div>
                {selected ? (
                  <span className="shrink-0 rounded-full bg-brand px-2.5 py-1 text-[10px] font-bold text-white">
                    Selected
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-bold text-ink/35">Tap</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
