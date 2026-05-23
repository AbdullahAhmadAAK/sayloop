import { useAuthInit } from '@/hooks/useAuthInit';

/** Runs Clerk → backend user sync when signed in. Renders nothing. */
export default function AuthInit() {
  useAuthInit();
  return null;
}
