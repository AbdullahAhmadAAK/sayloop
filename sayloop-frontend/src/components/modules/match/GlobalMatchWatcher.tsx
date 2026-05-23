import { useState } from 'react';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import { getTopic } from '@/constants/topics';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import {
  acceptMatchChallenge,
  applyMatchAccepted,
  rejectMatchRequest,
  socketRejectMatch,
} from '@/lib/matchApi';
import { removeRequest, setNotification, setToast } from '@/redux/slice/matchSlice';

/** Duel invite — bottom-right, works on any page (home, profile, etc.) */
export default function GlobalMatchWatcher() {
  const dispatch = useAppDispatch();
  const notification = useAppSelector((s) => s.match.notification);
  const [accepting, setAccepting] = useState(false);

  if (!notification) return null;

  const { request } = notification;
  const topic = getTopic(request.topic);

  const handleAccept = async () => {
    setAccepting(true);
    try {
      const res = await acceptMatchChallenge(request.id);
      if (!res.ok) {
        dispatch(setToast(res.message || 'Could not accept challenge'));
        return;
      }
      if (res.payload) {
        applyMatchAccepted(dispatch, res.payload);
        dispatch(setToast(`Accepted — tap "I'm ready" to enter the room`));
      } else {
        dispatch(setToast('Accepted! If the ready screen does not appear, open the Match page.'));
      }
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    const res = await socketRejectMatch(request.id);
    if (!res.ok) {
      try {
        await rejectMatchRequest(request.id);
      } catch {
        dispatch(setToast('Could not decline'));
        return;
      }
    }
    dispatch(removeRequest(request.id));
    dispatch(setNotification(null));
  };

  return (
    <div
      className="fixed bottom-20 right-3 z-[100] w-[min(440px,calc(100vw-1.5rem))] animate-fade-in-up sm:bottom-6 sm:right-6"
      role="alertdialog"
      aria-label="Incoming duel invite"
    >
      <div className="overflow-hidden rounded-2xl border-2 border-gold/50 bg-ink shadow-2xl ring-2 ring-brand/30">
        <div className="flex items-center justify-between bg-gradient-to-r from-brand to-brand/80 px-3 py-1.5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white">
            ♟️ Duel invite
          </span>
          <span className="animate-pulse-soft text-[10px] font-bold text-white/90">
            Tap accept to play
          </span>
        </div>

        <div className="flex items-stretch">
          <div className="flex w-24 shrink-0 items-center justify-center bg-brand/15 sm:w-28">
            <Avatar
              src={request.requester.avatarUrl}
              alt={request.requester.nickname}
              size="lg"
              ring
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-3">
            <p className="truncate text-base font-extrabold text-white">
              {request.requester.nickname} wants to debate
            </p>
            <p className="mt-0.5 text-xs text-white/75">
              Topic: {topic?.emoji} {topic?.label ?? request.topic}
            </p>
          </div>

          <div className="flex shrink-0 flex-col justify-center gap-2 border-l border-white/10 p-3">
            <Button
              size="sm"
              className="!min-w-[72px] !px-3 !py-2 !text-xs"
              disabled={accepting}
              onClick={handleAccept}
            >
              {accepting ? '…' : 'Accept'}
            </Button>
            <button
              type="button"
              onClick={handleDecline}
              disabled={accepting}
              className="rounded-full px-2 py-1 text-[11px] font-bold text-white/55 hover:text-white disabled:opacity-50"
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
