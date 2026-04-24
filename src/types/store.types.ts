export interface UserSlice {
  coins: number;
  rankStats: {
    wins: number;
    losses: number;
    points: number;
  };
  addCoins: (amount: number) => void;
  removeCoins: (amount: number) => void;
  updateRankStats: (wins: number, losses: number, points: number) => void;
}

export interface InventorySlice {
  inventory: Record<string, number>;
  addItem: (id: string, qty?: number) => void;
  removeItem: (id: string, qty?: number) => void;
}

export interface SettingsSlice {
  expShareEnabled: boolean;
  toggleExpShare: () => void;
}

export type AppState = UserSlice & InventorySlice & SettingsSlice;
