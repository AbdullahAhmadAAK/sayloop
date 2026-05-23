const pains = [
  {
    emoji: '📱',
    title: 'Apps teach words, not voice',
    body: 'You can tap through lessons for hours — but still freeze when it’s time to actually speak.',
  },
  {
    emoji: '😶',
    title: 'No one to practice with',
    body: 'Friends aren’t always free. Tutors cost money. Random chats feel awkward with no structure.',
  },
  {
    emoji: '📉',
    title: 'Progress you can’t measure',
    body: 'Reading scores go up; confidence doesn’t. There’s no clear loop for real conversation reps.',
  },
];

export default function PainPoints() {
  return (
    <section className="border-y border-ink/10 bg-white/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-brand">
          Sound familiar?
        </p>
        <h2 className="font-display mx-auto mt-3 max-w-2xl text-center text-3xl font-extrabold text-ink sm:text-4xl">
          You’re not bad at languages — you’re under-practiced at speaking
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-ink/65">
          Millions of learners share the same gap: plenty of input, almost no safe,
          structured output with real people.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pains.map((p) => (
            <article
              key={p.title}
              className="rounded-3xl border border-ink/8 bg-cream p-6 transition hover:border-brand/30 hover:shadow-md"
            >
              <span className="text-3xl">{p.emoji}</span>
              <h3 className="mt-4 text-lg font-extrabold text-ink">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{p.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
