import { useEffect, useRef, useState } from 'react';
import { useAuth, useUser } from '@clerk/react';
import { api } from '@/lib/api';
import { notifyUserSynced } from '@/lib/authSync';

const DB_USER_KEY = 'db_user_id';
const CLERK_ID_KEY = 'clerk_id';

export function useAuthInit() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const syncedRef = useRef(false);
  const [dbSynced, setDbSynced] = useState(false);

  useEffect(() => {
    syncedRef.current = false;
    const existing = localStorage.getItem(DB_USER_KEY);
    setDbSynced(Boolean(existing));
    if (existing) syncedRef.current = true;
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || syncedRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        const { data } = await api.post<{
          success: boolean;
          user: { id: number; clerkId: string; onboardingComplete: boolean };
        }>('/users/sync', {
          email: user.primaryEmailAddress?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
          pfpSource: user.imageUrl,
        });

        if (cancelled) return;

        localStorage.setItem(DB_USER_KEY, String(data.user.id));
        localStorage.setItem(CLERK_ID_KEY, data.user.clerkId);
        syncedRef.current = true;
        setDbSynced(true);
        notifyUserSynced();
      } catch (err) {
        console.warn('[auth] User sync failed — is the backend running with DATABASE_URL?', err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user, getToken]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      localStorage.removeItem(DB_USER_KEY);
      localStorage.removeItem(CLERK_ID_KEY);
      syncedRef.current = false;
      setDbSynced(false);
    }
  }, [isLoaded, isSignedIn]);

  return { dbSynced };
}

export function getDbUserId(): string | null {
  return localStorage.getItem(DB_USER_KEY);
}
