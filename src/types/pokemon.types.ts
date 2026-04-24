export type StatName = 'hp' | 'attack' | 'defense' | 'spAtk' | 'spDef' | 'speed';

export interface Stats {
  hp: number;
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

export interface Move {
  id: string;
  name: string;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  maxPp: number;
  priority: number;
  category: 'physical' | 'special' | 'status';
  description: string;
  meta?: any;
  stat_changes?: any[];
}

export interface Pokemon {
  id: string;                    // uuid istanza
  pokemonId: number;             // national dex
  name: string;
  level: number;
  exp: number;
  types: string[];
  baseStats: Stats;
  ivs: Stats;
  evs: Stats;
  stats: Stats;
  nature: string;                // nome italiano
  ability: string;               // nome italiano
  heldItem: string | null;
  moves: Move[];                 // max 4
  currentHp: number;
  status: string | null;
  isShiny: boolean;
  isFavorite?: boolean;
  caughtAt: number;              // timestamp ms
  growthRate: string;
  baseSpeciesId: number;
  happiness?: number;            // per evoluzioni amicizia
}
