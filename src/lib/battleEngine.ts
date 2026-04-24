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

/**
 * Calcola il danno secondo la formula ufficiale Gen 9
 */
export function calculateDamage(
  attacker: { level: number, stats: any, types: string[] },
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

  // 7. Calcolo Finale
  const totalDamage = Math.floor(
    baseDamage *
    criticalMultiplier *
    randomMultiplier *
    stabMultiplier *
    effectivenessMultiplier
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
