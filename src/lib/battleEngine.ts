import { type Pokemon, type Move } from '../types';
import { typeChart } from './typeChart';

export interface DamageResult {
  damage: number;
  isCritical: boolean;
  effectiveness: number;
  stab: number;
}

/**
 * Calcola il moltiplicatore delle statistiche in base agli stadi (-6 a +6)
 */
export function getStatStageMultiplier(stage: number): number {
  const multipliers: Record<number, number> = {
    '-6': 2/8, '-5': 2/7, '-4': 2/6, '-3': 2/5, '-2': 2/4, '-1': 2/3,
    '0': 1,
    '1': 1.5, '2': 2, '3': 2.5, '4': 3, '5': 3.5, '6': 4
  };
  return multipliers[stage] || 1;
}

export const NATURE_MODS: Record<string, { up: string; down: string }> = {
  Lonely:   { up: 'attack',  down: 'defense' },
  Schiva:   { up: 'attack',  down: 'defense' },
  Brave:    { up: 'attack',  down: 'speed'   },
  Audace:   { up: 'attack',  down: 'speed'   },
  Adamant:  { up: 'attack',  down: 'spAtk'   },
  Decisa:   { up: 'attack',  down: 'spAtk'   },
  Naughty:  { up: 'attack',  down: 'spDef'   },
  Birbona:  { up: 'attack',  down: 'spDef'   },
  Bold:     { up: 'defense', down: 'attack'  },
  Sicura:   { up: 'defense', down: 'attack'  },
  Relaxed:  { up: 'defense', down: 'speed'   },
  Placida:  { up: 'defense', down: 'speed'   },
  Impish:   { up: 'defense', down: 'spAtk'   },
  Scaltra:  { up: 'defense', down: 'spAtk'   },
  Lax:      { up: 'defense', down: 'spDef'   },
  Fiacca:   { up: 'defense', down: 'spDef'   },
  Timid:    { up: 'speed',   down: 'attack' },
  Timida:   { up: 'speed',   down: 'attack'  },
  Hasty:    { up: 'speed',   down: 'defense' },
  Lesta:    { up: 'speed',   down: 'defense' },
  Jolly:    { up: 'speed',   down: 'spAtk'   },
  Allegra:  { up: 'speed',   down: 'spAtk'   },
  Naive:    { up: 'speed',   down: 'spDef'   },
  Ingenua:  { up: 'speed',   down: 'spDef'   },
  Modest:   { up: 'spAtk',   down: 'attack'  },
  Modesta:  { up: 'spAtk',   down: 'attack'  },
  Mild:     { up: 'spAtk',   down: 'defense' },
  Mite:     { up: 'spAtk',   down: 'defense' },
  Quiet:    { up: 'spAtk',   down: 'speed'   },
  Quieta:   { up: 'spAtk',   down: 'speed'   },
  Rash:     { up: 'spAtk',   down: 'spDef'   },
  Ardente:  { up: 'spAtk',   down: 'spDef'   },
  Calm:     { up: 'spDef',   down: 'attack'  },
  Calma:    { up: 'spDef',   down: 'attack'  },
  Gentle:   { up: 'spDef',   down: 'defense' },
  Gentile:  { up: 'spDef',   down: 'defense' },
  Sassy:    { up: 'spDef',   down: 'speed'   },
  Vivace:   { up: 'spDef',   down: 'speed'   },
  Careful:  { up: 'spDef',   down: 'spAtk'   },
  Cauta:    { up: 'spDef',   down: 'spAtk'   },
};

/**
 * Calcola le statistiche finali secondo la formula ufficiale
 */
export function calculateStats(level: number, baseStats: any, ivs: any, evs: any, nature: string): any {
  const stats: any = {};
  
  // HP Formula: ((2 * Base + IV + (EV/4)) * Level / 100) + Level + 10
  stats.hp = Math.floor(((2 * baseStats.hp + (ivs?.hp || 31) + Math.floor((evs?.hp || 0) / 4)) * level) / 100) + level + 10;
  
  // Other Stats: (((2 * Base + IV + (EV/4)) * Level / 100) + 5) * Nature
  const otherStats = ['attack', 'defense', 'spAtk', 'spDef', 'speed'];
  otherStats.forEach(stat => {
    let val = Math.floor(((2 * baseStats[stat as keyof typeof baseStats] + (ivs?.[stat] || 31) + Math.floor((evs?.[stat] || 0) / 4)) * level) / 100) + 5;
    
    // Apply nature multiplier
    const mod = NATURE_MODS[nature];
    if (mod) {
      if (mod.up === stat) val = Math.floor(val * 1.1);
      if (mod.down === stat) val = Math.floor(val * 0.9);
    }
    
    stats[stat] = val;
  });

  return stats;
}

/**
 * Calcola il danno secondo la formula ufficiale Gen 9
 */
export function calculateDamage(
  attacker: { level: number, stats: any, types: string[], status?: string | null },
  defender: { stats: any, types: string[] },
  move: Move,
  stageA: number = 0,
  stageD: number = 0
): DamageResult {
  // Se la mossa è di stato o potenza nulla, il danno è 0
  if (move.category === 'status' || !move.power || move.power === 0) {
    return { damage: 0, isCritical: false, effectiveness: 1, stab: 1 };
  }

  // 1. Statistiche A (Attacco) e D (Difesa) con moltiplicatori di stadio
  const isSpecial = move.category === 'special';
  let A = isSpecial ? attacker.stats.spAtk : attacker.stats.attack;
  let D = isSpecial ? defender.stats.spDef : defender.stats.defense;

  A = Math.floor(A * getStatStageMultiplier(stageA));
  D = Math.floor(D * getStatStageMultiplier(stageD));

  // 2. Formula Base: ((2 * Level / 5 + 2) * Power * A / D) / 50 + 2
  let baseDamage = (((2 * attacker.level) / 5 + 2) * move.power * A) / D;
  baseDamage = baseDamage / 50 + 2;

  // 3. Moltiplicatore Critico (1/24 chance di base)
  const isCritical = Math.random() < 1 / 24;
  const criticalMultiplier = isCritical ? 1.5 : 1;

  // 4. Moltiplicatore Random (0.85 - 1.0)
  const randomMultiplier = Math.random() * (1 - 0.85) + 0.85;

  // 5. STAB (Same Type Attack Bonus)
  const isStab = attacker.types.includes(move.type);
  const stabMultiplier = isStab ? 1.5 : 1;

  // 6. Efficacia dei Tipi
  let effectivenessMultiplier = 1;
  defender.types.forEach((defType) => {
    const mult = typeChart[move.type.toLowerCase()]?.[defType.toLowerCase()] ?? 1;
    effectivenessMultiplier *= mult;
  });

  // 7. Status Effects
  let statusMultiplier = 1;
  // BRN: -50% attacco fisico
  if (attacker.status === 'BRN' && move.category === 'physical') {
    statusMultiplier = 0.5;
  }

  // 8. Calcolo Finale
  const totalDamage = Math.floor(
    baseDamage *
    criticalMultiplier *
    randomMultiplier *
    stabMultiplier *
    effectivenessMultiplier *
    statusMultiplier
  );

  return {
    damage: Math.max(1, totalDamage),
    isCritical,
    effectiveness: effectivenessMultiplier,
    stab: stabMultiplier,
  };
}

/**
 * Applica il danno a un Pokémon e restituisce l'istanza aggiornata
 */
export function applyDamage(pokemon: Pokemon, damage: number): Pokemon {
  return {
    ...pokemon,
    currentHp: Math.max(0, pokemon.currentHp - damage),
  };
}
