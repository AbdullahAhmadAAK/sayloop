import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import type { TopicId } from '@/constants/topics';
import type { AvatarOption } from '@/constants/avatars';
import { getAvatarUrlFromOption } from '@/constants/avatars';
import { updateUserProfile } from '@/lib/api';
import { useOnboardingComplete } from '@/hooks/useOnboardingComplete';
import { useClerkApi } from '@/hooks/useClerkApi';
import LoadingScreen from '@/components/ui/LoadingScreen';
import OnboardingShell from '@/components/modules/onboarding/OnboardingShell';
import GoogleAuthStep from '@/components/modules/onboarding/GoogleAuthStep';
import NicknameStep from '@/components/modules/onboarding/NicknameStep';
import AvatarStep from '@/components/modules/onboarding/AvatarStep';
import TopicsStep from '@/components/modules/onboarding/TopicsStep';

export default function OnboardingPage() {
  useClerkApi();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  const onboardingComplete = useOnboardingComplete();

  const [step, setStep] = useState(0);
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState<AvatarOption | null>(null);
  const [interests, setInterests] = useState<TopicId[]>(['social_media', 'gaming_career']);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!userLoaded || !user) return;
    const meta = user.unsafeMetadata as { nickname?: string };
    if (meta.nickname && !nickname) setNickname(meta.nickname);
  }, [user, userLoaded, nickname]);

  useEffect(() => {
    if (authLoaded && isSignedIn && step === 0) {
      setStep(1);
    }
  }, [authLoaded, isSignedIn, step]);

  useEffect(() => {
    if (authLoaded && !isSignedIn && step > 0) {
      setStep(0);
    }
  }, [authLoaded, isSignedIn, step]);

  useEffect(() => {
    if (onboardingComplete) {
      navigate('/home', { replace: true });
    }
  }, [onboardingComplete, navigate]);

  if (!authLoaded) {
    return <LoadingScreen />;
  }

  if (isSignedIn && !userLoaded) {
    return <LoadingScreen />;
  }

  if (onboardingComplete) {
    return <LoadingScreen />;
  }

  const firstName = user?.firstName || user?.username || 'Friend';
  const lastName = user?.lastName || undefined;

  const toggleInterest = (id: TopicId) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const finish = async () => {
    if (!user || !avatar) return;
    setSaving(true);
    try {
      const avatarUrl = getAvatarUrlFromOption(avatar);
      await user.update({
        unsafeMetadata: {
          onboardingComplete: true,
          nickname: nickname.trim(),
          learningLanguage: 'English',
          interests,
          avatarStyle: avatar.style,
          avatarSeed: avatar.seed,
          avatarUrl,
        },
      });

      try {
        const res = await fetch(avatarUrl);
        const blob = await res.blob();
        await user.setProfileImage({ file: new File([blob], 'avatar.svg', { type: 'image/svg+xml' }) });
      } catch {
        // Clerk image upload optional; metadata avatarUrl still works in UI
      }

      try {
        await updateUserProfile({
          nickname: nickname.trim(),
          pfpSource: avatarUrl,
          avatarStyle: avatar.style,
          avatarSeed: avatar.seed,
          learningLanguage: 'English',
          interests,
          onboardingComplete: true,
          firstName: user.firstName,
          lastName: user.lastName,
        });
      } catch (err) {
        console.warn('[onboarding] Saved to Clerk; database update failed:', err);
      }

      navigate('/home');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell step={step}>
      {step === 0 && <GoogleAuthStep />}
      {step === 1 && !isSignedIn && <GoogleAuthStep />}

      {step === 1 && isSignedIn && (
        <NicknameStep
          firstName={firstName}
          lastName={lastName}
          value={nickname}
          onChange={setNickname}
          onNext={() => setStep(2)}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <AvatarStep
          selected={avatar}
          onSelect={setAvatar}
          onNext={() => setStep(3)}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <TopicsStep
          interests={interests}
          onToggle={toggleInterest}
          onFinish={finish}
          onBack={() => setStep(2)}
          saving={saving}
        />
      )}
    </OnboardingShell>
  );
}
