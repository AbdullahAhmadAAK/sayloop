import { Link } from 'react-router-dom';
import PageShell from '@/components/layout/PageShell';
import Button from '@/components/ui/Button';

type Props = {
  title: string;
  emoji: string;
  description: string;
};

export default function PlaceholderPage({ title, emoji, description }: Props) {
  return (
    <PageShell title={title}>
      <div className="mx-auto flex max-w-md flex-col items-center py-16 text-center">
        <span className="text-5xl">{emoji}</span>
        <h2 className="mt-4 text-xl font-extrabold text-ink">{title}</h2>
        <p className="mt-2 text-sm text-ink/60">{description}</p>
        <Link to="/match" className="mt-8">
          <Button>Find a partner</Button>
        </Link>
      </div>
    </PageShell>
  );
}
