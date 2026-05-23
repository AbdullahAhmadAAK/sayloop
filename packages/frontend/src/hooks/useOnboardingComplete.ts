import { useUser } from '@clerk/react';

export function useOnboardingComplete(): boolean {
  const { user } = useUser();
  return user?.unsafeMetadata?.onboardingComplete === true;
}

export function getDisplayName(user: ReturnType<typeof useUser>['user']): string {
  if (!user) return 'Speaker';
  const meta = user.unsafeMetadata as { nickname?: string };
  return (
    meta?.nickname ||
    user.firstName ||
    user.username ||
    user.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Speaker'
  );
}
