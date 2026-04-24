import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState } from '../types/store.types';
import { createUserSlice } from './slices/createUserSlice';
import { createInventorySlice } from './slices/createInventorySlice';
import { createSettingsSlice } from './slices/createSettingsSlice';

export const useStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createUserSlice(...a),
      ...createInventorySlice(...a),
      ...createSettingsSlice(...a),
    }),
    { name: 'poke-arena-storage' }
  )
);
