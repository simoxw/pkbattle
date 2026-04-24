import { StateCreator } from 'zustand';
import { AppState, InventorySlice } from '../../types/store.types';

export const createInventorySlice: StateCreator<AppState, [], [], InventorySlice> = (set) => ({
  inventory: {
    'Poké Ball': 10,
    'Pozione': 5,
    'Caramella Rara': 2
  },
  addItem: (id, qty = 1) => set((state) => ({
    inventory: { ...state.inventory, [id]: (state.inventory[id] || 0) + qty }
  })),
  removeItem: (id, qty = 1) => set((state) => {
    const newQty = (state.inventory[id] || 0) - qty;
    const newInventory = { ...state.inventory };
    if (newQty <= 0) delete newInventory[id];
    else newInventory[id] = newQty;
    return { inventory: newInventory };
  }),
});
