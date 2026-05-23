import { getTopic, type TopicId } from '@/constants/topics';
import StuckHelpPanel from '@/components/modules/sessions/StuckHelpPanel';

type Props = {
  topic: TopicId;
  timerSeconds: number;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ConversationPanel({ topic, timerSeconds }: Props) {
  const meta = getTopic(topic);

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase text-brand">Debate topic</p>
          <p className="font-extrabold text-ink">
            {meta?.emoji} {meta?.label}
          </p>
        </div>
        <div
          className={`rounded-2xl px-4 py-2 text-center font-mono text-2xl font-extrabold ${
            timerSeconds <= 30 ? 'bg-brand text-white' : 'bg-cream text-ink'
          }`}
        >
          {formatTime(timerSeconds)}
        </div>
      </div>
      <p className="mt-4 rounded-xl bg-cream p-4 text-sm font-semibold text-ink/80">
        {meta?.prompt}
      </p>
      <div className="mt-4 flex justify-center gap-1">
        {[...Array(12)].map((_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-brand/50 animate-pulse-soft"
            style={{
              height: `${12 + (i % 4) * 8}px`,
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>

      <StuckHelpPanel topic={topic} />
    </div>
  );
}
