import { useAppSelector } from '@/hooks/useAppDispatch';

export default function MatchLiveBar() {
  const connected = useAppSelector((s) => s.match.socketConnected);
  const online = useAppSelector((s) => s.match.partners.length);

  return (
    <div className="mb-5 flex flex-wrap items-center justify-center gap-2">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
          connected ? 'bg-success/15 text-success' : 'bg-red-100 text-red-700'
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${connected ? 'animate-pulse-soft bg-success' : 'bg-red-500'}`}
        />
        {connected ? 'Live — connected' : 'Offline — restart backend'}
      </span>
      <span className="rounded-full bg-brand/10 px-3 py-1.5 text-xs font-bold text-brand">
        {online} online now
      </span>
    </div>
  );
}
