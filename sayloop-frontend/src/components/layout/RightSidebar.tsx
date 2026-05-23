import { useAppSelector } from '@/hooks/useAppDispatch';
import Badge from '@/components/ui/Badge';

export default function RightSidebar() {
  const { gems, streak, xp, level, levelTitle } = useAppSelector((s) => s.economy);

  return (
    <aside className="hidden w-52 shrink-0 flex-col gap-4 p-4 xl:flex">
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wide text-ink/50">Your progress</p>
        <p className="mt-2 text-2xl font-extrabold text-ink">Lv.{level}</p>
        <p className="text-sm font-semibold text-brand">{levelTitle}</p>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-cream">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${Math.min(100, (xp % 200) / 2)}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-ink/50">{xp} XP total</p>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-gold/20 to-brand/10 p-4">
        <Badge tone="gold">🔥 {streak} day streak</Badge>
        <p className="mt-2 text-sm text-ink/70">Practice today to keep it alive.</p>
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <p className="text-xs font-bold text-ink/50">Gems</p>
        <p className="text-xl font-extrabold text-ink">💎 {gems}</p>
      </div>

      <div className="rounded-3xl border border-dashed border-ink/15 p-4 text-center text-xs text-ink/50">
        ❤️❤️❤️ Hearts refill at midnight
      </div>
    </aside>
  );
}
