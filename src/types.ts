
export interface Move {
  name: string;
  type: string;
  power: number;
  accuracy: number;
  pp: number;
  description?: string;
  effect?: string;
  priority?: number;
  category?: 'physical' | 'special' | 'status';
}

export interface Pokemon {
  id: number;
  uniqueId?: string;
  name: string;
  types: string[];
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  specialAttack: number;
  specialDefense: number;
  speed: number;
  moves: Move[];
  sprite: string;
  backSprite: string;
  level: number;
  fainted?: boolean;
  nature?: string;
  ability?: {
    name: string;
    description: string;
  };
  baseStats?: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  ivs?: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  evs?: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  isFavorite?: boolean;
}

export interface LogEntry {
  text: string;
  color?: string;
  damage?: number;
}

export interface Trainer {
  id: string;
  name: string;
  sprite: string;
  team: number[];
  quote: string;
}

export interface BattleState {
  playerTeam: Pokemon[];
  opponentTeam: Pokemon[];
  playerActiveIndex: number;
  opponentActiveIndex: number;
  turn: 'player' | 'opponent';
  history: LogEntry[];
  status: 'idle' | 'selecting' | 'attacking' | 'switching' | 'ended';
  winner?: 'player' | 'opponent';
  opponentTrainer?: Trainer;
}
