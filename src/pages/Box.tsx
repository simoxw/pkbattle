import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Search, Filter, Trash2, Copy, Heart, Plus, X } from 'lucide-react';
import { db } from '../lib/db';
import { type Pokemon, type Team } from '../types';
import { getPokemonSprite, formatTypeName, getTypeBadgeClass } from '../lib/pokemonUtils';
import BottomNav from '../components/BottomNav';

const PokemonBoxCard = ({ pokemon, onClick, onFavorite, onAdd }: any) => {
  const ivTotal = pokemon.ivs ? Object.values(pokemon.ivs).reduce((sum: number, v: any) => sum + (v as number), 0) : 0;
  const ivPercentage = Math.round(((ivTotal as number) / 186) * 100);

  return (
    <div className="relative bg-white rounded-[32px] shadow-card border-b-4 border-slate-200 p-4 flex flex-col items-center group active:scale-[0.98] transition-all overflow-hidden cursor-pointer">
      {/* Favorite Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onFavorite(pokemon.id); }}
        className={`absolute top-4 left-4 p-1.5 rounded-full transition-colors z-10 ${pokemon.isFavorite ? 'text-red-500' : 'text-slate-300 hover:text-red-400'}`}
      >
        <Heart size={20} fill={pokemon.isFavorite ? 'currentColor' : 'none'} />
      </button>

      {/* Pokedex Number */}
      <div className="absolute top-4 right-5 font-black text-[10px] text-slate-300">
        #{String(pokemon.pokemonId || pokemon.id).padStart(3, '0')}
      </div>

      {/* Sprite */}
      <div className="w-24 h-24 flex items-center justify-center mb-2 relative" onClick={onClick}>
        <img 
          src={getPokemonSprite(pokemon.pokemonId || pokemon.id)}
          alt={pokemon.name}
          className="w-full h-full object-contain drop-shadow-md"
        />
      </div>

      {/* Name */}
      <div className="text-sm font-black uppercase text-pk-dark truncate w-full text-center tracking-tighter mb-2" onClick={onClick}>
        {pokemon.name}
      </div>

      {/* Types */}
      <div className="flex gap-1 justify-center w-full mb-4" onClick={onClick}>
         {pokemon.types?.map((t: string) => (
           <div key={t} className={`px-2 py-0.5 rounded text-[8px] font-black uppercase shadow-sm ${getTypeBadgeClass(t)}`}>
             {formatTypeName(t)}
           </div>
         ))}
      </div>

      {/* Stats row */}
      <div className="w-full flex justify-between px-2 mb-4 border-t border-slate-50 pt-3" onClick={onClick}>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">LV:</span>
          <span className="text-[10px] font-black text-pk-dark">{pokemon.level}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">IV%:</span>
          <span className={`text-[10px] font-black ${ivPercentage >= 90 ? 'text-pk-gold' : ivPercentage >= 70 ? 'text-green-500' : 'text-pk-blue'}`}>
            {ivPercentage}%
          </span>
        </div>
      </div>

      {/* Add Button */}
      <button 
        onClick={(e) => { e.stopPropagation(); onAdd(pokemon.id); }}
        className="w-full bg-pk-blue text-white py-2.5 rounded-2xl font-black uppercase text-[10px] shadow-lg shadow-pk-blue/20 active:scale-95 transition-all flex items-center justify-center gap-2"
      >
        Aggiungi
      </button>
    </div>
  );
};

