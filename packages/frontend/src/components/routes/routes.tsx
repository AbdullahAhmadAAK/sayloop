import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from '@/page/Landing/LandingPage';
import SignInPage from '@/page/Auth/SignInPage';
import SignUpPage from '@/page/Auth/SignUpPage';
import SsoCallbackPage from '@/page/Auth/SsoCallbackPage';
import OnboardingPage from '@/page/Onboarding/OnboardingPage';
import HomePage from '@/page/Home/HomePage';
import MatchPage from '@/page/Match/MatchPage';
import SessionPage from '@/page/Session/SessionPage';
import ProfilePage from '@/page/Profile/ProfilePage';
import LeaderboardPage from '@/page/Leaderboard/LeaderboardPage';
import PlaceholderPage from '@/page/Placeholder/PlaceholderPage';
import {
  OnboardingGuard,
  ProtectedRoute,
  PublicOnlyRoute,
} from '@/components/routes/guards';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route path="/sso-callback" element={<SsoCallbackPage />} />

      <Route
        path="/onboarding"
        element={<OnboardingPage />}
      />

      <Route
        path="/sign-in/*"
        element={
          <PublicOnlyRoute>
            <SignInPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/sign-up/*"
        element={
          <PublicOnlyRoute>
            <SignUpPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <HomePage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/match"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <MatchPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/session"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <SessionPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <LeaderboardPage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <ProfilePage />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/learn"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <PlaceholderPage
                title="Learn"
                emoji="📖"
                description="Curriculum path coming soon. Jump into a live debate instead."
              />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/quests"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <PlaceholderPage
                title="Quests"
                emoji="⚡"
                description="Daily quests are a stretch goal for this hackathon."
              />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop"
        element={
          <ProtectedRoute>
            <OnboardingGuard>
              <PlaceholderPage
                title="Shop"
                emoji="💎"
                description="Spend gems on power-ups — UI stub for now."
              />
            </OnboardingGuard>
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
