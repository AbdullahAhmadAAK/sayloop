import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';
import ClerkAuthControls from '@/components/auth/ClerkAuthControls';

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-ink/5 bg-cream/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 sm:flex">
          <a
            href="#why"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink"
          >
            Why SayLoop
          </a>
          <a
            href="#how"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink"
          >
            How it works
          </a>
          <a
            href="#features"
            className="rounded-lg px-3 py-2 text-sm font-semibold text-ink/70 hover:bg-ink/5 hover:text-ink"
          >
            Features
          </a>
        </nav>
        <ClerkAuthControls />
      </div>
    </header>
  );
}
