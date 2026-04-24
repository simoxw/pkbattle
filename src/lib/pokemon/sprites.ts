/**
 * Genera URL per gli sprite e artwork dei Pokémon
 */
export const getPokemonSprite = (id: number | string, type: 'animated' | 'hd' | 'static' = 'static') => {
  if (type === 'animated') {
    // Showdown Animated Sprites (Gen 5 style)
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/${id}.gif`;
  }
  if (type === 'hd') {
    // Official Artwork HD
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }
  // Standard Sprite
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
};
