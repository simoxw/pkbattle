import Dexie, { type Table } from 'dexie';
import { type Pokemon, type Team } from '../types';
import minimalData from '../data/minimalData.json';

export class PokeArenaDB extends Dexie {
  masterData!: Table<any>;
  box!: Table<Pokemon>;
  teams!: Table<Team>;
  inventory!: Table<any>;
  settings!: Table<any>;

  constructor() {
    super('PokeArenaDB');
    this.version(1).stores({
      masterData: 'id',
      box: 'id, pokemonId, name, level, nature, ability, isFavorite',
      teams: 'id, name, isActive',
      inventory: 'id',
      settings: 'id'
    });

    // Seeding iniziale se il box è vuoto + Repair task
    this.on('ready', async () => {
      const count = await this.box.count();
      if (count === 0) {
        console.log('Seeding minimal dataset into Box...');
        // Trasformiamo i dati minimal in oggetti Pokemon validi (string IDs)
        const toAdd = minimalData.pokemon.map((p: any) => ({
          ...p,
          id: p.id.toString(), // Convertiamo in stringa per consistenza
          pokemonId: p.pokemonId || p.id,
          level: p.level || 5,
          exp: p.exp || 0,
          ivs: p.ivs || { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 },
          evs: p.evs || { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
          baseStats: p.baseStats || p.stats,
          stats: p.stats || p.baseStats,
          currentHp: (p.stats || p.baseStats).hp,
          moves: p.moves || [],
          nature: p.nature || 'Docile',
          ability: p.ability || 'Aiutoerba', // Fallback base
          isShiny: !!p.isShiny,
          caughtAt: Date.now(),
          growthRate: p.growthRate || 'medium-slow'
        }));
        await this.box.bulkAdd(toAdd);
      } else {
        // Repair task: fix existing broken pokemon (starters without pokemonId)
        const allBox = await this.box.toArray();
        const broken = allBox.filter(p => !p.pokemonId || !p.stats);
        if (broken.length > 0) {
          console.log(`Repairing ${broken.length} broken Pokémon in Box...`);
          for (const pk of broken) {
            const updates: any = {};
            if (!pk.pokemonId) updates.pokemonId = parseInt(pk.id) || 1;
            if (!pk.stats) updates.stats = pk.baseStats;
            if (pk.level === undefined) updates.level = 5;
            if (pk.exp === undefined) updates.exp = 0;
            if (pk.currentHp === undefined && (pk.stats || pk.baseStats)) updates.currentHp = (pk.stats || pk.baseStats).hp;
            if (Object.keys(updates).length > 0) {
              await this.box.update(pk.id, updates);
            }
          }
        }
      }
    });
  }
}

export const db = new PokeArenaDB();
