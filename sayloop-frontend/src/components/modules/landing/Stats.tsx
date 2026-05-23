const stats = [
  { value: '1 min', label: 'Per session — fits real life' },
  { value: '8+', label: 'Debate topics to break the ice' },
  { value: '100%', label: 'Live human partners' },
];

export default function Stats() {
  return (
    <section className="border-y border-ink/10 bg-brand py-12 text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 sm:grid-cols-3 sm:px-6">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <p className="font-display text-4xl font-extrabold sm:text-5xl">{s.value}</p>
            <p className="mt-1 text-sm font-semibold text-white/85">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