export default function Box() {
  const navigate = useNavigate();
  const [pokemonList, setPokemonList] = useState<any[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    nature: '',
    ability: '',
    shinyOnly: false,
    favoritesOnly: false,
    sortBy: 'dex_asc' 
  });

  const loadData = async () => {
    const stored = await db.box.toArray();
    setPokemonList(stored);
    const teams = await db.teams.toArray();
    const active = teams.find(t => t.isActive);
    setActiveTeam(active || null);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFavorite = async (id: string) => {
    const pokemon = pokemonList.find(p => p.id === id);
    if (!pokemon) return;
    await db.box.update(id, { isFavorite: !pokemon.isFavorite });
    loadData();
  };

  const handleAdd = async (id: string) => {
    if (!activeTeam) {
      alert("Crea prima una squadra attiva nella sezione Squadre!");
      return;
    }

    if (activeTeam.pokemonIds.includes(id)) {
      alert("Questo Pokémon è già nella squadra attiva!");
      return;
    }

    let newPokemonIds = [...activeTeam.pokemonIds];
    if (newPokemonIds.length >= 6) {
      // Replace the first one if full
      newPokemonIds.shift();
    }
    newPokemonIds.push(id);

    await db.teams.update(activeTeam.id, { pokemonIds: newPokemonIds });
    loadData();
  };

  const removeFromSquad = async (id: string) => {
    if (!activeTeam) return;
    const newPokemonIds = activeTeam.pokemonIds.filter(pid => pid !== id);
    await db.teams.update(activeTeam.id, { pokemonIds: newPokemonIds });
    loadData();
  };

  // Get unique values for filters from the current list
  const uniqueTypes = Array.from(new Set(pokemonList.flatMap(p => p.types || []))).sort() as string[];
  const uniqueNatures = Array.from(new Set(pokemonList.map(p => p.nature).filter(Boolean))).sort() as string[];

  const getBST = (p: Pokemon) => {
    if (!p.baseStats) return 0;
    return p.baseStats.hp + p.baseStats.attack + p.baseStats.defense + p.baseStats.spAtk + p.baseStats.spDef + p.baseStats.speed;
  };

  const filtered = pokemonList
    .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(p => !filters.type || p.types.includes(filters.type))
    .filter(p => !filters.nature || p.nature === filters.nature)
    .filter(p => !filters.ability || p.ability === filters.ability)
    .filter(p => !filters.shinyOnly || p.isShiny)
    .filter(p => !filters.favoritesOnly || p.isFavorite)
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'level_desc': return b.level - a.level;
        case 'date_desc': return (b.caughtAt || 0) - (a.caughtAt || 0);
        case 'dex_asc': return (a.pokemonId || 0) - (b.pokemonId || 0);
        case 'name_asc': return a.name.localeCompare(b.name);
        case 'bst_desc': return getBST(b) - getBST(a);
        case 'iv_desc': {
          const sumA = a.ivs ? Object.values(a.ivs).reduce((sum: number, v: any) => sum + (v as number), 0) : 0;
          const sumB = b.ivs ? Object.values(b.ivs).reduce((sum: number, v: any) => sum + (v as number), 0) : 0;
          return (sumB as number) - (sumA as number);
        }
        default: return 0;
      }
    });

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="h-[56px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-lg z-20">
        <button onClick={() => navigate('/')} className="p-2">
          <ChevronLeft size={28} strokeWidth={3} />
        </button>
        <h1 className="font-black italic uppercase tracking-tighter ml-2 flex-1 text-xl text-center">Il Mio Box</h1>
        <div className="w-10" /> {/* Spacer */}
      </header>

      {/* Filters Bar */}
      <div className="px-4 py-3 bg-white border-b border-slate-100 flex flex-col gap-3 shrink-0 shadow-sm z-10">
        <div className="flex gap-2">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5 flex items-center justify-between group active:scale-95 transition-all"
          >
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-slate-400" />
              <span className="text-[10px] font-black uppercase text-slate-500">
                {filters.type ? formatTypeName(filters.type) : 'Tutti i tipi'}
              </span>
            </div>
            <ChevronLeft size={14} className="text-slate-300 -rotate-90" />
          </button>

          <button 
            onClick={() => setFilters(f => ({ ...f, favoritesOnly: !f.favoritesOnly }))}
            className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 font-black uppercase text-[10px] transition-all active:scale-95
              ${filters.favoritesOnly ? 'bg-red-50 border-red-200 text-red-500' : 'bg-slate-50 border-slate-100 text-slate-400'}
            `}
          >
            <Heart size={14} fill={filters.favoritesOnly ? 'currentColor' : 'none'} />
            Preferiti
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 flex items-center gap-2">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Cerca per nome..." 
              className="bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase w-full py-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={filters.sortBy}
            onChange={(e) => setFilters(f => ({ ...f, sortBy: e.target.value }))}
            className="bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black uppercase py-2 px-3 outline-none"
          >
              <option value="dex_asc">Ordina per ID</option>
              <option value="date_desc">Più Recenti</option>
              <option value="name_asc">Nome A-Z</option>
              <option value="level_desc">Livello</option>
              <option value="iv_desc">IV Migliori</option>
          </select>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 gap-2 pt-1 animate-in fade-in slide-in-from-top-2">
             <div className="space-y-1">
                <select 
                  value={filters.type}
                  onChange={(e) => setFilters(f => ({ ...f, type: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase p-2"
                >
                    <option value="">Tipo</option>
                    {uniqueTypes.map(t => <option key={t} value={t}>{formatTypeName(t)}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <select 
                  value={filters.nature}
                  onChange={(e) => setFilters(f => ({ ...f, nature: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-black uppercase p-2"
                >
                    <option value="">Natura</option>
                    {uniqueNatures.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
             </div>
          </div>
        )}
      </div>

      <main className="flex-1 overflow-y-auto pb-32">
        {/* Active Squad Section */}
        <div className="p-4 bg-white border-b border-slate-100 mb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase text-pk-blue tracking-[0.2em]">
              Squadra Attiva ({activeTeam?.pokemonIds.length || 0}/6)
            </h2>
          </div>
          <div className="flex justify-between items-center bg-slate-50/50 rounded-2xl p-2 border border-slate-100">
            {[...Array(6)].map((_, i) => {
              const pkId = activeTeam?.pokemonIds[i];
              const pk = pokemonList.find(p => p.id === pkId);
              return (
                <div key={i} className="relative group">
                  <div className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center transition-all bg-white
                    ${pk ? 'border-pk-blue shadow-sm' : 'border-dashed border-slate-200'}
                  `}>
                    {pk ? (
                      <img src={getPokemonSprite(pk.pokemonId)} className="w-10 h-10 object-contain" />
                    ) : (
                      <Plus size={16} className="text-slate-200" />
                    )}
                  </div>
                  {pk && (
                    <button 
                      onClick={() => removeFromSquad(pk.id)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md active:scale-90 transition-transform"
                    >
                      <X size={10} strokeWidth={4} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Box Grid */}
        <div className="p-4 grid grid-cols-2 gap-4">
          {filtered.map((p) => (
            <PokemonBoxCard 
              key={p.id} 
              pokemon={p} 
              onClick={() => navigate(`/box/${p.id}`)}
              onFavorite={handleFavorite}
              onAdd={handleAdd}
            />
          ))}
        </div>
        
        {filtered.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-2 opacity-30">
            <Search size={48} />
            <span className="font-black text-sm uppercase">Nessun Pokémon trovato</span>
          </div>
        )}
      </main>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-50">
         <button onClick={() => navigate('/box/import')} className="w-12 h-12 bg-slate-800 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
           <Copy size={20} />
         </button>
         <button className="w-12 h-12 bg-pk-red text-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all">
           <Trash2 size={20} />
         </button>
      </div>

      <BottomNav />
    </div>
  );
}
