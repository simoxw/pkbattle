
export interface Trainer {
  id: string;
  name: string;
  sprite: string;
  team: number[]; // Pokémon IDs
  quote: string;
}

export const TRAINERS: Trainer[] = [
  {
    id: 'red',
    name: 'ROSSO',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/red.png',
    team: [25, 6, 9, 3, 131, 143], // Pikachu, Charizard, Blastoise, Venusaur, Lapras, Snorlax
    quote: '...!'
  },
  {
    id: 'blue',
    name: 'BLU',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png',
    team: [18, 65, 112, 103, 130, 6], // Pidgeot, Alakazam, Rhydon, Exeggutor, Gyarados, Charizard
    quote: 'Ehi! Sapevo che saresti venuto qui!'
  },
  {
    id: 'cynthia',
    name: 'CAMILLA',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png',
    team: [445, 448, 423, 407, 442, 350], // Garchomp, Lucario, Gastrodon, Roserade, Spiritomb, Milotic
    quote: 'Hai intenzione di sfidare la Campionessa?'
  },
  {
    id: 'steven',
    name: 'ROCCO',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png',
    team: [376, 227, 344, 348, 306, 346], // Metagross, Skarmory, Claydol, Armaldo, Aggron, Cradily
    quote: 'La forza delle pietre è eterna.'
  },
  {
    id: 'lance',
    name: 'LANCE',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/lance.png',
    team: [149, 130, 142, 148, 148, 6], // Dragonite, Gyarados, Aerodactyl, Dragonair, Dragonair, Charizard
    quote: 'Senti la potenza dei draghi!'
  },
  {
    id: 'giovanni',
    name: 'GIOVANNI',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/giovanni.png',
    team: [112, 53, 31, 34, 115, 68], // Rhydon, Persian, Nidoqueen, Nidoking, Kangaskhan, Machamp
    quote: 'Il Team Rocket è immortale.'
  }
];
