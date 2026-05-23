import { HandleSSOCallback } from '@clerk/react';
import { useNavigate } from 'react-router-dom';
import LoadingScreen from '@/components/ui/LoadingScreen';

export default function SsoCallbackPage() {
  const navigate = useNavigate();

  const goOnboarding = () => {
    navigate('/onboarding', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream">
      <p className="mb-4 text-sm font-semibold text-ink/60">Completing sign-in…</p>
      <LoadingScreen />
      <HandleSSOCallback
        navigateToApp={goOnboarding}
        navigateToSignIn={goOnboarding}
        navigateToSignUp={goOnboarding}
      />
    </div>
  );
}
