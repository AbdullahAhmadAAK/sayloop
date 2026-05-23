import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

type DrawOfferProps = {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DrawOfferModal({ open, loading, onConfirm, onCancel }: DrawOfferProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Offer a draw?">
      <p className="text-center text-sm text-ink/65">
        If your partner accepts, the debate ends as a draw and you both earn <strong>+25 XP</strong>.
      </p>
      <div className="mt-6 flex flex-col gap-2">
        <Button fullWidth disabled={loading} onClick={onConfirm}>
          {loading ? 'Sending…' : 'Yes, offer draw'}
        </Button>
        <Button variant="secondary" fullWidth disabled={loading} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </Modal>
  );
}

type ResignProps = {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ResignModal({ open, loading, onConfirm, onCancel }: ResignProps) {
  return (
    <Modal open={open} onClose={onCancel} title="Resign this debate?">
      <div className="space-y-3 text-center text-sm text-ink/65">
        <p>
          Your opponent wins and gets <strong className="text-brand">+50 XP</strong>.
        </p>
        <p>
          You will lose <strong className="text-red-600">50 XP</strong>. This cannot be undone.
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-2">
        <Button variant="danger" fullWidth disabled={loading} onClick={onConfirm}>
          {loading ? 'Resigning…' : 'Yes, resign'}
        </Button>
        <Button variant="secondary" fullWidth disabled={loading} onClick={onCancel}>
          Keep debating
        </Button>
      </div>
    </Modal>
  );
}
