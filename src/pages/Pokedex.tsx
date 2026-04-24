import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, Filter, Sparkles, Smartphone, Info } from 'lucide-react';
import { getPokemonSprite, formatTypeName, getTypeBadgeClass } from '../lib/pokemonUtils';
import BottomNav from '../components/BottomNav';

export default function Pokedex() {
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    const fetchPokedex = async () => {
      try {
        // Fetching first 151 for performance in preview, can be extended
        const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=151');
        const data = await res.json();
        const results = await Promise.all(data.results.map(async (p: any) => {
          const detailRes = await fetch(p.url);
          return detailRes.json();
        }));
        setPokemon(results.map(r => ({
          id: r.id,
          name: r.name,
          types: r.types.map((t: any) => t.type.name),
          stats: r.stats
        })));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPokedex();
  }, []);

  const filteredPokemon = pokemon.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.id.toString() === searchTerm;
    const matchesType = selectedType === 'all' || p.types.includes(selectedType);
    return matchesSearch && matchesType;
  });

  const types = ['all', 'grass', 'fire', 'water', 'bug', 'normal', 'poison', 'electric', 'ground', 'fairy', 'fighting', 'psychic', 'rock', 'ghost', 'ice', 'dragon', 'dark', 'steel', 'flying'];

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="h-[60px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-md">
        <Smartphone size={20} className="mr-3 text-pk-gold" />
        <h1 className="font-black uppercase tracking-tighter text-xl">Pokédex Nazionale</h1>
      </header>

      <div className="p-4 bg-white border-b border-slate-200">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Cerca per nome o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-100 border-none rounded-2xl py-3 pl-10 pr-4 text-sm font-bold focus:ring-2 focus:ring-pk-red"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {types.map(t => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap border-2
                ${selectedType === t ? 'bg-pk-dark text-white border-pk-dark' : 'bg-white text-slate-400 border-slate-100'}
              `}
            >
              {t === 'all' ? 'Tutti' : formatTypeName(t)}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 bg-pk-light/10 pb-32">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
             <div className="w-10 h-10 border-4 border-pk-red border-t-transparent rounded-full animate-spin"></div>
             <p className="font-black text-xs uppercase tracking-widest">Sincronizzazione Dati...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {filteredPokemon.map(pk => (
              <div 
                key={pk.id}
                className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col items-center group relative overflow-hidden active:scale-95 transition-all text-center"
              >
                <div className="absolute top-3 right-4 font-black text-[10px] text-slate-200">#{pk.id.toString().padStart(3, '0')}</div>
                <div className="w-24 h-24 relative mb-2">
                   <div className="absolute inset-0 bg-slate-50 rounded-full scale-75 group-hover:scale-90 transition-transform"></div>
                   <img 
                      src={getPokemonSprite(pk.id, 'static')}
                      alt={pk.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain relative z-10 group-hover:scale-110 transition-transform"
                   />
                </div>
                <h3 className="font-black uppercase text-xs tracking-tight text-pk-dark truncate w-full mb-2">{pk.name}</h3>
                <div className="flex gap-1 justify-center">
                   {pk.types.map((t: string) => (
                     <span key={t} className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full text-white ${getTypeBadgeClass(t).split(' ')[0]}`}>
                        {formatTypeName(t)}
                     </span>
                   ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
