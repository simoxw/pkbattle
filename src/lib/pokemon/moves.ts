/**
 * Recupera mosse consigliate per un Pokémon tramite PokeAPI o fallback
 */
export const getRecommendedMoves = async (pokemonId: number | string) => {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = await res.json();
    
    // Filtriamo per mosse che hanno potenza o sono di stato utili
    const movesPromises = data.moves.slice(0, 15).map((m: any) => 
      fetch(m.move.url).then(r => r.json())
    );
    
    const movesData = await Promise.all(movesPromises);
    
    const uniqueMoves = Array.from(
      new Map(movesData.map(m => [m.name, m])).values()
    );

    return uniqueMoves
      .filter(m => m.power !== null || m.meta?.category?.name === 'net-good-stats')
      .slice(0, 4)
      .map(m => ({
        id: m.name,
        name: m.names.find((n: any) => n.language.name === 'it')?.name || m.name.charAt(0).toUpperCase() + m.name.slice(1),
        type: m.type.name,
        power: m.power || 0,
        category: (m.damage_class.name === 'status' ? 'status' : (m.damage_class.name === 'special' ? 'special' : 'physical')) as 'physical' | 'special' | 'status',
        accuracy: m.accuracy || 100,
        pp: m.pp,
        maxPp: m.pp,
        priority: m.priority || 0,
        description: m.flavor_text_entries?.find((f: any) => f.language.name === 'it')?.flavor_text || 'Descrizione non disponibile.',
        stat_changes: m.stat_changes?.map((sc: any) => ({
          stat: sc.stat.name.replace('special-', 'sp'),
          change: sc.change,
          target: m.target.name === 'selected-pokemon' ? 'opponent' : 'self'
        }))
      }));
  } catch (e) {
    console.warn("Failed to fetch moves", e);
    return [
      { 
        id: 'scontro',
        name: 'Scontro', 
        type: 'normal', 
        power: 40, 
        category: 'physical' as const, 
        accuracy: 100, 
        pp: 35,
        maxPp: 35,
        priority: 0,
        description: 'Attacco fisico base.'
      }
    ];
  }
};

/**
 * Ottiene una mossa specifica imparata ad un certo livello
 */
export const getMoveAtLevel = async (pokemonId: number, level: number) => {
  try {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
    const data = await res.json();
    
    const moveAtLevel = data.moves.find((m: any) => {
      const levelUpDetails = m.version_group_details.find((d: any) => 
        d.move_learn_method.name === 'level-up' && d.level_learned_at === level
      );
      return !!levelUpDetails;
    });

    if (!moveAtLevel) return null;

    const moveRes = await fetch(moveAtLevel.move.url);
    const m = await moveRes.json();

    return {
      id: m.name,
      name: m.names.find((n: any) => n.language.name === 'it')?.name || m.name.charAt(0).toUpperCase() + m.name.slice(1),
      type: m.type.name,
      power: m.power || 0,
      category: (m.damage_class.name === 'status' ? 'status' : (m.damage_class.name === 'special' ? 'special' : 'physical')) as 'physical' | 'special' | 'status',
      accuracy: m.accuracy || 100,
      pp: m.pp,
      maxPp: m.pp,
      priority: m.priority || 0,
      description: m.flavor_text_entries?.find((f: any) => f.language.name === 'it')?.flavor_text || 'Descrizione non disponibile.',
      stat_changes: m.stat_changes?.map((sc: any) => ({
        stat: sc.stat.name.replace('special-', 'sp'),
        change: sc.change,
        target: m.target.name === 'selected-pokemon' ? 'opponent' : 'self'
      }))
    };
  } catch (e) {
    return null;
  }
};
