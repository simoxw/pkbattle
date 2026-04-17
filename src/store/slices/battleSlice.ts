import { BattleState, Pokemon } from '../../types';

export interface BattleSlice {
  playerTeam: Pokemon[];
  battleState: BattleState | null;
  setPlayerTeam: (team: Pokemon[]) => void;
  setBattleState: (battleState: BattleState | null) => void;
  resetBattleState: () => void;
}

export const createBattleSlice = (set: any): BattleSlice => ({
  playerTeam: [],
  battleState: null,
  setPlayerTeam: (team) => set({ playerTeam: team }),
  setBattleState: (battleState) => set({ battleState }),
  resetBattleState: () => set({ playerTeam: [], battleState: null }),
});
