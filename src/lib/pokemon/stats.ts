/**
 * Calcola l'esperienza necessaria per il prossimo livello
 */
export const getExpToNextLevel = (level: number) => {
  // Formula Medium-Slow semplificata (parabolica): L^3
  return Math.pow(level, 3);
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
