
import { Pokemon, Move } from '../types';

const POKE_API_BASE = 'https://pokeapi.co/api/v2';

export async function fetchPokemon(idOrName: number | string, level = 50): Promise<Pokemon> {
  const response = await fetch(`${POKE_API_BASE}/pokemon/${idOrName}`);
  const data = await response.json();

  const stats = data.stats.reduce((acc: any, curr: any) => {
    acc[curr.stat.name] = curr.base_stat;
    return acc;
  }, {});

  // Fetch 4 moves randomly for now if not specified
  const movePromises = data.moves
    .slice(0, 10) // Select from first 10 for simplicity in this demo, or randomized
    .sort(() => 0.5 - Math.random())
    .slice(0, 4)
    .map(async (m: any) => {
      const mRes = await fetch(m.move.url);
      const mData = await mRes.json();
      const flavorText = mData.flavor_text_entries.find((e: any) => e.language.name === 'it' || e.language.name === 'en');
      return {
        name: mData.name.replace('-', ' '),
        type: mData.type.name,
        power: mData.power || 0,
        accuracy: mData.accuracy || 100,
        pp: mData.pp || 20,
        description: flavorText ? flavorText.flavor_text : '',
        priority: mData.priority,
        category: mData.damage_class.name,
      } as Move;
    });

  const moves = await Promise.all(movePromises);

  // Fetch Ability
  const abilityInfo = data.abilities[0];
  let ability = { name: 'Sconosciuta', description: '' };
  if (abilityInfo) {
    const aRes = await fetch(abilityInfo.ability.url);
    const aData = await aRes.json();
    const aFlavor = aData.flavor_text_entries.find((e: any) => e.language.name === 'it' || e.language.name === 'en');
    ability = {
       name: aData.name.replace('-', ' '),
       description: aFlavor ? aFlavor.flavor_text : ''
    };
  }

  const ivs = {
    hp: Math.floor(Math.random() * 32),
    attack: Math.floor(Math.random() * 32),
    defense: Math.floor(Math.random() * 32),
    spAtk: Math.floor(Math.random() * 32),
    spDef: Math.floor(Math.random() * 32),
    speed: Math.floor(Math.random() * 32),
  };

  // Scaled stats for level 50 roughly
  const scale = (base: number, iv: number) => Math.floor(((2 * base + iv) * level) / 100 + level + 10);
  const hpScale = (base: number, iv: number) => Math.floor(((2 * base + iv) * level) / 100 + level + 110);

  return {
    id: data.id,
    uniqueId: Math.random().toString(36).substr(2, 9),
    name: data.name.toUpperCase(),
    types: data.types.map((t: any) => t.type.name),
    hp: hpScale(stats.hp, ivs.hp),
    maxHp: hpScale(stats.hp, ivs.hp),
    attack: scale(stats.attack, ivs.attack),
    defense: scale(stats.defense, ivs.defense),
    specialAttack: scale(stats['special-attack'], ivs.spAtk),
    specialDefense: scale(stats['special-defense'], ivs.spDef),
    speed: scale(stats.speed, ivs.speed),
    moves,
    sprite: data.sprites.front_default || data.sprites.other['official-artwork'].front_default,
    backSprite: data.sprites.back_default || data.sprites.front_default,
    level,
    ivs,
    evs: { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 },
    nature: 'Seria',
    ability,
    baseStats: {
        hp: stats.hp,
        attack: stats.attack,
        defense: stats.defense,
        spAtk: stats['special-attack'],
        spDef: stats['special-defense'],
        speed: stats.speed,
    },
    isFavorite: false,
  };
}

export async function fetchLearnableMoves(pokemonId: number): Promise<Move[]> {
  const response = await fetch(`${POKE_API_BASE}/pokemon/${pokemonId}`);
  const data = await response.json();
  
  // Get first 20 learnable moves to avoid massive fetch
  const learnable = data.moves.slice(0, 20);
  
  const movePromises = learnable.map(async (m: any) => {
    const mRes = await fetch(m.move.url);
    const mData = await mRes.json();
    const flavorText = mData.flavor_text_entries.find((e: any) => e.language.name === 'it' || e.language.name === 'en');
    return {
      name: mData.name.replace('-', ' '),
      type: mData.type.name,
      power: mData.power || 0,
      accuracy: mData.accuracy || 100,
      pp: mData.pp || 20,
      description: flavorText ? flavorText.flavor_text : '',
      priority: mData.priority,
      category: mData.damage_class.name,
    } as Move;
  });

  return Promise.all(movePromises);
}
export function getTypeMultiplier(attackType: string, defenderTypes: string[]): number {
  const typeChart: Record<string, Record<string, number>> = {
    normal: { rock: 0.5, ghost: 0, steel: 0.5 },
    fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2 },
    grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon: { dragon: 2, steel: 0.5, fairy: 0.5 },
    dark: { fighting: 0.5, psychic: 2, dark: 0.5, fairy: 0.5 },
    steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
  };

  let multiplier = 1;
  for (const defType of defenderTypes) {
    if (typeChart[attackType] && typeChart[attackType][defType] !== undefined) {
      multiplier *= typeChart[attackType][defType];
    }
  }
  return multiplier;
}

export function calculateDamage(attacker: Pokemon, defender: Pokemon, move: Move) {
  // Simple damage formula
  // Damage = ((((2 * Level / 5 + 2) * Power * A/D) / 50) + 2) * Modifier
  const isSpecial = ['fire', 'water', 'grass', 'electric', 'ice', 'psychic', 'dragon', 'dark'].includes(move.type);
  const A = isSpecial ? attacker.specialAttack : attacker.attack;
  const D = isSpecial ? defender.specialDefense : defender.defense;
  
  const baseDamage = Math.floor((((2 * attacker.level / 5 + 2) * move.power * A / D) / 50) + 2);
  
  // Type modifiers
  const typeMultiplier = getTypeMultiplier(move.type, defender.types);
  const roll = Math.random() * (1 - 0.85) + 0.85; // Random roll 0.85 - 1.0
  
  const damage = Math.floor(baseDamage * typeMultiplier * roll);
  
  return {
    damage,
    multiplier: typeMultiplier
  };
}
