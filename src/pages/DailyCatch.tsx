import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Sparkles, Timer, Plus } from 'lucide-react';
import { db } from '../lib/db';
import { getPokemonSprite, getRecommendedMoves } from '../lib/pokemonUtils';
import { type Pokemon } from '../types';
import { calculateStats, NATURE_MODS } from '../lib/battleEngine';
import BottomNav from '../components/BottomNav';

export default function DailyCatch() {
  const navigate = useNavigate();
  const [availablePokemon, setAvailablePokemon] = useState<any[]>([]);
  const [cooldown, setCooldown] = useState<number>(0); // ms
  const [loading, setLoading] = useState(true);

  const COOLDOWN_TIME = 2 * 60 * 60 * 1000; // 2 ore

  const fetchPokemonNames = async (ids: number[]) => {
    try {
      const promises = ids.map(id => fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(res => res.json()));
      const results = await Promise.all(promises);
      return results.map(r => ({
        id: r.id,
        name: r.name.charAt(0).toUpperCase() + r.name.slice(1),
        types: r.types.map((t: any) => t.type.name),
        stats: r.stats.reduce((acc: any, s: any) => {
          const nameMap: any = { 'hp': 'hp', 'attack': 'attack', 'defense': 'defense', 'special-attack': 'spAtk', 'special-defense': 'spDef', 'speed': 'speed' };
          acc[nameMap[s.stat.name]] = s.base_stat;
          return acc;
        }, {})
      }));
    } catch (e) {
      return ids.map(id => ({ id, name: `PKMN #${id}`, types: ['???'], stats: null }));
    }
  };

  useEffect(() => {
    const checkDaily = async () => {
      const settings = (await db.settings.get('daily_catch')) as any;
      const now = Date.now();
      
      const lastCatch = settings ? settings.lastCatchAt : 0;
      const isCooldown = settings && (now - lastCatch < COOLDOWN_TIME);
      
      const seedToUse = isCooldown ? lastCatch : now;
      const baseList = generateDailyBaseList(seedToUse);
      const detailedList = await fetchPokemonNames(baseList.map(p => p.id));
      
      setAvailablePokemon(baseList.map((p, i) => ({ ...p, ...detailedList[i] })));
      
      if (isCooldown) {
        setCooldown(COOLDOWN_TIME - (now - lastCatch));
      } else {
        setCooldown(0);
      }
      setLoading(false);
    };

    checkDaily();
    const interval = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const generateDailyBaseList = (seed: number) => {
    const list = [];
    const dateSeed = Math.floor(seed / COOLDOWN_TIME);
    for (let i = 0; i < 8; i++) {
       const pkId = (Math.floor(Math.abs(Math.sin(dateSeed + i) * 1025)) % 1025) + 1;
       list.push({ 
         id: pkId,
         level: 5 + (Math.floor(Math.abs(Math.cos(dateSeed + i) * 20))),
         isShiny: Math.random() < 0.05
       });
    }
    return list;
  };

  const handleCatch = async (pk: any) => {
    if (cooldown > 0) return;

    setLoading(true);
    const moves = await getRecommendedMoves(pk.id);
    
    // Genera natura casuale (solo nomi italiani per coerenza UI)
    const italianNatures = [
      'Schiva', 'Audace', 'Decisa', 'Birbona', 'Sicura', 'Placida', 'Scaltra', 'Fiacca',
      'Timida', 'Lesta', 'Allegra', 'Ingenua', 'Modesta', 'Mite', 'Quieta', 'Ardente',
      'Calma', 'Gentile', 'Vivace', 'Cauta', 'Docile', 'Seria', 'Ritrosa', 'Ardita', 'Furba'
    ];
    const nature = italianNatures[Math.floor(Math.random() * italianNatures.length)];
    const growthRates = ['fast', 'medium', 'medium-slow', 'slow'];
    const growthRate = growthRates[Math.floor(Math.random() * growthRates.length)];

    const ivs = { 
      hp: Math.floor(Math.random() * 32), 
      attack: Math.floor(Math.random() * 32), 
      defense: Math.floor(Math.random() * 32), 
      spAtk: Math.floor(Math.random() * 32), 
      spDef: Math.floor(Math.random() * 32), 
      speed: Math.floor(Math.random() * 32) 
    };
    const evs = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };

    // Calcola statistiche reali
    const realStats = calculateStats(pk.level, pk.stats, ivs, evs, nature);

    // Crea istanza pokemon reale
    const newPk: Partial<Pokemon> = {
      id: crypto.randomUUID(),
      pokemonId: pk.id,
      name: pk.name,
      level: pk.level,
      exp: 0,
      types: pk.types,
      nature,
      ability: 'Abilità Base', // Placeholder
      baseStats: pk.stats || { hp: 50, attack: 50, defense: 50, spAtk: 50, spDef: 50, speed: 50 },
      stats: realStats,
      ivs,
      evs,
      moves: moves,
      currentHp: realStats.hp,
      isShiny: pk.isShiny,
      caughtAt: Date.now(),
      growthRate: growthRate
    };

    await db.box.add(newPk as Pokemon);
    await db.settings.put({ id: 'daily_catch', lastCatchAt: Date.now() });
    
    alert(`Ottimo! Hai catturato ${pk.name}!`);
    navigate('/box');
  };

  const formatTime = (ms: number) => {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) return null;

  return (
    <div className="flex flex-col h-screen bg-pk-light">
      <header className="h-[60px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black uppercase tracking-tighter ml-2">Daily Catch</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col items-center pb-28">
         <div className="bg-white rounded-2xl p-6 shadow-card w-full text-center mb-6">
            <div className="flex items-center justify-center gap-2 text-pk-gold mb-2">
               <Timer size={24} />
               <span className="font-black text-2xl tracking-tighter">{cooldown > 0 ? formatTime(cooldown) : 'DISPONIBILE!'}</span>
            </div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
               {cooldown > 0 ? 'Prossima cattura tra...' : 'Scegli un Pokémon da aggiungere al Box!'}
            </p>
         </div>

         <div className="grid grid-cols-2 gap-4 w-full">
            {availablePokemon.map((pk, i) => (
              <button
                key={i}
                disabled={cooldown > 0}
                onClick={() => handleCatch(pk)}
                className={`bg-white rounded-3xl p-4 shadow-lg border-4 transition-all relative flex flex-col items-center group
                  ${cooldown > 0 ? 'opacity-40 grayscale border-slate-200' : 'border-transparent hover:border-pk-gold active:scale-95'}
                `}
              >
                {pk.isShiny && <Sparkles className="absolute top-3 left-3 text-pk-gold animate-pulse" size={16} />}
                <div className="absolute top-3 right-3 font-black text-[10px] text-slate-300">L.{pk.level}</div>
                <img 
                  src={getPokemonSprite(pk.id, 'hd')}
                  alt="Daily"
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 object-contain mt-2 group-hover:scale-110 transition-transform"
                />
                <div className="mt-4 bg-pk-dark text-white px-4 py-1 rounded-full flex items-center gap-2">
                   <Plus size={14} className="text-pk-gold" />
                   <span className="font-black text-xs uppercase tracking-tight">CATTURA</span>
                </div>
              </button>
            ))}
         </div>
      </main>
      <BottomNav />
    </div>
  );
}
