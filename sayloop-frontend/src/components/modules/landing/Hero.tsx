import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-24">
      <div className="pointer-events-none absolute -right-32 top-20 h-96 w-96 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-success/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
        <div className="animate-fade-in-up">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-brand" />
            Built for real conversation
          </p>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl lg:text-[3.25rem]">
            Stop collecting words.{' '}
            <span className="text-brand">Start using your voice.</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-ink/70">
            SayLoop connects you with people who share the same urge — to communicate
            better, in another language, with confidence. Short live debates. Real
            partners. Clear topics.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/onboarding">
              <Button size="lg">Continue with Google — it&apos;s free</Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="secondary">
                See how it works
              </Button>
            </a>
          </div>
          <p className="mt-4 text-sm text-ink/50">
            No credit card · 1-minute sessions · Match in under a minute
          </p>
        </div>

        <div className="relative mx-auto h-80 w-full max-w-md sm:h-[22rem]">
          <div className="absolute left-0 top-10 w-48 animate-float rounded-3xl border border-ink/5 bg-white p-4 shadow-lg sm:w-52">
            <p className="text-xs font-bold text-brand">Partner found</p>
            <p className="mt-2 text-sm font-semibold text-ink">
              &ldquo;I also want to practice speaking every day.&rdquo;
            </p>
            <div className="mt-3 flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="h-6 w-1 animate-pulse-soft rounded-full bg-brand/60"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
          <div className="absolute right-0 top-0 w-44 animate-float-a rounded-3xl bg-brand p-4 text-white shadow-lg">
            <p className="text-2xl font-extrabold">+25 XP</p>
            <p className="text-sm opacity-90">You spoke 2:40 today</p>
          </div>
          <div className="absolute bottom-4 left-[18%] w-52 animate-float-b rounded-3xl bg-white p-4 shadow-md">
            <p className="text-xs font-bold text-ink/50">Tonight&apos;s topic</p>
            <p className="font-extrabold text-ink">🌍 Travel debates</p>
          </div>
        </div>
      </div>
    </section>
  );
}
