export interface ItemData {
  id: string;
  name: string;
  category: 'cure' | 'utili' | 'breeding';
  description: string;
  effect: (target: any) => string;
}

export const ITEMS: Record<string, ItemData> = {
  'Pozione': {
    id: 'pozione',
    name: 'Pozione',
    category: 'cure',
    description: 'Ripristina 20 PS.',
    effect: (pk) => {
      pk.currentHp = Math.min(pk.stats.hp, pk.currentHp + 20);
      return 'Fatto! Pozione usata.';
    }
  },
  'Super Pozione': {
    id: 'super-pozione',
    name: 'Super Pozione',
    category: 'cure',
    description: 'Ripristina 50 PS.',
    effect: (pk) => {
      pk.currentHp = Math.min(pk.stats.hp, pk.currentHp + 50);
      return 'Fatto! Super Pozione usata.';
    }
  },
  'Iperpozione': {
    id: 'iper-pozione',
    name: 'Iperpozione',
    category: 'cure',
    description: 'Ripristina 200 PS.',
    effect: (pk) => {
      pk.currentHp = Math.min(pk.stats.hp, pk.currentHp + 200);
      return 'Fatto! Iperpozione usata.';
    }
  },
  'Antidoto': {
    id: 'antidoto',
    name: 'Antidoto',
    category: 'cure',
    description: 'Cura lo stato di avvelenamento.',
    effect: (pk) => {
      pk.status = undefined;
      return 'Veleno curato!';
    }
  },
  'Poké Ball': {
    id: 'pokeball',
    name: 'Poké Ball',
    category: 'utili',
    description: 'Strumento per catturare Pokémon selvatici.',
    effect: () => 'Non puoi usarla qui!'
  },
  'Caramella Rara': {
    id: 'caramella-rara',
    name: 'Caramella Rara',
    category: 'utili',
    description: 'Aumenta il livello di 1.',
    effect: (pk) => {
      pk.level += 1;
      return 'Livello aumentato!';
    }
  },
  'Pietraidrica': {
    id: 'pietraidrica',
    name: 'Pietraidrica',
    category: 'breeding',
    description: 'Evolve certi Pokémon.',
    effect: () => 'Evoluzione!'
  }
};
