import { configureStore } from '@reduxjs/toolkit';
import economyReducer from '@/redux/slice/economySlice';
import matchReducer from '@/redux/slice/matchSlice';
import sessionReducer from '@/redux/slice/sessionSlice';

const store = configureStore({
  reducer: {
    economy: economyReducer,
    match: matchReducer,
    session: sessionReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
