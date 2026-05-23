import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TopicId } from '@/constants/topics';
import type { MatchMode, MatchRequest, PartnerUser } from '@/types';

interface MatchNotification {
  request: MatchRequest;
}

interface MatchState {
  mode: MatchMode;
  selectedTopic: TopicId;
  cardIndex: number;
  partners: PartnerUser[];
  /** User explicitly tapped in the online list */
  selectedPartnerId: string | null;
  activePartner: PartnerUser | null;
  sending: boolean;
  exiting: boolean;
  exitDir: 'left' | 'right';
  pendingRequests: MatchRequest[];
  history: MatchRequest[];
  notification: MatchNotification | null;
  pendingRequestCount: number;
  sessionId: string | null;
  matchId: string | null;
  partnerReady: boolean;
  myReady: boolean;
  socketConnected: boolean;
  toast: string | null;
}

const initialState: MatchState = {
  mode: 'browse',
  selectedTopic: 'social_media',
  cardIndex: 0,
  partners: [],
  selectedPartnerId: null,
  activePartner: null,
  sending: false,
  exiting: false,
  exitDir: 'right',
  pendingRequests: [],
  history: [],
  notification: null,
  pendingRequestCount: 0,
  sessionId: null,
  matchId: null,
  partnerReady: false,
  myReady: false,
  socketConnected: false,
  toast: null,
};

const matchSlice = createSlice({
  name: 'match',
  initialState,
  reducers: {
    setPartners(state, action: PayloadAction<PartnerUser[]>) {
      state.partners = action.payload;
      const stillValid = action.payload.some((p) => p.id === state.selectedPartnerId);
      if (!stillValid) {
        state.selectedPartnerId = action.payload[0]?.id ?? null;
      } else if (!state.selectedPartnerId && action.payload[0]) {
        state.selectedPartnerId = action.payload[0].id;
      }
    },
    setSelectedPartner(state, action: PayloadAction<string | null>) {
      state.selectedPartnerId = action.payload;
    },
    setTopic(state, action: PayloadAction<TopicId>) {
      state.selectedTopic = action.payload;
    },
    setSending(state, action: PayloadAction<boolean>) {
      state.sending = action.payload;
    },
    setExiting(state, action: PayloadAction<{ exiting: boolean; dir?: 'left' | 'right' }>) {
      state.exiting = action.payload.exiting;
      if (action.payload.dir) state.exitDir = action.payload.dir;
    },
    skipCard(state) {
      state.exiting = true;
      state.exitDir = 'left';
    },
    advanceCard(state) {
      state.cardIndex = (state.cardIndex + 1) % Math.max(state.partners.length, 1);
      state.exiting = false;
    },
    sendRequestSuccess(
      state,
      action: PayloadAction<{ partner: PartnerUser; matchId: string }>,
    ) {
      state.activePartner = action.payload.partner;
      state.matchId = action.payload.matchId;
      state.mode = 'waiting';
      state.sending = false;
      state.exiting = false;
      state.partnerReady = false;
      state.myReady = false;
    },
    setMode(state, action: PayloadAction<MatchMode>) {
      state.mode = action.payload;
    },
    matchAccepted(
      state,
      action: PayloadAction<{ partner: PartnerUser; sessionId: string; matchId: string }>,
    ) {
      state.activePartner = action.payload.partner;
      state.sessionId = action.payload.sessionId;
      state.matchId = action.payload.matchId;
      state.mode = 'matched';
      state.notification = null;
      state.partnerReady = false;
      state.myReady = false;
    },
    matchConfirmed(state) {
      state.mode = 'confirmed';
    },
    setPartnerReady(state, action: PayloadAction<boolean>) {
      state.partnerReady = action.payload;
    },
    setMyReady(state, action: PayloadAction<boolean>) {
      state.myReady = action.payload;
    },
    resetMatchFlow(state) {
      state.mode = 'browse';
      state.activePartner = null;
      state.sessionId = null;
      state.matchId = null;
      state.sending = false;
      state.exiting = false;
      state.partnerReady = false;
      state.myReady = false;
      if (state.partners.length && !state.selectedPartnerId) {
        state.selectedPartnerId = state.partners[0].id;
      }
    },
    setNotification(state, action: PayloadAction<MatchNotification | null>) {
      state.notification = action.payload;
      state.pendingRequestCount = action.payload ? 1 : state.pendingRequestCount;
    },
    setPendingRequests(state, action: PayloadAction<MatchRequest[]>) {
      state.pendingRequests = action.payload;
      state.pendingRequestCount = action.payload.length;
    },
    addIncomingRequest(state, action: PayloadAction<MatchRequest>) {
      if (state.pendingRequests.some((r) => r.id === action.payload.id)) return;
      state.pendingRequests.unshift(action.payload);
      state.pendingRequestCount = state.pendingRequests.length;
      state.notification = { request: action.payload };
    },
    removeRequest(state, action: PayloadAction<string>) {
      state.pendingRequests = state.pendingRequests.filter((r) => r.id !== action.payload);
      state.pendingRequestCount = state.pendingRequests.length;
    },
    setSocketConnected(state, action: PayloadAction<boolean>) {
      state.socketConnected = action.payload;
    },
    setToast(state, action: PayloadAction<string | null>) {
      state.toast = action.payload;
    },
  },
});

export const {
  setPartners,
  setSelectedPartner,
  setTopic,
  setSending,
  setExiting,
  skipCard,
  advanceCard,
  sendRequestSuccess,
  setMode,
  matchAccepted,
  matchConfirmed,
  setPartnerReady,
  setMyReady,
  resetMatchFlow,
  setNotification,
  setPendingRequests,
  addIncomingRequest,
  removeRequest,
  setSocketConnected,
  setToast,
} = matchSlice.actions;

export default matchSlice.reducer;
