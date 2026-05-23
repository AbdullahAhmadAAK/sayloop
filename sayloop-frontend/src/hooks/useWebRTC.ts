import { useEffect, useRef, useCallback, useState } from 'react';
import { getSocket } from '@/lib/socket';
import { useAppDispatch, useAppSelector } from '@/hooks/useAppDispatch';
import { setMediaError } from '@/redux/slice/sessionSlice';
import { startDebateRecording } from '@/lib/debateAudioCapture';
import { captureDebateAudioBlob } from '@/lib/sessionTranscript';

type SignalPayload = {
  fromUserId: number;
  signal: { sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit };
};

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

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
  const activeRef = useRef(false);

  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const mediaReadyRef = useRef(false);
  const activatedRef = useRef(false);
  const phaseRef = useRef(phase);
  const partnerConnectedRef = useRef(false);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    partnerConnectedRef.current = partnerConnected;
  }, [partnerConnected]);

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
        /* ignore */
      }
    }
  }, []);

  const attachRemoteStream = useCallback((stream: MediaStream) => {
    if (!stream.getTracks().length) return;
    remoteStreamRef.current = stream;
    setRemoteStream(stream);
    setPartnerConnected(true);
  }, []);

  const sendOffer = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !shouldOfferRef.current || makingOfferRef.current) return;
    if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') return;

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
        const sdpType = signal.sdp.type;

        if (sdpType === 'offer') {
          if (pc.signalingState === 'have-local-offer') {
            try {
              await pc.setLocalDescription({ type: 'rollback' } as RTCSessionDescriptionInit);
            } catch {
              return;
            }
          }

          if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-remote-offer') {
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await flushPendingCandidates(pc);

          if (pc.signalingState !== 'have-remote-offer') return;

          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal({ sdp: pc.localDescription ?? answer });
          return;
        }

        if (sdpType === 'answer') {
          if (pc.signalingState !== 'have-local-offer') return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
          await flushPendingCandidates(pc);
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
    activeRef.current = false;
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
    setConnecting(false);
    mediaReadyRef.current = false;
    activatedRef.current = false;
  }, []);

  const activateSignaling = useCallback(
    (boundSessionId: string) => {
      if (activatedRef.current || !mediaReadyRef.current) return;
      activatedRef.current = true;
      setConnecting(true);

      const s = getSocket();
      if (!s) return;

      s.emit('session:webrtc-ready', { sessionId: boundSessionId });
      if (shouldOfferRef.current) {
        sendOffer().catch((err) => console.warn('[webrtc] offer error', err));
        setTimeout(() => {
          if (pcRef.current && !partnerConnectedRef.current) {
            sendOffer().catch(() => undefined);
          }
        }, 800);
      }
    },
    [sendOffer],
  );

  useEffect(() => {
    if (!remoteStream || !remoteVideoRef.current) return;
    remoteVideoRef.current.srcObject = remoteStream;
    void remoteVideoRef.current.play().catch(() => undefined);
  }, [remoteStream]);

  useEffect(() => {
    const inSession =
      (phase === 'joining' || phase === 'active' || phase === 'wrapping') && sessionId;
    if (!inSession) return;

    const boundSessionId = sessionId;
    let cancelled = false;
    activeRef.current = true;
    setConnecting(true);

    const s = getSocket();
    if (!s) return;

    const onSignal = (payload: SignalPayload) => queueOrHandleSignal(payload);

    const onPeerReady = () => {
      if (phaseRef.current === 'active' && shouldOfferRef.current && pcRef.current) {
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
        if (cancelled || !activeRef.current) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        localStreamRef.current = stream;
        startDebateRecording(boundSessionId, stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.muted = true;
          await localVideoRef.current.play().catch(() => undefined);
        }

        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
        pcRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          if (event.streams?.[0]) {
            attachRemoteStream(event.streams[0]);
            return;
          }
          if (event.track) {
            if (!remoteStreamRef.current) {
              attachRemoteStream(new MediaStream([event.track]));
            } else {
              const rs = remoteStreamRef.current;
              if (!rs.getTrackById(event.track.id)) {
                rs.addTrack(event.track);
                setRemoteStream(rs);
              }
              setPartnerConnected(true);
            }
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
            sendSignal({ candidate: event.candidate.toJSON() });
          }
        };

        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'connected') setPartnerConnected(true);
          if (pc.connectionState === 'failed' && shouldOfferRef.current) {
            pc.restartIce();
            sendOffer().catch(() => undefined);
          }
        };

        pc.oniceconnectionstatechange = () => {
          if (
            pc.iceConnectionState === 'connected' ||
            pc.iceConnectionState === 'completed'
          ) {
            setPartnerConnected(true);
          }
        };

        await flushPendingSignals();
        if (cancelled || !activeRef.current) return;

        mediaReadyRef.current = true;
        dispatch(setMediaError(null));

        if (phaseRef.current === 'active') {
          activateSignaling(boundSessionId);
        }
      } catch (err) {
        setConnecting(false);
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
      if (!pc || phaseRef.current !== 'active' || !activeRef.current) return;
      if (shouldOfferRef.current && !pc.currentRemoteDescription && pc.connectionState !== 'connected') {
        sendOffer().catch(() => undefined);
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(retryOffer);
      s.off('session:signal', onSignal);
      s.off('session:peer-webrtc-ready', onPeerReady);
    };
  }, [
    phase,
    sessionId,
    dispatch,
    sendSignal,
    sendOffer,
    queueOrHandleSignal,
    flushPendingSignals,
    attachRemoteStream,
    activateSignaling,
  ]);

  useEffect(() => {
    if (phase === 'active' && sessionId && mediaReadyRef.current) {
      activateSignaling(sessionId);
    }
  }, [phase, sessionId, activateSignaling]);

  useEffect(() => {
    if (partnerConnected) setConnecting(false);
  }, [partnerConnected]);

  useEffect(() => {
    if (phase === 'joining' || phase === 'active' || phase === 'wrapping') return;
    void captureDebateAudioBlob().finally(() => stopMedia());
  }, [phase, stopMedia]);

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

  return { localVideoRef, remoteVideoRef, remoteStream, partnerConnected, connecting };
}
