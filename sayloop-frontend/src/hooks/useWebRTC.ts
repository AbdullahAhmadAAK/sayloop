import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setMediaError } from '@/redux/slice/sessionSlice';

type SignalPayload = {
  fromUserId: number;
  signal: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/** Max signals buffered while getUserMedia / PC setup is still in progress */
const MAX_PENDING_SIGNALS = 80;

export function useWebRTC() {
  const dispatch = useAppDispatch();
  const { sessionId, phase, shouldOfferWebRTC, isMuted, isCameraOff } = useAppSelector(
    (s) => s.session,
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const pendingSignalsRef = useRef<SignalPayload[]>([]);
  const shouldOfferRef = useRef(false);
  const makingOfferRef = useRef(false);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partnerConnected, setPartnerConnected] = useState(false);

  useEffect(() => {
    shouldOfferRef.current = shouldOfferWebRTC;
  }, [shouldOfferWebRTC]);

  const sendSignal = useCallback(
    (signal: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit }) => {
      if (!sessionId) return;
      getSocket()?.emit('session:signal', { sessionId, signal });
    },
    [sessionId],
  );

  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    const pending = [...pendingCandidatesRef.current];
    pendingCandidatesRef.current = [];
    for (const candidate of pending) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        /* ignore stale candidates */
      }
    }
  }, []);

  const attachRemoteTrack = useCallback((track: MediaStreamTrack) => {
    if (!remoteStreamRef.current) {
      remoteStreamRef.current = new MediaStream();
      setRemoteStream(remoteStreamRef.current);
    }
    const stream = remoteStreamRef.current;
    if (!stream.getTrackById(track.id)) {
      stream.addTrack(track);
    }
    setPartnerConnected(true);
  }, []);

  const sendOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !shouldOfferRef.current || makingOfferRef.current) return;
    if (pc.signalingState !== 'stable') return;

    makingOfferRef.current = true;
    try {
      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
      await pc.setLocalDescription(offer);
      sendSignal({ sdp: pc.localDescription ?? offer });
    } finally {
      makingOfferRef.current = false;
    }
  }, [sendSignal]);

  const handleRemoteSignal = useCallback(
    async (payload: SignalPayload) => {
      const pc = pcRef.current;
      if (!pc) return;

      const { signal } = payload;

      if (signal.sdp) {
        const desc = new RTCSessionDescription(signal.sdp);
        const isStable = pc.signalingState === 'stable';
        const isOffer = signal.sdp.type === 'offer';

        if (isOffer && !isStable && pc.signalingState !== 'have-local-offer') {
          try {
            await pc.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit);
          } catch {
            /* rollback unsupported — continue */
          }
        }

        await pc.setRemoteDescription(desc);
        await flushPendingCandidates(pc);

        if (isOffer) {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ sdp: pc.localDescription ?? answer });
        }
        return;
      }

      if (signal.candidate) {
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch {
            /* ignore */
          }
        } else {
          pendingCandidatesRef.current.push(signal.candidate);
        }
      }
    },
    [sendSignal, flushPendingCandidates],
  );

  const queueOrHandleSignal = useCallback(
    (payload: SignalPayload) => {
      if (!pcRef.current) {
        if (pendingSignalsRef.current.length < MAX_PENDING_SIGNALS) {
          pendingSignalsRef.current.push(payload);
        }
        return;
      }
      handleRemoteSignal(payload).catch((err) => {
        console.warn('[webrtc] signal error', err);
      });
    },
    [handleRemoteSignal],
  );

  const flushPendingSignals = useCallback(async () => {
    const queued = [...pendingSignalsRef.current];
    pendingSignalsRef.current = [];
    for (const payload of queued) {
      await handleRemoteSignal(payload);
    }
  }, [handleRemoteSignal]);

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    pendingSignalsRef.current = [];
    makingOfferRef.current = false;
    remoteStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteStream(null);
    setPartnerConnected(false);
  }, []);

  useEffect(() => {
    if (!remoteStream || !remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = remoteStream;
    void remoteVideoRef.current.play().catch(() => undefined);
  }, [remoteStream]);

  useEffect(() => {
    if (phase !== 'active' || !sessionId) return;

    const boundSessionId = sessionId;
    let cancelled = false;

    const s = getSocket();
    if (!s) return;

    const onSignal = (payload: SignalPayload) => queueOrHandleSignal(payload);

    const onPeerReady = () => {
      if (shouldOfferRef.current && pcRef.current) {
        sendOffer().catch((err) => console.warn('[webrtc] offer error', err));
      }
    };

    s.on('session:signal', onSignal);
    s.on('session:peer-webrtc-ready', onPeerReady);

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(() => undefined);
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          const track = event.track;
          if (track) {
            attachRemoteTrack(track);
            return;
          }
          const remote =
            event.streams[0] ?? new MediaStream(event.track ? [event.track] : []);
          remote.getTracks().forEach((t) => attachRemoteTrack(t));
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ candidate: event.candidate.toJSON() });
          }
        };

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          if (state === 'connected') {
            setPartnerConnected(true);
          } else if (state === 'failed' && shouldOfferRef.current) {
            try {
              pc.restartIce();
              sendOffer().catch(() => undefined);
            } catch {
              /* ignore */
            }
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            setPartnerConnected(true);
          }
        };

        await flushPendingSignals();

        if (cancelled) return;

        s.emit('session:webrtc-ready', { sessionId: boundSessionId });
        dispatch(setMediaError(null));

        if (shouldOfferRef.current) {
          sendOffer().catch((err) => console.warn('[webrtc] initial offer error', err));
        }
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Camera/mic permission denied — allow access in your browser.';
        dispatch(setMediaError(msg));
      }
    };

    void start();

    const retryOffer = setInterval(() => {
      const pc = pcRef.current;
      if (!pc || !shouldOfferRef.current) return;
      const needsOffer =
        pc.signalingState === 'stable' &&
        !pc.currentRemoteDescription &&
        pc.connectionState !== 'connected';
      if (needsOffer) {
        sendOffer().catch(() => undefined);
      }
    }, 4000);

    return () => {
      cancelled = true;
      clearInterval(retryOffer);
      s.off('session:signal', onSignal);
      s.off('session:peer-webrtc-ready', onPeerReady);
      stopMedia();
    };
  }, [
    phase,
    sessionId,
    dispatch,
    sendSignal,
    sendOffer,
    queueOrHandleSignal,
    flushPendingSignals,
    attachRemoteTrack,
    stopMedia,
  ]);

  useEffect(() => {
    if (phase === 'ended' || !sessionId) {
      stopMedia();
    }
  }, [phase, sessionId, stopMedia]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => {
      t.enabled = !isMuted;
    });
  }, [isMuted]);

  useEffect(() => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => {
      t.enabled = !isCameraOff;
    });
  }, [isCameraOff]);

  return { localVideoRef, remoteVideoRef, remoteStream, partnerConnected };
}
