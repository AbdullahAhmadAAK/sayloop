import Button from '@/components/ui/Button';

type Props = {
  isMuted: boolean;
  isCameraOff: boolean;
  drawOfferPending: boolean;
  drawOfferIncoming: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onOfferDraw: () => void;
  onAcceptDraw: () => void;
  onDeclineDraw: () => void;
  onResign: () => void;
};

export default function ControlBar({
  isMuted,
  isCameraOff,
  drawOfferPending,
  drawOfferIncoming,
  onToggleMute,
  onToggleCamera,
  onOfferDraw,
  onAcceptDraw,
  onDeclineDraw,
  onResign,
}: Props) {
  const mediaBtn =
    'flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg shadow-sm transition hover:bg-cream';

  return (
    <div className="space-y-4">
      {drawOfferIncoming && (
        <div className="rounded-2xl border-2 border-gold/40 bg-gold/10 p-4 text-center">
          <p className="font-extrabold text-ink">Partner offered a draw</p>
          <p className="mt-1 text-sm text-ink/60">Both players get +25 XP</p>
          <div className="mt-3 flex gap-2">
            <Button fullWidth onClick={onAcceptDraw}>
              Accept draw
            </Button>
            <Button variant="secondary" fullWidth onClick={onDeclineDraw}>
              Keep debating
            </Button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          className={mediaBtn}
          onClick={onToggleMute}
          aria-label="Toggle mute"
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🎤'}
        </button>
        <button
          type="button"
          className={mediaBtn}
          onClick={onToggleCamera}
          aria-label="Toggle camera"
          title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
        >
          {isCameraOff ? '📷' : '📹'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          fullWidth
          disabled={drawOfferPending || drawOfferIncoming}
          onClick={onOfferDraw}
          className={drawOfferPending ? 'ring-2 ring-gold' : ''}
        >
          {drawOfferPending ? 'Draw offered…' : 'Offer draw'}
        </Button>
        <Button variant="danger" fullWidth onClick={onResign}>
          Resign
        </Button>
      </div>

      <p className="text-center text-[11px] text-ink/45">
        Finish 1 min: +50 XP each · Draw: +25 each · Resign: +50 win / −50 loss
      </p>
    </div>
  );
}
