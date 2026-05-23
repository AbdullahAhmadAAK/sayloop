import Modal from '@/components/ui/Modal';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import type { PartnerUser } from '@/types';

type Props = {
  open: boolean;
  partner: PartnerUser;
  partnerReady: boolean;
  loading?: boolean;
  onConfirm: () => void;
};

export default function MatchFoundModal({
  open,
  partner,
  partnerReady,
  loading,
  onConfirm,
}: Props) {
  return (
    <Modal open={open} title="Match accepted!">
      <div className="flex flex-col items-center text-center">
        <div className="rounded-full bg-success/15 px-3 py-1 text-xs font-bold text-success">
          ♟️ Both players connected
        </div>
        <Avatar src={partner.avatarUrl} alt={partner.nickname} size="lg" ring />
        <p className="mt-4 text-lg font-extrabold text-ink">{partner.nickname} is in</p>
        <p className="mt-2 text-sm text-ink/60">
          Duolingo-style rule: <strong className="text-ink">both</strong> of you must tap ready
          before the 5-minute debate room opens.
        </p>
        {partnerReady ? (
          <p className="mt-3 animate-pulse-soft rounded-full bg-brand/10 px-4 py-2 text-sm font-bold text-brand">
            They&apos;re ready — your turn!
          </p>
        ) : (
          <p className="mt-3 text-xs text-ink/45">Waiting for partner to tap ready…</p>
        )}
        <Button className="mt-6" fullWidth disabled={loading} onClick={onConfirm}>
          {loading ? 'Opening room…' : "I'm ready — let's speak"}
        </Button>
      </div>
    </Modal>
  );
}
