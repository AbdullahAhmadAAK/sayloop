import { useUser } from '@clerk/react';
import { getAvatarUrl, type AvatarStyle } from '@/constants/avatars';

export function getUserAvatarUrl(user: ReturnType<typeof useUser>['user']): string {
  if (!user) {
    return 'https://api.dicebear.com/7.x/adventurer/svg?seed=guest';
  }
  const meta = user.unsafeMetadata as {
    avatarUrl?: string;
    avatarStyle?: AvatarStyle;
    avatarSeed?: string;
  };
  if (meta.avatarUrl) return meta.avatarUrl;
  if (meta.avatarStyle && meta.avatarSeed) {
    return getAvatarUrl(meta.avatarStyle, meta.avatarSeed);
  }
  if (user.imageUrl) return user.imageUrl;
  return getAvatarUrl('adventurer', user.id || 'default');
}

export function useUserAvatar(): string {
  const { user } = useUser();
  return getUserAvatarUrl(user);
}
