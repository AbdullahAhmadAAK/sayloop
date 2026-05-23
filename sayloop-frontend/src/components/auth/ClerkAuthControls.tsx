import { Link } from 'react-router-dom';
import { Show, UserButton } from '@clerk/react';
import Button from '@/components/ui/Button';

const clerkAppearance = {
  variables: {
    colorPrimary: '#E8480C',
    colorBackground: '#F8F5EF',
    colorText: '#141414',
    borderRadius: '1rem',
  },
};

type Props = {
  signUpLabel?: string;
};

export default function ClerkAuthControls({ signUpLabel = 'Get started' }: Props) {
  return (
    <>
      <Show when="signed-out">
        <div className="flex items-center gap-2">
          <Link to="/onboarding">
            <span className="hidden rounded-full px-3 py-2 text-sm font-bold text-ink hover:bg-ink/5 sm:inline">
              Sign in
            </span>
          </Link>
          <Link to="/onboarding">
            <Button size="sm">{signUpLabel}</Button>
          </Link>
        </div>
      </Show>
      <Show when="signed-in">
        <UserButton afterSignOutUrl="/" appearance={clerkAppearance} />
      </Show>
    </>
  );
}

export { clerkAppearance };
