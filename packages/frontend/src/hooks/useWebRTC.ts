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

export function useWebRTC() {
  const dispatch = useAppDispatch();
  const { sessionId, phase, shouldOfferWebRTC, isMuted, isCameraOff } = useAppSelector(
    (s) => s.session,
  );

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const shouldOfferRef = useRef(false);
  const makingOfferRef = useRef(false);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partnerConnected, setPartnerConnected] = useState(false);

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
        /* ignore */
      }
    }
  }, []);

  const sendOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !shouldOfferRef.current || makingOfferRef.current) return;
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
        const isAnswer = signal.sdp.type === 'answer';

        if (isOffer && !isStable && pc.signalingState !== 'have-local-offer') {
          await pc.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit);
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

  const stopMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
    pendingCandidatesRef.current = [];
    makingOfferRef.current = false;
    shouldOfferRef.current = false;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setRemoteStream(null);
    setPartnerConnected(false);
  }, []);

  useEffect(() => {
    if (!remoteStream || !remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = remoteStream;
    remoteVideoRef.current.play().catch(() => undefined);
  }, [remoteStream]);

  useEffect(() => {
    if (phase !== 'active' || !sessionId) {
      return;
    }

    let cancelled = false;
    shouldOfferRef.current = shouldOfferWebRTC;

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
          const stream =
            event.streams[0] ?? new MediaStream(event.track ? [event.track] : []);
          setRemoteStream(stream);
          setPartnerConnected(true);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ candidate: event.candidate.toJSON() });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected' || pc.connectionState === 'completed') {
            setPartnerConnected(true);
          }
        };

        const s = getSocket();
        if (!s) return;

        const onSignal = (payload: SignalPayload) => {
          handleRemoteSignal(payload).catch((err) => {
            console.warn('[webrtc] signal error', err);
          });
        };

        const onPeerReady = () => {
          if (shouldOfferRef.current) {
            sendOffer().catch((err) => console.warn('[webrtc] offer error', err));
          }
        };

        s.on('session:signal', onSignal);
        s.on('session:peer-webrtc-ready', onPeerReady);

        s.emit('session:webrtc-ready', { sessionId });

        dispatch(setMediaError(null));

        return () => {
          s.off('session:signal', onSignal);
          s.off('session:peer-webrtc-ready', onPeerReady);
        };
      } catch (err) {
        const msg =
          err instanceof Error
            ? err.message
            : 'Camera/mic permission denied — allow access in your browser.';
        dispatch(setMediaError(msg));
      }
    };

    let cleanupListeners: (() => void) | undefined;
    start().then((cleanup) => {
      cleanupListeners = cleanup;
    });

    return () => {
      cancelled = true;
      cleanupListeners?.();
      stopMedia();
    };
  }, [
    phase,
    sessionId,
    shouldOfferWebRTC,
    dispatch,
    sendSignal,
    sendOffer,
    handleRemoteSignal,
    stopMedia,
  ]);

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
