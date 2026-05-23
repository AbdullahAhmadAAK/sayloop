export default function ClerkSetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="max-w-md rounded-3xl bg-white p-8 text-center shadow-lg">
        <span className="text-4xl">🔧</span>
        <h1 className="mt-4 text-xl font-extrabold text-ink">Sign-in not configured</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          The app needs a Clerk publishable key before Google sign-in can work. Add it to
          the frontend environment file, then restart the dev server.
        </p>
      </div>
    </div>
  );
}
