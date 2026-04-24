import { type Pokemon } from '../types';

export interface EvolutionTrigger {
  type: 'level' | 'stone' | 'happiness' | 'other';
  threshold?: number;
  itemName?: string;
  targetId: number;
}

/**
 * Controlla se un Pokémon può evolversi
 */
export function canEvolve(
  pokemon: Pokemon,
  triggerType: 'level' | 'stone' | 'happiness',
  usedItem?: string
): EvolutionTrigger | null {
  // In un'app reale questi dati verrebbero dal masterData scaricato da PokeAPI
  // Qui implementiamo una logica di esempio/fallback
  
  const mockEvolutions: Record<number, EvolutionTrigger[]> = {
    1: [{ type: 'level', threshold: 16, targetId: 2 }], // Bulbasaur -> Ivysaur
    4: [{ type: 'level', threshold: 16, targetId: 5 }], // Charmander -> Charmeleon
    7: [{ type: 'level', threshold: 16, targetId: 8 }], // Squirtle -> Wartortle
    25: [{ type: 'stone', itemName: 'Pietratuono', targetId: 26 }], // Pikachu -> Raichu
    133: [
      { type: 'stone', itemName: 'Pietra focaia', targetId: 136 }, // Eevee -> Flareon
      { type: 'happiness', threshold: 220, targetId: 196 } // Eevee -> Espeon
    ]
  };

  const possibleEvos = mockEvolutions[pokemon.pokemonId];
  if (!possibleEvos) return null;

  for (const evo of possibleEvos) {
    if (evo.type === triggerType) {
      if (triggerType === 'level' && (pokemon.level >= (evo.threshold || 0))) return evo;
      if (triggerType === 'stone' && usedItem === evo.itemName) return evo;
      if (triggerType === 'happiness' && ((pokemon.happiness || 0) >= (evo.threshold || 0))) return evo;
    }
  }

  return null;
}
