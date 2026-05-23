/**
 * Duolingo-style illustrated avatars via DiceBear (free, no API key).
 * @see https://www.dicebear.com/styles/
 */
export type AvatarStyle = 'adventurer' | 'fun-emoji' | 'lorelei' | 'avataaars';

export interface AvatarOption {
  id: string;
  style: AvatarStyle;
  seed: string;
  label: string;
}

export const AVATAR_STYLES: { style: AvatarStyle; label: string; description: string }[] = [
  { style: 'adventurer', label: 'Adventurer', description: 'Friendly illustrated faces (Duolingo-like)' },
  { style: 'fun-emoji', label: 'Emoji', description: 'Bold, colorful emoji avatars' },
  { style: 'lorelei', label: 'Lorelei', description: 'Soft portrait illustrations' },
  { style: 'avataaars', label: 'Classic', description: 'Cartoon character style' },
];

const SEEDS = [
  'amber', 'bolt', 'coral', 'dex', 'elm', 'fizz', 'glow', 'haze',
  'ivy', 'jade', 'kite', 'luna', 'mint', 'nova', 'orbit', 'pearl',
];

export function buildAvatarOptions(): AvatarOption[] {
  const options: AvatarOption[] = [];
  for (const { style } of AVATAR_STYLES) {
    for (const seed of SEEDS.slice(0, 4)) {
      options.push({
        id: `${style}-${seed}`,
        style,
        seed,
        label: seed,
      });
    }
  }
  return options;
}

export const AVATAR_OPTIONS = buildAvatarOptions();

export function getAvatarUrl(style: AvatarStyle, seed: string): string {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=f8f5ef`;
}

export function getAvatarUrlFromOption(option: Pick<AvatarOption, 'style' | 'seed'>): string {
  return getAvatarUrl(option.style, option.seed);
}
