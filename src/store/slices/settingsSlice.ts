export interface SettingsSlice {
  filters: {
    filterType: string;
    filterFav: boolean;
    sortBy: 'level' | 'ivs' | 'id';
  };
  setFilterType: (filterType: string) => void;
  setFilterFav: (filterFav: boolean) => void;
  setSortBy: (sortBy: 'level' | 'ivs' | 'id') => void;
  resetSettings: () => void;
}

export const createSettingsSlice = (set: any): SettingsSlice => ({
  filters: {
    filterType: 'all',
    filterFav: false,
    sortBy: 'id',
  },
  setFilterType: (filterType) => set((state: any) => ({ filters: { ...state.filters, filterType } })),
  setFilterFav: (filterFav) => set((state: any) => ({ filters: { ...state.filters, filterFav } })),
  setSortBy: (sortBy) => set((state: any) => ({ filters: { ...state.filters, sortBy } })),
  resetSettings: () => set({ filters: { filterType: 'all', filterFav: false, sortBy: 'id' } }),
});
