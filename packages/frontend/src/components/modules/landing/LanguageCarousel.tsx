const flags = ['🇺🇸', '🇪🇸', '🇫🇷', '🇯🇵', '🇩🇪', '🇮🇹', '🇧🇷', '🇰🇷', '🇲🇽', '🇮🇳'];

export default function LanguageCarousel() {
  const row = [...flags, ...flags];

  return (
    <section className="overflow-hidden border-y border-ink/10 bg-white/40 py-10">
      <p className="mb-6 text-center text-sm font-bold uppercase tracking-wide text-ink/50">
        Learners worldwide
      </p>
      <div className="relative flex overflow-hidden">
        <div className="marquee-track flex shrink-0 gap-8 px-4">
          {row.map((flag, i) => (
            <span
              key={`${flag}-${i}`}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cream text-3xl shadow-sm"
            >
              {flag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
