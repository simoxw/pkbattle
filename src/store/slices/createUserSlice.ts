import { StateCreator } from 'zustand';
import { AppState, UserSlice } from '../../types/store.types';

export const createUserSlice: StateCreator<AppState, [], [], UserSlice> = (set) => ({
  coins: 1250,
  rankStats: {
    wins: 0,
    losses: 0,
    points: 0
  },
  addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
  removeCoins: (amount) => set((state) => ({ coins: state.coins - amount })),
  updateRankStats: (w, l, p) => set((state) => ({
    rankStats: {
      wins: state.rankStats.wins + w,
      losses: state.rankStats.losses + l,
      points: Math.max(0, state.rankStats.points + p)
    }
  })),
});
