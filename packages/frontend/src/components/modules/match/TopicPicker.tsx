import { TOPICS, type TopicId } from '@/constants/topics';

type Props = {
  selected: TopicId;
  onSelect: (id: TopicId) => void;
};

export default function TopicPicker({ selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {TOPICS.map((topic) => (
        <button
          key={topic.id}
          type="button"
          onClick={() => onSelect(topic.id)}
          className={`rounded-2xl px-4 py-3 text-left text-sm font-bold transition ${
            selected === topic.id
              ? 'bg-brand text-white shadow-sm ring-2 ring-brand/30'
              : 'bg-white text-ink/80 hover:bg-ink/5'
          }`}
        >
          <span className="mr-2">{topic.emoji}</span>
          {topic.label}
        </button>
      ))}
    </div>
  );
}
