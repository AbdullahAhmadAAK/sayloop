import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setToast } from '@/redux/slice/matchSlice';

export default function MatchToast() {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((s) => s.match.toast);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dispatch(setToast(null)), 5000);
    return () => clearTimeout(t);
  }, [toast, dispatch]);

  if (!toast) return null;

  return (
    <div className="fixed left-1/2 top-20 z-[110] w-[min(360px,calc(100vw-2rem))] -translate-x-1/2 animate-fade-in-up">
      <div className="rounded-2xl border border-ink/10 bg-ink px-4 py-3 text-center text-sm font-bold text-white shadow-lg">
        {toast}
      </div>
    </div>
  );
}
