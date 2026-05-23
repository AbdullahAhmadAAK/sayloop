import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

const bullets = [
  {
    title: 'People with the same urge',
    desc: 'Match with learners who also want real conversation — not passive scrolling.',
  },
  {
    title: 'Topics that start the talk',
    desc: 'Every session has a debate prompt so you never sit in awkward silence.',
  },
  {
    title: 'Five minutes, full focus',
    desc: 'Short voice sessions fit your day. Show up, speak, earn XP, come back tomorrow.',
  },
];

export default function Solution() {
  return (
    <section id="why" className="py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-brand">
            Why SayLoop exists
          </p>
          <h2 className="font-display mt-3 text-3xl font-extrabold text-ink sm:text-4xl">
            A platform built for the communication gap
          </h2>
          <p className="mt-4 text-lg text-ink/70">
            SayLoop isn’t another vocabulary app. It’s where you meet someone who{' '}
            <strong className="text-ink">wants to be heard and understood</strong> — just
            like you — and practice together in live, low-pressure debates.
          </p>
          <ul className="mt-8 space-y-5">
            {bullets.map((b) => (
              <li key={b.title} className="flex gap-4">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                  ✓
                </span>
                <div>
                  <p className="font-bold text-ink">{b.title}</p>
                  <p className="text-sm text-ink/60">{b.desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link to="/onboarding" className="mt-8 inline-block">
            <Button size="lg">Find your first partner</Button>
          </Link>
        </div>

        <div className="rounded-3xl bg-gradient-to-br from-brand/15 via-cream to-success/10 p-8 shadow-sm">
          <blockquote className="text-lg font-semibold leading-relaxed text-ink">
            &ldquo;I finally talk out loud every day — not because I forced myself, but
            because someone else was waiting on the other side.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm font-bold text-brand">— The loop we’re building</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/80 p-4 text-center">
              <p className="text-2xl font-extrabold text-brand">Same goal</p>
              <p className="text-xs text-ink/55">Improve speaking together</p>
            </div>
            <div className="rounded-2xl bg-white/80 p-4 text-center">
              <p className="text-2xl font-extrabold text-brand">Same energy</p>
              <p className="text-xs text-ink/55">Mutual motivation</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
