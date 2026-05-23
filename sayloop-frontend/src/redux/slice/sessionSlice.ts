import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { normalizeTopicId, type TopicId } from '@/constants/topics';
import type { DebateOutcome, SessionPhase, SessionResult } from '@/types';

interface SessionState {
  sessionId: string | null;
  phase: SessionPhase;
  timerSeconds: number;
  isMuted: boolean;
  isCameraOff: boolean;
  partnerName: string;
  topic: TopicId;
  result: SessionResult | null;
  waitingForPartner: boolean;
  drawOfferPending: boolean;
  drawOfferIncoming: boolean;
  shouldOfferWebRTC: boolean;
  mediaError: string | null;
}

const initialState: SessionState = {
  sessionId: null,
  phase: 'joining',
  timerSeconds: 300,
  isMuted: false,
  isCameraOff: false,
  partnerName: '',
  topic: 'social_media' as TopicId,
  result: null,
  waitingForPartner: true,
  drawOfferPending: false,
  drawOfferIncoming: false,
  shouldOfferWebRTC: false,
  mediaError: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    initSession(
      state,
      action: PayloadAction<{ sessionId: string; partnerName: string; topic: string }>,
    ) {
      state.sessionId = action.payload.sessionId;
      state.partnerName = action.payload.partnerName;
      state.topic = normalizeTopicId(action.payload.topic);
      state.phase = 'joining';
      state.timerSeconds = 300;
      state.result = null;
      state.waitingForPartner = true;
      state.drawOfferPending = false;
      state.drawOfferIncoming = false;
      state.shouldOfferWebRTC = false;
      state.mediaError = null;
    },
    setPhase(state, action: PayloadAction<SessionPhase>) {
      state.phase = action.payload;
    },
    setWaitingForPartner(state, action: PayloadAction<boolean>) {
      state.waitingForPartner = action.payload;
    },
    sessionStarted(
      state,
      action: PayloadAction<{
        durationSeconds?: number;
        remainingSeconds?: number;
        topic?: string;
        shouldOffer: boolean;
      }>,
    ) {
      state.phase = 'active';
      state.timerSeconds =
        action.payload.remainingSeconds ??
        action.payload.durationSeconds ??
        300;
      state.waitingForPartner = false;
      state.shouldOfferWebRTC = action.payload.shouldOffer;
      if (action.payload.topic) {
        state.topic = normalizeTopicId(action.payload.topic);
      }
    },
    tickTimer(state) {
      if (state.timerSeconds > 0) state.timerSeconds -= 1;
    },
    setTimer(state, action: PayloadAction<number>) {
      state.timerSeconds = action.payload;
    },
    toggleMute(state) {
      state.isMuted = !state.isMuted;
    },
    toggleCamera(state) {
      state.isCameraOff = !state.isCameraOff;
    },
    setDrawOfferPending(state, action: PayloadAction<boolean>) {
      state.drawOfferPending = action.payload;
    },
    setDrawOfferIncoming(state, action: PayloadAction<boolean>) {
      state.drawOfferIncoming = action.payload;
    },
    setMediaError(state, action: PayloadAction<string | null>) {
      state.mediaError = action.payload;
    },
    endSession(
      state,
      action: PayloadAction<{
        outcome: DebateOutcome;
        xpEarned: number;
        speakingSeconds?: number;
        opponentSeconds?: number;
        partnerName?: string;
        topic?: string;
      }>,
    ) {
      state.phase = 'ended';
      state.drawOfferPending = false;
      state.drawOfferIncoming = false;
      state.result = {
        outcome: action.payload.outcome,
        xpEarned: action.payload.xpEarned,
        speakingSeconds: action.payload.speakingSeconds ?? 0,
        opponentSeconds: action.payload.opponentSeconds ?? 0,
        topic: action.payload.topic
          ? normalizeTopicId(action.payload.topic)
          : state.topic,
        partnerName: action.payload.partnerName ?? state.partnerName,
      };
    },
    resetSession() {
      return initialState;
    },
  },
});

export const {
  initSession,
  setPhase,
  setWaitingForPartner,
  sessionStarted,
  tickTimer,
  setTimer,
  toggleMute,
  toggleCamera,
  setDrawOfferPending,
  setDrawOfferIncoming,
  setMediaError,
  endSession,
  resetSession,
} = sessionSlice.actions;

export default sessionSlice.reducer;
