export interface Team {
  id: string;
  name: string;
  pokemonIds: string[];          // IDs di istanze nel Box
  isActive: boolean;
  createdAt: number;
}
