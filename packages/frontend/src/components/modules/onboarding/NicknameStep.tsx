import { useEffect, useState } from 'react';
import Button from '@/components/ui/Button';
import { fetchNicknameSuggestions } from '@/lib/api';

type Props = {
  firstName: string;
  lastName?: string;
  value: string;
  onChange: (nickname: string) => void;
  onNext: () => void;
  onBack?: () => void;
};

export default function NicknameStep({
  firstName,
  lastName,
  value,
  onChange,
  onNext,
  onBack,
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchNicknameSuggestions(firstName, lastName);
        if (!cancelled) {
          setSuggestions(data.suggestions);
          if (!value && data.suggestions[0]) onChange(data.suggestions[0]);
        }
      } catch {
        if (!cancelled) {
          setSuggestions(['DebateFox', 'TalkSpark', 'FluentWave', 'LoopNova', 'SayStar']);
          if (!value) onChange('DebateFox');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [firstName, lastName]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Pick a debate name</h1>
      <p className="mt-2 text-sm text-ink/60">
        AI suggests playful names inspired by &ldquo;{firstName}&rdquo; — gender-neutral and
        safe to share.
      </p>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16))}
        placeholder="Your nickname"
        className="mt-5 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 font-bold text-ink outline-none focus:border-brand"
      />

      {!loading && suggestions.length > 0 && (
        <p className="mt-2 text-xs text-ink/45">Tap a suggestion or type your own</p>
      )}

      <div className="mt-4 flex min-h-[80px] flex-wrap gap-2">
        {loading
          ? [...Array(5)].map((_, i) => (
              <div key={i} className="h-9 w-24 shimmer-bg rounded-full" />
            ))
          : suggestions.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                  value === n ? 'bg-brand text-white' : 'bg-cream text-ink hover:bg-brand/10'
                }`}
              >
                {n}
              </button>
            ))}
      </div>

      <div className="mt-8 flex gap-2">
        {onBack && (
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
        )}
        <Button fullWidth disabled={!value.trim() || value.length < 2} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
