import Button from '@/components/ui/Button';
import { useAppSelector } from '@/hooks/useAppDispatch';

type Props = {
  onRetry?: () => void;
};

export default function MatchmakingScreen({ onRetry }: Props) {
  const { partnerName, waitingForPartner, sessionId } = useAppSelector((s) => s.session);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      <h2 className="mt-6 text-xl font-extrabold text-ink">Entering debate room</h2>
      <p className="mt-2 max-w-sm text-sm text-ink/60">
        {waitingForPartner
          ? `Waiting for ${partnerName || 'your partner'} to open the room…`
          : 'Partner is here — starting camera, mic, and timer…'}
      </p>
      <p className="mt-4 rounded-full bg-brand/10 px-4 py-2 text-xs font-bold text-brand">
        Both players must land on this screen. Timer starts automatically.
      </p>
      {sessionId && onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          Reconnect to room
        </Button>
      )}
    </div>
  );
}
