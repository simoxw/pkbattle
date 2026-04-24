import Dexie, { type Table } from 'dexie';
import { type Pokemon, type Team } from '../types';
import minimalData from '../data/minimalData.json';

import { calculateStats } from './battleEngine';

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
        const toAdd = minimalData.pokemon.map((p: any) => {
          const level = p.level || 5;
          const nature = p.nature || 'Docile';
          const ivs = p.ivs || { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 };
          const evs = p.evs || { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
          const baseStats = p.baseStats || p.stats;
          const realStats = calculateStats(level, baseStats, ivs, evs, nature);

          return {
            ...p,
            id: p.id.toString(),
            pokemonId: p.pokemonId || p.id,
            level,
            exp: p.exp || 0,
            ivs,
            evs,
            baseStats,
            stats: realStats,
            currentHp: realStats.hp,
            moves: p.moves || [],
            nature,
            ability: p.ability || 'Abilità Base',
            isShiny: !!p.isShiny,
            caughtAt: Date.now(),
            growthRate: p.growthRate || 'medium-slow'
          };
        });
        await this.box.bulkAdd(toAdd);
      } else {
        // Repair task: fix existing broken pokemon
        const allBox = await this.box.toArray();
        const broken = allBox.filter(p => !p.pokemonId || !p.stats || !p.baseStats);
        if (broken.length > 0) {
          console.log(`Repairing ${broken.length} broken Pokémon in Box...`);
          for (const pk of broken) {
            const updates: any = {};
            const pokemonId = pk.pokemonId || parseInt(pk.id) || 1;
            const level = pk.level || 5;
            const nature = pk.nature || 'Docile';
            const ivs = pk.ivs || { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 };
            const evs = pk.evs || { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
            const baseStats = pk.baseStats || pk.stats || { hp: 50, attack: 50, defense: 50, spAtk: 50, spDef: 50, speed: 50 };
            
            const realStats = calculateStats(level, baseStats, ivs, evs, nature);
            
            updates.pokemonId = pokemonId;
            updates.baseStats = baseStats;
            updates.stats = realStats;
            updates.ivs = ivs;
            updates.evs = evs;
            updates.level = level;
            updates.nature = nature;
            if (pk.currentHp === undefined) updates.currentHp = realStats.hp;

            await this.box.update(pk.id, updates);
          }
        }
      }
    });
  }
}

export const db = new PokeArenaDB();
