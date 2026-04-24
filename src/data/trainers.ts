
export interface Trainer {
  id: string;
  name: string;
  title: string;
  sprite: string;
  team: number[]; // Pokémon IDs
  quote: string;
}

export const TRAINERS: Trainer[] = [
  {
    id: 'red',
    name: 'ROSSO',
    title: 'LEGGENDA',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/red.png',
    team: [25, 6, 9, 3, 131, 143], // Pikachu, Charizard, Blastoise, Venusaur, Lapras, Snorlax
    quote: '...!'
  },
  {
    id: 'blue',
    name: 'BLU',
    title: 'CAMPIONE',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/blue.png',
    team: [18, 65, 112, 103, 130, 6], // Pidgeot, Alakazam, Rhydon, Exeggutor, Gyarados, Charizard
    quote: 'Ehi! Sapevo che saresti venuto qui!'
  },
  {
    id: 'cynthia',
    name: 'CAMILLA',
    title: 'CAMPIONESSA',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png',
    team: [445, 448, 423, 407, 442, 350], // Garchomp, Lucario, Gastrodon, Roserade, Spiritomb, Milotic
    quote: 'Hai intenzione di sfidare la Campionessa?'
  },
  {
    id: 'steven',
    name: 'ROCCO',
    title: 'CAMPIONE',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/steven.png',
    team: [376, 227, 344, 348, 306, 346], // Metagross, Skarmory, Claydol, Armaldo, Aggron, Cradily
    quote: 'La forza delle pietre è eterna.'
  },
  {
    id: 'lance',
    name: 'LANCE',
    title: 'CAMPIONE',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/lance.png',
    team: [149, 130, 142, 148, 130, 6], // Dragonite, Gyarados, Aerodactyl, Dragonair, Gyarados, Charizard
    quote: 'Senti la potenza dei draghi!'
  },
  {
    id: 'giovanni',
    name: 'GIOVANNI',
    title: 'CAPO TEAM ROCKET',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/giovanni.png',
    team: [112, 53, 31, 34, 115, 68], // Rhydon, Persian, Nidoqueen, Nidoking, Kangaskhan, Machamp
    quote: 'Il Team Rocket è immortale.'
  },
  {
    id: 'leon',
    name: 'DANDÈ',
    title: 'CAMPIONE',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/leon.png',
    team: [6, 867, 865, 448, 143, 887], // Charizard, Mr. Rime, Sirfetch'd, Lucario, Snorlax, Dragapult
    quote: 'È il momento di divertirsi un mondo!'
  },
  {
    id: 'diantha',
    name: 'DIANTHA',
    title: 'CAMPIONESSA',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/diantha.png',
    team: [282, 706, 691, 697, 701, 442], // Gardevoir, Goodra, Dragalge, Tyrantrum, Hawlucha, Spiritomb
    quote: 'La bellezza è la forza più grande.'
  },
  {
    id: 'iris',
    name: 'IRIS',
    title: 'CAMPIONESSA',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/iris.png',
    team: [612, 635, 149, 621, 567, 306], // Haxorus, Hydreigon, Dragonite, Druddigon, Archeops, Aggron
    quote: 'Ti mostrerò quanto sono cresciuta!'
  },
  {
    id: 'alder',
    name: 'NABARDO',
    title: 'CAMPIONE',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/alder.png',
    team: [637, 584, 617, 626, 565, 621], // Volcarona, Vanilluxe, Accelgor, Bouffalant, Carracosta, Druddigon
    quote: 'La vita è un viaggio senza fine.'
  },
  {
    id: 'wallace',
    name: 'ADRIANO',
    title: 'CAMPIONE',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/wallace.png',
    team: [350, 73, 272, 340, 130, 121], // Milotic, Tentacruel, Ludicolo, Whiscash, Gyarados, Starmie
    quote: 'L\'acqua riflette la tua anima.'
  },
  {
    id: 'ash',
    name: 'ASH',
    title: 'CAMPIONE MONDIALE',
    sprite: 'https://play.pokemonshowdown.com/sprites/trainers/ash.png',
    team: [25, 448, 865, 94, 445, 804], // Pikachu, Lucario, Sirfetch'd, Gengar, Dragonite, Dracovish (using similar IDs)
    quote: 'Gotta catch \'em all!'
  }
];
