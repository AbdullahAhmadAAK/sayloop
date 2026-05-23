import Button from '@/components/ui/Button';
import { useAppSelector } from '@/hooks/useAppDispatch';

type Props = {
  onRetry?: () => void;
};

export default function MatchmakingScreen({ onRetry }: Props) {
  const { partnerName, waitingForPartner } = useAppSelector((s) => s.session);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center animate-fade-in-up">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      <h2 className="mt-6 font-display text-xl font-extrabold text-ink">Opening debate room</h2>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">
        {waitingForPartner
          ? `Waiting for ${partnerName || 'your partner'} to connect…`
          : `${partnerName || 'Partner'} is here. Starting camera, mic, and timer…`}
      </p>

      <ol className="mt-6 w-full space-y-2 rounded-2xl bg-white p-4 text-left text-sm shadow-sm">
        <li className="flex gap-2">
          <span className="text-brand">✓</span>
          <span>Both players tapped &ldquo;Let&apos;s go!&rdquo;</span>
        </li>
        <li className="flex gap-2">
          <span className={waitingForPartner ? 'text-ink/30' : 'text-brand'}>
            {waitingForPartner ? '○' : '✓'}
          </span>
          <span>Both in the live room</span>
        </li>
        <li className="flex gap-2 text-ink/45">
          <span>○</span>
          <span>1-minute debate timer starts</span>
        </li>
      </ol>

      {onRetry && (
        <Button variant="secondary" className="mt-6" onClick={onRetry}>
          Reconnect
        </Button>
      )}
    </div>
  );
}
