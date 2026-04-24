import { db } from './db';

const BASE_URL = 'https://pokeapi.co/api/v2';

/**
 * Fetch con cache su IndexedDB
 */
export async function fetchWithCache<T>(path: string): Promise<T> {
  const fullPath = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  
  // Controlla cache
  const cached = await db.masterData.get(fullPath);
  if (cached && (Date.now() - cached.timestamp < 1000 * 60 * 60 * 24 * 7)) {
    return cached.data;
  }

  // Fetch reale
  const response = await fetch(fullPath);
  if (!response.ok) throw new Error(`PokeAPI error: ${response.status}`);
  const data = await response.json();

  // Salva in cache
  await db.masterData.put({ id: fullPath, data, timestamp: Date.now() });
  
  return data;
}

/**
 * Download del Master Data in batch
 */
export async function downloadMasterData(
  onProgress: (progress: number) => void
) {
  const batchSize = 50;
  const totalPokemon = 1025;
  
  // PHASE-3: Scaricare anche mosse, abilità, catene evolutive in batch
  
  for (let i = 0; i < totalPokemon; i += batchSize) {
    const limit = Math.min(batchSize, totalPokemon - i);
    const offset = i;
    
    // Esempio batch pokemon species
    const response = await fetch(`${BASE_URL}/pokemon-species?offset=${offset}&limit=${limit}`);
    const data = await response.json();
    
    // Per semplicità qui salviamo solo i riferimenti, 
    // in un'app reale scaricheremmo i dettagli di ogni pokemon
    await Promise.all(data.results.map((item: any) => fetchWithCache(item.url)));
    
    const progress = Math.min(100, Math.round(((i + limit) / totalPokemon) * 100));
    onProgress(progress);
    
    // Debounce/Throttling per evitare rate limited
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}
