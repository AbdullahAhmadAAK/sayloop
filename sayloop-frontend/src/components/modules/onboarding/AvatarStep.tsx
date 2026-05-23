import { useState } from 'react';
import Button from '@/components/ui/Button';
import {
  AVATAR_OPTIONS,
  AVATAR_STYLES,
  getAvatarUrlFromOption,
  type AvatarOption,
  type AvatarStyle,
} from '@/constants/avatars';

type Props = {
  selected: AvatarOption | null;
  onSelect: (option: AvatarOption) => void;
  onNext: () => void;
  onBack: () => void;
};

export default function AvatarStep({ selected, onSelect, onNext, onBack }: Props) {
  const [filterStyle, setFilterStyle] = useState<AvatarStyle | 'all'>('all');

  const filtered =
    filterStyle === 'all'
      ? AVATAR_OPTIONS
      : AVATAR_OPTIONS.filter((a) => a.style === filterStyle);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Choose your avatar</h1>
      <p className="mt-2 text-sm text-ink/60">
        Duolingo-style illustrated characters — pick one that feels like you.
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilterStyle('all')}
          className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
            filterStyle === 'all' ? 'bg-brand text-white' : 'bg-cream text-ink'
          }`}
        >
          All
        </button>
        {AVATAR_STYLES.map((s) => (
          <button
            key={s.style}
            type="button"
            onClick={() => setFilterStyle(s.style)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold ${
              filterStyle === s.style ? 'bg-brand text-white' : 'bg-cream text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid max-h-[280px] grid-cols-4 gap-3 overflow-y-auto sm:grid-cols-4">
        {filtered.map((option) => {
          const active = selected?.id === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option)}
              className={`rounded-2xl border-2 p-2 transition ${
                active ? 'border-brand bg-brand/5 ring-2 ring-brand/30' : 'border-ink/10 bg-cream'
              }`}
            >
              <img
                src={getAvatarUrlFromOption(option)}
                alt=""
                className="mx-auto h-14 w-14 rounded-xl bg-cream object-contain"
              />
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-4 flex items-center justify-center gap-3 rounded-2xl bg-cream p-3">
          <img
            src={getAvatarUrlFromOption(selected)}
            alt="Selected avatar"
            className="h-16 w-16 rounded-2xl bg-white"
          />
          <p className="text-sm font-bold text-ink">Looking good!</p>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <Button variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button fullWidth disabled={!selected} onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
