import { Link } from 'react-router-dom';
import type { SessionResult } from '@/types';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getTopic } from '@/constants/topics';

type Props = {
  result: SessionResult;
};

function headline(outcome: SessionResult['outcome']) {
  switch (outcome) {
    case 'WIN':
      return { emoji: '🏆', title: 'You won!' };
    case 'LOSS':
      return { emoji: '💪', title: 'Good effort' };
    case 'DRAW':
      return { emoji: '🤝', title: 'Draw agreed' };
    case 'COMPLETE':
      return { emoji: '🎉', title: 'Session complete!' };
    default:
      return { emoji: '✨', title: 'Debate finished' };
  }
}

export default function ResultScreen({ result }: Props) {
  const topic = getTopic(result.topic);
  const { emoji, title } = headline(result.outcome);
  const xpPositive = result.xpEarned >= 0;

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8 text-center animate-fade-in-up">
      <span className="text-6xl">{emoji}</span>
      <h2 className="mt-4 text-3xl font-extrabold text-ink">{title}</h2>
      <p className="mt-2 text-ink/60">vs {result.partnerName}</p>

      <p
        className={`mt-6 text-4xl font-extrabold ${
          xpPositive ? 'text-brand' : 'text-red-600'
        }`}
      >
        {xpPositive ? '+' : ''}
        {result.xpEarned} XP
      </p>

      <div className="mt-6 w-full rounded-2xl bg-white p-4 text-left shadow-sm">
        <Badge tone="neutral">
          {topic?.emoji} {topic?.label}
        </Badge>
        <p className="mt-3 text-sm text-ink/70">{topic?.prompt}</p>
      </div>

      <Link to="/home" className="mt-8 w-full">
        <Button fullWidth>Back to home</Button>
      </Link>
      <Link to="/match" className="mt-2 w-full">
        <Button variant="secondary" fullWidth>
          Challenge someone else
        </Button>
      </Link>
    </div>
  );
}
