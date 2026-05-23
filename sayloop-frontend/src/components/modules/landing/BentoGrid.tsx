export default function BentoGrid() {
  return (
    <section id="features" className="pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display mb-10 text-center text-3xl font-extrabold text-ink">
          Everything in the product pushes you to speak
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl bg-brand p-6 text-white sm:col-span-2 lg:row-span-2 lg:p-8">
            <p className="text-sm font-bold opacity-80">Core promise</p>
            <h3 className="mt-2 text-2xl font-extrabold lg:text-3xl">
              Humans, not bots. Voice, not typing.
            </h3>
            <p className="mt-3 max-w-md text-sm opacity-90">
              You practice with another person who showed up for the same reason — to
              get better at being understood.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="font-extrabold text-ink">Topic-first matching</h3>
            <p className="mt-2 text-sm text-ink/65">
              Travel, work, daily life — pick what you actually want to talk about.
            </p>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="font-extrabold text-ink">Low-stakes debates</h3>
            <p className="mt-2 text-sm text-ink/65">
              Five minutes lowers anxiety. You always know when it ends.
            </p>
          </div>
          <div className="rounded-3xl bg-success/10 p-6 sm:col-span-2">
            <h3 className="font-extrabold text-success">Habit loops that stick</h3>
            <p className="mt-2 text-sm text-ink/65">
              Streaks, XP, and leaderboards reward showing up — the same psychology that
              makes games addictive, applied to speaking practice.
            </p>
          </div>
          <div className="rounded-3xl bg-gold/10 p-6">
            <h3 className="font-extrabold text-gold">Safe identity</h3>
            <p className="mt-2 text-sm text-ink/65">
              Nickname + avatar — practice without oversharing who you are offline.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
