import { useEffect } from 'react';
import { useAuth } from '@clerk/react';
import { setTokenGetter } from '@/lib/api';

export function useClerkApi() {
  const { getToken, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    setTokenGetter(() => getToken());
  }, [getToken, isLoaded]);
}
