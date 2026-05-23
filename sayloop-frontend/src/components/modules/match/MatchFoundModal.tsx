import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import type { PartnerUser } from '@/types';

type Props = {
  open: boolean;
  partner: PartnerUser;
  partnerReady: boolean;
  myReady?: boolean;
  loading?: boolean;
  onConfirm: () => void;
};

export default function MatchFoundModal({
  open,
  partner,
  partnerReady,
  myReady,
  loading,
  onConfirm,
}: Props) {
  return (
    <Modal open={open} title="Challenge accepted!">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
          ♟️ Match locked in
        </div>
        <Avatar src={partner.avatarUrl} alt={partner.nickname} size="lg" ring />
        <p className="mt-4 text-lg font-extrabold text-ink">{partner.nickname} is your opponent</p>
        <p className="mt-2 text-sm text-ink/60">
          <strong className="text-ink">Both</strong> players must tap &ldquo;Let&apos;s go!&rdquo;
          before the debate room opens. No one enters alone.
        </p>

        <div className="mt-5 w-full space-y-2 rounded-2xl bg-cream p-4 text-left text-sm">
          <ReadyRow label="You" ready={Boolean(myReady)} />
          <ReadyRow label={partner.nickname} ready={partnerReady} />
        </div>

        {myReady && !partnerReady && (
          <p className="mt-4 animate-pulse-soft text-sm font-bold text-brand">
            Waiting for {partner.nickname}…
          </p>
        )}
        {!myReady && partnerReady && (
          <p className="mt-4 text-sm font-bold text-brand">They&apos;re ready — your turn!</p>
        )}
        {myReady && partnerReady && (
          <p className="mt-4 text-sm font-bold text-success">Both ready — starting room…</p>
        )}

        <Button
          className="mt-6"
          fullWidth
          disabled={loading || myReady}
          onClick={onConfirm}
        >
          {loading ? 'Confirming…' : myReady ? "You're ready ✓" : "Let's go!"}
        </Button>
      </div>
    </Modal>
  );
}

function ReadyRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="font-bold text-ink">{label}</span>
      <span
        className={`rounded-full px-3 py-0.5 text-xs font-extrabold ${
          ready ? 'bg-success/15 text-success' : 'bg-ink/10 text-ink/45'
        }`}
      >
        {ready ? 'Ready' : 'Not yet'}
      </span>
    </div>
  );
}
