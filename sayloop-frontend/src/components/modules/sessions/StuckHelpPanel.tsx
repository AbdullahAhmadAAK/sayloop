import { useState } from 'react';
import Button from '@/components/ui/Button';
import { fetchStuckPrompts } from '@/lib/api';
import { getTopic, type TopicId } from '@/constants/topics';

type Props = {
  topic: TopicId;
};

export default function StuckHelpPanel({ topic }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [source, setSource] = useState<'gemini' | 'fallback' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const meta = getTopic(topic);

  const handleStuck = async (refresh = false) => {
    setOpen(true);
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStuckPrompts(topic, refresh);
      setPrompts(data.prompts);
      setSource(data.source);
    } catch {
      setError('Could not load hints — is the backend running?');
      setPrompts([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border-t border-ink/10 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-bold text-ink/50">Need a nudge to keep talking?</p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading}
          onClick={() => handleStuck(false)}
          className="!border-gold/40 !bg-gold/10 !text-ink hover:!bg-gold/20"
        >
          {loading ? 'Thinking…' : "🆘 I'm stuck"}
        </Button>
      </div>

      {open && (
        <div className="mt-4 animate-fade-in-up rounded-2xl border border-gold/30 bg-gradient-to-br from-gold/10 to-cream p-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-extrabold text-ink">Try saying one of these</p>
              <p className="mt-0.5 text-xs text-ink/50">
                {meta?.emoji} {meta?.label}
                {source === 'gemini' && ' · AI hints'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-xs font-bold text-ink/40 hover:bg-white/60"
              aria-label="Close hints"
            >
              ✕
            </button>
          </div>

          {loading && (
            <div className="mt-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 shimmer-bg rounded-xl" />
              ))}
            </div>
          )}

          {error && <p className="mt-3 text-sm font-semibold text-brand">{error}</p>}

          {!loading && !error && prompts.length > 0 && (
            <ul className="mt-3 space-y-2">
              {prompts.map((text, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-white/90 px-3 py-2.5 text-sm font-semibold leading-snug text-ink shadow-sm"
                >
                  <span className="mr-2 text-brand">{i + 1}.</span>
                  {text}
                </li>
              ))}
            </ul>
          )}

          {!loading && prompts.length > 0 && (
            <button
              type="button"
              onClick={() => handleStuck(true)}
              className="mt-3 text-xs font-bold text-brand hover:underline"
            >
              Get 3 new ideas
            </button>
          )}
        </div>
      )}
    </div>
  );
}
