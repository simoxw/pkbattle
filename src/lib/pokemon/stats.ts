/**
 * Calcola l'esperienza necessaria per il prossimo livello
 */
/**
 * Calcola l'esperienza totale cumulativa necessaria per raggiungere un certo livello
 */
const getTotalExpForLevel = (level: number, growthRate: string = 'medium'): number => {
  const L = Math.max(1, level);
  switch (growthRate?.toLowerCase()) {
    case 'fast':
      return Math.floor((4 * Math.pow(L, 3)) / 5);
    case 'medium-fast':
    case 'medium':
      return Math.pow(L, 3);
    case 'slow':
      return Math.floor((5 * Math.pow(L, 3)) / 4);
    case 'medium-slow':
    default:
      // Formula Medium-Slow ufficiale: 1.2L^3 - 15L^2 + 100L - 140
      // Nota: la formula può dare valori negativi per livelli molto bassi (<2), gestiamo con max(0)
      return Math.max(0, Math.floor(1.2 * Math.pow(L, 3) - 15 * Math.pow(L, 2) + 100 * L - 140));
  }
};

/**
 * Calcola l'esperienza necessaria per passare dal livello corrente al successivo (Delta)
 */
export const getExpToNextLevel = (level: number, growthRate: string = 'medium-slow') => {
  return getTotalExpForLevel(level + 1, growthRate) - getTotalExpForLevel(level, growthRate);
};

/**
 * Ottiene i dati base di un Pokémon (statistiche, tipi, nome)
 */
export const getSpeciesBasicData = async (pokemonId: number) => {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = await res.json();
    
    return {
      name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
      types: data.types.map((t: any) => t.type.name),
      baseStats: {
        hp: data.stats.find((s: any) => s.stat.name === 'hp').base_stat,
        attack: data.stats.find((s: any) => s.stat.name === 'attack').base_stat,
        defense: data.stats.find((s: any) => s.stat.name === 'defense').base_stat,
        spAtk: data.stats.find((s: any) => s.stat.name === 'special-attack').base_stat,
        spDef: data.stats.find((s: any) => s.stat.name === 'special-defense').base_stat,
        speed: data.stats.find((s: any) => s.stat.name === 'speed').base_stat,
      }
    };
  } catch (e) {
    return null;
  }
};
