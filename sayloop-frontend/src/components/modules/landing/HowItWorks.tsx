const steps = [
  {
    icon: '🔐',
    title: 'Sign in with Google',
    desc: 'One tap. Pick a nickname and avatar that feel like you — not your legal name.',
  },
  {
    icon: '🤝',
    title: 'Match on a topic',
    desc: 'Browse learners who want the same kind of practice. Send a request with a debate theme.',
  },
  {
    icon: '🗣️',
    title: 'Speak for five minutes',
    desc: 'Join a live voice session with prompts that keep both of you talking.',
  },
  {
    icon: '📈',
    title: 'Build the habit',
    desc: 'XP, streaks, and weekly ranks turn communication practice into something you return to.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="bg-white/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm font-bold uppercase tracking-widest text-brand">
          How it works
        </p>
        <h2 className="font-display mt-3 text-center text-3xl font-extrabold text-ink sm:text-4xl">
          From silent learner to confident speaker
        </h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="relative rounded-3xl bg-cream p-6 shadow-sm"
            >
              <span className="absolute -top-3 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-extrabold text-white">
                {i + 1}
              </span>
              <span className="text-4xl">{step.icon}</span>
              <h3 className="mt-4 text-lg font-extrabold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/65">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
