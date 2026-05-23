import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/react';
import { useOnboardingComplete } from '@/hooks/useOnboardingComplete';
import LoadingScreen from '@/components/ui/LoadingScreen';

/** Returning users: onboarding guard sends them home or back to wizard. */
export default function SignInPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const onboardingComplete = useOnboardingComplete();

  if (!isLoaded) return <LoadingScreen />;

  if (!isSignedIn) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Navigate to={onboardingComplete ? '/home' : '/onboarding'} replace />;
}
