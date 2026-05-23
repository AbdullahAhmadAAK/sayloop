import { Link } from 'react-router-dom';
import Logo from '@/components/ui/Logo';

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'How it works', to: '/#how' },
      { label: 'Features', to: '/#features' },
      { label: 'Get started', to: '/onboarding' },
    ],
  },
  {
    title: 'Platform',
    links: [
      { label: 'Why SayLoop', to: '/#why' },
      { label: 'Match partners', to: '/onboarding' },
      { label: 'Live debates', to: '/#how' },
    ],
  },
  {
    title: 'Account',
    links: [
      { label: 'Sign in', to: '/onboarding' },
      { label: 'Continue with Google', to: '/onboarding' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink/10 bg-white/50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink/60">
              SayLoop helps you practice speaking with real people who share your
              urge to communicate — structured debates, clear topics, five minutes
              at a time.
            </p>
            <p className="mt-4 text-sm font-bold text-brand">
              Speak more. Fear less.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink/45">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm font-semibold text-ink/65 hover:text-brand"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-ink/10 pt-8 sm:flex-row">
          <p className="text-sm text-ink/45">
            © {new Date().getFullYear()} SayLoop. Built for language learners who
            want to be heard.
          </p>
          <p className="text-sm text-ink/45">
            Communication practice · Human partners · No bots
          </p>
        </div>
      </div>
    </footer>
  );
}
