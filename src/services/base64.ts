
export function decodeTeam(base64: string): number[] {
  try {
    const json = atob(base64);
    const data = JSON.parse(json);

    // Handle single object (like the one provided in the request)
    if (data && typeof data === 'object' && !Array.isArray(data)) {
        const id = data.pokemonId || data.id;
        if (typeof id === 'number') return [id];
        if (typeof id === 'string') return [parseInt(id) || 1];
    }

    if (Array.isArray(data)) {
      // Check if it's an array of objects or IDs
      if (typeof data[0] === 'number') return data.slice(0, 6);
      if (typeof data[0] === 'object' && data[0]) {
         return data.map((item: any) => item.pokemonId || item.id).filter(id => id).slice(0, 6);
      }
    }
    // Fallback if it was just a comma separated string inside base64
    if (typeof data === 'string' && data.includes(',')) {
        return data.split(',').map(id => parseInt(id.trim())).slice(0, 6);
    }
    return [];
  } catch (e) {
    console.error("Failed to decode team:", e);
    return [];
  }
}

export function encodeTeam(ids: number[]): string {
    return btoa(JSON.stringify(ids));
}
