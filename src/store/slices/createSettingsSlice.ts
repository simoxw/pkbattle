import { StateCreator } from 'zustand';
import { AppState, SettingsSlice } from '../../types/store.types';

export const createSettingsSlice: StateCreator<AppState, [], [], SettingsSlice> = (set) => ({
  expShareEnabled: true,
  toggleExpShare: () => set((state) => ({ expShareEnabled: !state.expShareEnabled })),
});
