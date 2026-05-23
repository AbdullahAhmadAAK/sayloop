import { Navigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { useOnboardingComplete } from '@/hooks/useOnboardingComplete';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) return <LoadingScreen />;
  if (!isSignedIn) return <Navigate to="/sign-in" replace />;
  return children;
}

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useUser();
  const onboardingComplete = useOnboardingComplete();

  if (!isLoaded) return <LoadingScreen />;
  if (!onboardingComplete) return <Navigate to="/onboarding" replace />;
  return children;
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isSignedIn, isLoaded } = useAuth();
  const onboardingComplete = useOnboardingComplete();

  if (!isLoaded) return <LoadingScreen />;
  if (isSignedIn) {
    return <Navigate to={onboardingComplete ? '/home' : '/onboarding'} replace />;
  }
  return children;
}