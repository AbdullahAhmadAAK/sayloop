import type { RefObject } from 'react';

type Props = {
  localVideoRef: RefObject<HTMLVideoElement | null>;
  remoteVideoRef: RefObject<HTMLVideoElement | null>;
  localMuted: boolean;
  cameraOff: boolean;
  partnerName: string;
  mediaError: string | null;
  partnerConnected?: boolean;
  hasRemoteStream?: boolean;
};

export default function VideoArea({
  localVideoRef,
  remoteVideoRef,
  localMuted,
  cameraOff,
  partnerName,
  mediaError,
  partnerConnected,
  hasRemoteStream,
}: Props) {
  const showWaiting = !partnerConnected && !hasRemoteStream;
  return (
    <div className="space-y-3">
      {mediaError && (
        <div className="rounded-xl border border-brand/30 bg-brand/10 px-4 py-3 text-sm font-semibold text-ink">
          {mediaError} — You can still use the timer and chat controls below.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink">
          <video
            ref={localVideoRef}
            playsInline
            autoPlay
            muted
            className={`h-full w-full object-cover ${cameraOff ? 'opacity-0' : ''}`}
          />
          {cameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-brand/30 to-ink">
              <span className="text-4xl">📷</span>
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
            You {localMuted && '· muted'}
          </span>
        </div>

        <div className="relative aspect-video overflow-hidden rounded-2xl bg-ink">
          <video
            ref={remoteVideoRef}
            playsInline
            autoPlay
            className="h-full w-full object-cover"
          />
          {showWaiting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink/80 px-3 text-center">
              <span className="text-3xl">👤</span>
              <p className="mt-2 text-xs font-bold text-white/80">
                Waiting for {partnerName || 'partner'} video…
              </p>
            </div>
          )}
          <span className="absolute bottom-2 left-2 rounded-lg bg-black/60 px-2 py-0.5 text-xs font-bold text-white">
            {partnerName || 'Partner'}
            {partnerConnected ? ' · live' : ''}
          </span>
        </div>
      </div>

      <p className="text-center text-xs text-ink/50">
        Allow camera &amp; microphone when your browser asks — needed to debate with confidence.
      </p>
    </div>
  );
}
