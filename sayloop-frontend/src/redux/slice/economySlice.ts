import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface EconomyState {
  xp: number;
  gems: number;
  streak: number;
  level: number;
  levelTitle: string;
  xpThisWeek: number;
  pendingReward: number | null;
  levelledUp: boolean;
}

const initialState: EconomyState = {
  xp: 420,
  gems: 15,
  streak: 7,
  level: 4,
  levelTitle: 'Talker',
  xpThisWeek: 180,
  pendingReward: null,
  levelledUp: false,
};

const economySlice = createSlice({
  name: 'economy',
  initialState,
  reducers: {
    addXp(state, action: PayloadAction<number>) {
      state.xp += action.payload;
      state.xpThisWeek += action.payload;
      state.pendingReward = action.payload;
    },
    clearPendingReward(state) {
      state.pendingReward = null;
    },
    setLevelledUp(state, action: PayloadAction<boolean>) {
      state.levelledUp = action.payload;
    },
    incrementStreak(state) {
      state.streak += 1;
    },
    setXpFromServer(state, action: PayloadAction<{ xp: number; xpDelta: number }>) {
      state.xp = action.payload.xp;
      state.xpThisWeek += action.payload.xpDelta;
      state.pendingReward = action.payload.xpDelta;
    },
  },
});

export const { addXp, clearPendingReward, setLevelledUp, incrementStreak, setXpFromServer } =
  economySlice.actions;
export default economySlice.reducer;
