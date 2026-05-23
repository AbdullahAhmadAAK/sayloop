import { parsePublishableKey } from '@clerk/shared/keys';

/**
 * Returns the publishable key only if Clerk can parse it (decoded value must end with `$`).
 * Do not trim trailing base64 characters — the last character often looks like a typo (e.g. `Q`).
 */
export function getClerkPublishableKey(): string | undefined {
  const raw = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim();
  if (!raw) return undefined;

  const parsed = parsePublishableKey(raw);
  if (!parsed?.frontendApi) return undefined;

  return raw;
}
