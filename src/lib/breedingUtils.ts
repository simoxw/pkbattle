import { type Pokemon, type Stats } from '../types';

/**
 * Genera un nuovo Pokémon (Uovo) da due genitori
 */
export function generateEgg(
  parentA: Pokemon,
  parentB: Pokemon,
  heldItemA?: string | null,
  heldItemB?: string | null
): Partial<Pokemon> {
  const stats: (keyof Stats)[] = ['hp', 'attack', 'defense', 'spAtk', 'spDef', 'speed'];
  
  // 1. Ereditarietà IV
  // 4 IV scelti tra i migliori dei genitori
  // 2 IV sono la media arrotondata
  const inheritedIvs: Partial<Stats> = {};
  const shuffledStats = [...stats].sort(() => Math.random() - 0.5);
  
  // Primi 4: prendiamo il migliore
  shuffledStats.slice(0, 4).forEach(stat => {
    inheritedIvs[stat] = Math.max(parentA.ivs[stat], parentB.ivs[stat]);
  });
  
  // Ultimi 2: media arrotondata
  shuffledStats.slice(4, 6).forEach(stat => {
    inheritedIvs[stat] = Math.round((parentA.ivs[stat] + parentB.ivs[stat]) / 2);
  });

  // 2. Natura
  let childNature = 'Seria'; // Default
  const natures = ['Timida', 'Modesta', 'Decisa', 'Allegra', 'Calma', 'Sicura', 'Ardita'];
  childNature = natures[Math.floor(Math.random() * natures.length)];

  if (heldItemA === 'Pietrastante' && Math.random() < 0.5) childNature = parentA.nature;
  else if (heldItemB === 'Pietrastante' && Math.random() < 0.5) childNature = parentB.nature;

  // 3. Specie (prende dalla madre o casuale se Ditto)
  const childSpeciesId = parentA.pokemonId === 132 ? parentB.pokemonId : parentA.pokemonId;

  return {
    pokemonId: childSpeciesId,
    level: 1,
    exp: 0,
    ivs: inheritedIvs as Stats,
    evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
    nature: childNature,
    caughtAt: Date.now(),
    isShiny: Math.random() < 1/4096,
    happiness: 70,
  };
}
