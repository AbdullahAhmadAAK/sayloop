export default function WrappingScreen() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center animate-fade-in-up">
      <div className="h-14 w-14 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
      <h2 className="mt-6 font-display text-xl font-extrabold text-ink">Time&apos;s up!</h2>
      <p className="mt-2 text-sm text-ink/60">Saving results and closing the debate room…</p>
    </div>
  );
}
