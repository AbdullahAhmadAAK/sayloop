import Button from '@/components/ui/Button';
import { TOPICS, type TopicId } from '@/constants/topics';

type Props = {
  interests: TopicId[];
  onToggle: (id: TopicId) => void;
  onFinish: () => void;
  onBack: () => void;
  saving: boolean;
};

export default function TopicsStep({
  interests,
  onToggle,
  onFinish,
  onBack,
  saving,
}: Props) {
  return (
    <div>
      <h1 className="text-2xl font-extrabold text-ink">Topic preferences</h1>
      <p className="mt-2 text-sm text-ink/60">
        Select at least 2 topics you&apos;d like to debate. We&apos;ll prioritize these when
        matching.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onToggle(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition ${
              interests.includes(t.id) ? 'bg-brand text-white' : 'bg-cream text-ink hover:bg-brand/10'
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <p className="mt-4 text-center text-xs text-ink/45">
        {interests.length} selected · minimum 2
      </p>

      <div className="mt-8 flex gap-2">
        <Button variant="secondary" onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button
          fullWidth
          disabled={interests.length < 2 || saving}
          onClick={onFinish}
        >
          {saving ? 'Saving…' : 'Start debating'}
        </Button>
      </div>
    </div>
  );
}
