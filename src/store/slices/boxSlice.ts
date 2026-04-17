import { Pokemon } from '../../types';

export interface BoxSlice {
  box: Pokemon[];
  setBox: (pokemon: Pokemon[]) => void;
  addToBox: (pokemon: Pokemon) => void;
  updateBox: (uniqueId: string, updater: (pokemon: Pokemon) => Pokemon) => void;
  resetBox: () => void;
}

export const createBoxSlice = (set: any): BoxSlice => ({
  box: [],
  setBox: (pokemon) => set({ box: pokemon }),
  addToBox: (pokemon) => set((state: any) => ({ box: [...state.box, pokemon] })),
  updateBox: (uniqueId, updater) => set((state: any) => ({
    box: state.box.map((p: Pokemon) => p.uniqueId === uniqueId ? updater(p) : p),
  })),
  resetBox: () => set({ box: [] }),
});
