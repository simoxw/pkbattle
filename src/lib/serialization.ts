import { type Pokemon } from '../types';

/**
 * Converte una stringa in Base64 in modo sicuro per UTF-8
 */
const toBase64 = (str: string) => btoa(unescape(encodeURIComponent(str)));

/**
 * Converte Base64 in stringa UTF-8
 */
const fromBase64 = (str: string) => decodeURIComponent(escape(atob(str)));

/**
 * Converte un'istanza Pokémon in una stringa Base64
 */
export const encodePokemon = (pokemon: Pokemon): string => {
  return toBase64(JSON.stringify(pokemon));
};

/**
 * Converte una stringa Base64 in un'istanza Pokémon
 */
export const decodePokemon = (base64: string): Pokemon => {
  return JSON.parse(fromBase64(base64)) as Pokemon;
};

/**
 * Converte un array di Pokémon in Base64
 */
export const encodeTeam = (team: any): string => {
  return toBase64(JSON.stringify(team));
};

/**
 * Decodifica una squadra da Base64
 */
export const decodeTeam = (base64: string): any => {
  try {
    return JSON.parse(fromBase64(base64));
  } catch (e) {
    console.error("Error decoding team", e);
    return null;
  }
};
