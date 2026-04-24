/**
 * Ottiene i dati della specie evoluta e i criteri di evoluzione
 */
export const getEvolutionData = async (pokemonId: number) => {
  try {
    const speciesRes = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    const speciesData = await speciesRes.json();
    const evolutionRes = await fetch(speciesData.evolution_chain.url);
    const evolutionData = await evolutionRes.json();

    const findEvolution = (chain: any, currentId: number): any => {
      if (parseInt(chain.species.url.split('/').filter(Boolean).pop()) === currentId) {
        return chain.evolves_to;
      }
      for (const next of chain.evolves_to) {
        const found = findEvolution(next, currentId);
        if (found) return found;
      }
      return null;
    };

    const possibleEvolutions = findEvolution(evolutionData.chain, pokemonId);
    if (!possibleEvolutions || possibleEvolutions.length === 0) return null;

    // Prendiamo la prima evoluzione disponibile (semplificato)
    const evo = possibleEvolutions[0];
    const details = evo.evolution_details.find((d: any) => d.trigger.name === 'level-up');
    
    if (details) {
      return {
        toId: parseInt(evo.species.url.split('/').filter(Boolean).pop()),
        toName: evo.species.name,
        minLevel: details.min_level || 0
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};
