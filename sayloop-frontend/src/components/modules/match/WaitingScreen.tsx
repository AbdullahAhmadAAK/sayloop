import type { PartnerUser } from '@/types';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';

type Props = {
  partner: PartnerUser;
  onCancel: () => void;
};

export default function WaitingScreen({ partner, onCancel }: Props) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center py-6 text-center">
      <div className="w-full rounded-3xl border-2 border-brand/25 bg-white p-8 shadow-lg">
        <p className="text-xs font-bold uppercase tracking-widest text-brand">
          Step 3 — Waiting for reply
        </p>
        <div className="relative mx-auto mt-6 w-fit">
          <Avatar src={partner.avatarUrl} alt={partner.nickname} size="xl" ring />
          <span className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full bg-brand text-lg text-white animate-pulse-soft">
            ♟️
          </span>
        </div>
        <h2 className="mt-6 text-xl font-extrabold text-ink">
          Challenge sent to {partner.nickname}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink/60">
          They will see a <strong className="text-ink">duel invite</strong> on whatever page
          they are on — Home, Profile, anywhere. When they accept, you both tap{' '}
          <strong className="text-ink">I&apos;m ready</strong> to enter the voice room.
        </p>
        <div className="mt-6 flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-brand animate-pulse-soft"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
        <Button variant="ghost" className="mt-8" fullWidth onClick={onCancel}>
          Cancel challenge
        </Button>
      </div>
    </div>
  );
}
