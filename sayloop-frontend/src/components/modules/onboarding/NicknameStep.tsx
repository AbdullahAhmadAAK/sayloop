import { useState } from 'react';
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
  const [seed, setSeed] = useState(firstName || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'gemini' | 'fallback' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    const trimmed = seed.trim();
    if (trimmed.length < 2) {
      setError('Type at least 2 letters (e.g. saad)');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const data = await fetchNicknameSuggestions(trimmed, lastName);
      setSuggestions(data.suggestions);
      setSource(data.source);
      if (!value && data.suggestions[0]) onChange(data.suggestions[0]);
    } catch {
      setSuggestions([]);
      setSource('fallback');
      setError('Could not reach AI — check backend is running, or type your own name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold text-ink">Pick a debate name</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">
        Type your name or a word you like, then tap <strong>Suggest</strong> — Gemini will
        create playful nicknames (e.g. Saad → SajaStar).
      </p>

      <label className="mt-6 block text-xs font-bold uppercase tracking-wide text-ink/45">
        Start from
      </label>
      <div className="mt-2 flex gap-2">
        <input
          value={seed}
          onChange={(e) => setSeed(e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 24))}
          onKeyDown={(e) => e.key === 'Enter' && handleSuggest()}
          placeholder="e.g. saad"
          className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-cream px-4 py-3 font-bold text-ink outline-none focus:border-brand"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={loading || seed.trim().length < 2}
          onClick={handleSuggest}
          className="shrink-0 !px-4"
        >
          {loading ? '…' : '✨ Suggest'}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-xs font-semibold text-brand">{error}</p>
      )}

      {source && !loading && (
        <p className="mt-2 text-xs text-ink/45">
          {source === 'gemini' ? 'Powered by Gemini' : 'Offline suggestions'}
        </p>
      )}

      <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-ink/45">
        Your nickname
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9_]/g, '').slice(0, 16))}
        placeholder="Choose or type your own"
        className="mt-2 w-full rounded-xl border border-ink/15 bg-cream px-4 py-3 font-bold text-ink outline-none focus:border-brand"
      />

      <div className="mt-4 flex min-h-[72px] flex-wrap gap-2">
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
                  value === n ? 'bg-brand text-white shadow-sm' : 'bg-cream text-ink hover:bg-brand/10'
                }`}
              >
                {n}
              </button>
            ))}
        {!loading && suggestions.length === 0 && (
          <p className="text-sm text-ink/40">Tap Suggest to see AI nicknames</p>
        )}
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
