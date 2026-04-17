import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set, del } from 'idb-keyval';
import { Pokemon } from '../types';
import { BoxSlice, createBoxSlice } from './slices/boxSlice';
import { BattleSlice, createBattleSlice } from './slices/battleSlice';
import { SettingsSlice, createSettingsSlice } from './slices/settingsSlice';

const indexedDBStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value === undefined ? null : value;
  },
  setItem: async (name: string, value: string) => {
    await set(name, value);
  },
  removeItem: async (name: string) => {
    await del(name);
  },
};

export interface GameStorageState extends BoxSlice, BattleSlice, SettingsSlice {
  rehydrated: boolean;
  setRehydrated: (value: boolean) => void;
  resetStorage: () => void;
}

const createStore = (set: any) => ({
  ...createBoxSlice(set),
  ...createBattleSlice(set),
  ...createSettingsSlice(set),
  rehydrated: false,
  setRehydrated: (value: boolean) => set({ rehydrated: value }),
  resetStorage: () => {
    set({
      box: [],
      playerTeam: [],
      battleState: null,
      filters: { filterType: 'all', filterFav: false, sortBy: 'id' },
      view: 'hub',
    });
  },
});

export const useGameStore = create<GameStorageState>()(
  persist(createStore, {
    name: 'pkbattle-storage',
    storage: createJSONStorage(() => indexedDBStorage),
    partialize: (state) => ({
      box: state.box,
      playerTeam: state.playerTeam,
      battleState: state.battleState,
      filters: state.filters,
      view: state.view,
    }),
    onRehydrateStorage: () => (state) => {
      state?.setRehydrated(true);
    },
  })
);
