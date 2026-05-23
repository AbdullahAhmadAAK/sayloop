import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function CTA() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-ink px-8 py-14 text-center text-cream sm:px-16">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">
            Someone out there wants to practice too
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-cream/75">
            You don’t need more flashcards. You need a partner, a prompt, and five
            minutes. That’s the loop.
          </p>
          <Link to="/onboarding" className="mt-8 inline-block">
            <Button size="lg" className="!bg-brand !text-white hover:!bg-brand-dark">
              Continue with Google
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
