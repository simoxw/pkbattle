import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, Share2, Trash2, Heart, Award, Zap, Shield, Swords as AttackIcon, Wind, Sparkles } from 'lucide-react';
import { db } from '../lib/db';
import { type Pokemon } from '../types';
import { getPokemonSprite, formatTypeName, getTypeColor, getTypeBadgeClass, getExpToNextLevel } from '../lib/pokemonUtils';
import { calculateDamage, calculateStats, NATURE_MODS } from '../lib/battleEngine';
import { encodePokemon } from '../lib/serialization';
import BottomNav from '../components/BottomNav';

const StatBar = ({ label, value, max = 255, color, icon: Icon, iv, ev, modifier }: any) => (
  <div className="space-y-1">
    <div className="flex justify-between items-end px-1">
       <div className="flex items-center gap-1.5 min-w-[70px]">
          <Icon size={12} className={modifier === 'up' ? 'text-rose-500' : modifier === 'down' ? 'text-blue-500' : 'text-slate-400'} />
          <span className={`text-[10px] font-black uppercase tracking-tighter ${modifier === 'up' ? 'text-rose-600' : modifier === 'down' ? 'text-blue-600' : 'text-slate-400'}`}>
            {label}
            {modifier === 'up' && <span className="ml-0.5 text-rose-500">+</span>}
            {modifier === 'down' && <span className="ml-0.5 text-blue-500">-</span>}
          </span>
       </div>
       <div className="flex-1 px-4 flex justify-end gap-3 mr-2">
          {iv !== undefined && <span className="text-[9px] font-black text-pk-blue/60 tabular-nums">IV {iv.toString().padStart(2, '0')}</span>}
          {ev !== undefined && <span className="text-[9px] font-black text-emerald-500/60 tabular-nums">EV {ev.toString().padStart(3, '0')}</span>}
       </div>
       <span className={`text-xs font-black tabular-nums w-[25px] text-right ${modifier === 'up' ? 'text-rose-600' : modifier === 'down' ? 'text-blue-600' : 'text-pk-dark'}`}>{value}</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
       <motion.div 
         initial={{ width: 0 }}
         animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
         className={`h-full ${modifier === 'up' ? 'bg-rose-500' : modifier === 'down' ? 'bg-blue-500' : color} transition-all duration-500 rounded-full shadow-inner`}
       />
    </div>
  </div>
);

export default function BoxDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);

  useEffect(() => {
    const load = async () => {
      // id può venire come stringa numerica da minimalData o UUID
      const pk = await db.box.get(id as string) || await db.box.get(parseInt(id as any));
      if (pk) setPokemon(pk);
    };
    load();
  }, [id]);

  if (!pokemon) return (
    <div className="flex flex-col items-center justify-center h-screen bg-pk-light gap-4">
       <div className="w-12 h-12 border-4 border-pk-red border-t-transparent rounded-full animate-spin"></div>
       <p className="font-black text-xs uppercase text-slate-400 tracking-widest">Pokémon non trovato...</p>
    </div>
  );

  const handleShare = () => {
    if (!pokemon) return;
    // Creiamo una pulizia dell'oggetto per evitare dati non necessari (come id locale)
    const cleanPk = { ...pokemon };
    delete (cleanPk as any).id; 
    
    const code = encodePokemon(cleanPk as any);
    
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(code)
        .then(() => alert(`Codice di ${pokemon.name} copiato! Incollalo nella sezione Social.`))
        .catch(() => prompt(`Copia questo codice per condividere ${pokemon.name}:`, code));
    } else {
      prompt(`Copia questo codice per condividere ${pokemon.name}:`, code);
    }
  };

  const handleDelete = async () => {
    if (confirm(`Sei sicuro di voler rilasciare ${pokemon.name}?`)) {
      await db.box.delete(pokemon.id);
      navigate('/box');
    }
  };

  const natureMod = NATURE_MODS[pokemon.nature];

  return (
    <div className="flex flex-col h-screen bg-pk-light overflow-hidden font-sans">
      <header className="h-[60px] bg-pk-red text-white flex items-center justify-between px-4 shrink-0 shadow-md z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <span className="font-black uppercase tracking-widest text-[11px]">Informazioni Pokémon</span>
        <div className="flex gap-2">
           <button onClick={handleShare} className="p-2 bg-white/20 rounded-xl active:bg-white/40 transition-colors"><Share2 size={18}/></button>
           <button onClick={handleDelete} className="p-2 bg-white/10 rounded-xl active:bg-red-500/30 transition-colors"><Trash2 size={18}/></button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
         {/* Hero Section */}
         <section className="bg-gradient-to-b from-slate-100 to-white pt-10 pb-12 px-6 flex flex-col items-center relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none select-none text-[200px] font-black tracking-tighter leading-none flex items-center justify-center">
              PKMN
            </div>

            <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
               <span className="text-pk-dark/10 font-black text-6xl leading-none -ml-4">#{pokemon.pokemonId?.toString().padStart(3, '0') || '???'}</span>
               <div className="flex gap-2 flex-wrap">
                  {pokemon.types.map(t => (
                    <span key={t} className={`${getTypeBadgeClass(t)} text-[10px] font-black uppercase px-4 py-1.5 rounded-full shadow-lg tracking-[0.1em]`}>
                      {formatTypeName(t)}
                    </span>
                  ))}
               </div>
            </div>
            
            <div className="relative mt-8 group">
               <div className="absolute inset-0 bg-pk-gold/20 blur-[60px] rounded-full scale-150 animate-pulse"></div>
               {pokemon.isShiny && <Sparkles className="absolute -top-6 -right-6 text-pk-gold animate-bounce z-20" size={40} />}
               <motion.img 
                 initial={{ scale: 0.8, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 src={getPokemonSprite(pokemon.pokemonId || (parseInt(id || '1') || 1), 'hd')}
                 alt={pokemon.name}
                 referrerPolicy="no-referrer"
                 className="w-56 h-56 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.2)] relative z-10 transition-transform group-hover:scale-110"
               />
            </div>

            <h1 className="text-4xl font-black uppercase tracking-tighter mt-6 text-pk-dark text-center select-all">{pokemon.name}</h1>
            <div className="flex flex-col items-center gap-3 mt-2 w-full max-w-[240px]">
               <div className="flex items-center gap-3 w-full justify-center">
                 <div className="flex flex-col items-center">
                   <span className="bg-pk-dark text-pk-gold text-[10px] font-black px-4 py-1 rounded-full uppercase shadow-lg tracking-widest border border-pk-gold/20">Livello {pokemon.level}</span>
                 </div>
                 <div className="h-6 w-px bg-slate-200"></div>
                 <div className="flex flex-col">
                   <span className="text-slate-400 font-extrabold text-[11px] uppercase tracking-wider italic">Natura {pokemon.nature}</span>
                   {natureMod && (
                     <div className="flex gap-2 justify-center items-center">
                        <span className="text-[8px] font-black text-rose-500 uppercase">+{natureMod.up.replace('spAtk', 'SpA').replace('spDef', 'SpD')}</span>
                        <span className="text-[8px] font-black text-blue-500 uppercase">-{natureMod.down.replace('spAtk', 'SpA').replace('spDef', 'SpD')}</span>
                     </div>
                   )}
                 </div>
               </div>
               
               {/* EXP Bar */}
               <div className="w-full space-y-1">
                 <div className="flex justify-between items-center px-1">
                   <span className="text-[8px] font-black uppercase text-slate-400">Punti Esperienza ({pokemon.growthRate || 'medium'})</span>
                   <span className="text-[9px] font-black text-pk-blue tabular-nums">{Math.floor(pokemon.exp || 0).toLocaleString()} / {getExpToNextLevel(pokemon.level, pokemon.growthRate).toLocaleString()}</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden shadow-inner border border-white/50">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((pokemon.exp || 0) / getExpToNextLevel(pokemon.level, pokemon.growthRate)) * 100)}%` }}
                      className="h-full bg-pk-blue shadow-[0_0_8px_rgba(59,76,202,0.3)] transition-all duration-700"
                    />
                 </div>
               </div>
            </div>
         </section>

         {/* Stats Panel */}
         <section className="px-5 space-y-5 pb-32">
            <div className="bg-white rounded-[32px] p-6 shadow-card border border-slate-100">
               <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-red-100 text-pk-red rounded-xl flex items-center justify-center">
                      <Award size={18} />
                    </div>
                    <h2 className="font-black text-xs uppercase tracking-widest text-pk-dark/80 underline decoration-pk-red decoration-2 underline-offset-4">Statistiche & IV</h2>
                  </div>
                  <div className="text-[9px] font-black text-slate-400 bg-slate-50 px-3 py-1 rounded-full uppercase tracking-tighter border border-slate-100">Potenziale Max / 255</div>
               </div>
               
               <div className="grid grid-cols-1 gap-5">
                  <StatBar label="PS" value={pokemon.stats?.hp || 0} iv={pokemon.ivs?.hp} ev={pokemon.evs?.hp} color="bg-green-500 shadow-green-200" icon={Heart} />
                  <StatBar label="Attacco" value={pokemon.stats?.attack || 0} iv={pokemon.ivs?.attack} ev={pokemon.evs?.attack} color="bg-red-500 shadow-red-200" icon={AttackIcon} modifier={natureMod?.up === 'attack' ? 'up' : natureMod?.down === 'attack' ? 'down' : null} />
                  <StatBar label="Difesa" value={pokemon.stats?.defense || 0} iv={pokemon.ivs?.defense} ev={pokemon.evs?.defense} color="bg-orange-500 shadow-orange-200" icon={Shield} modifier={natureMod?.up === 'defense' ? 'up' : natureMod?.down === 'defense' ? 'down' : null} />
                  <StatBar label="Attacco Sp." value={pokemon.stats?.spAtk || 0} iv={pokemon.ivs?.spAtk} ev={pokemon.evs?.spAtk} color="bg-blue-500 shadow-blue-200" icon={Zap} modifier={natureMod?.up === 'spAtk' ? 'up' : natureMod?.down === 'spAtk' ? 'down' : null} />
                  <StatBar label="Difesa Sp." value={pokemon.stats?.spDef || 0} iv={pokemon.ivs?.spDef} ev={pokemon.evs?.spDef} color="bg-purple-500 shadow-purple-200" icon={Shield} modifier={natureMod?.up === 'spDef' ? 'up' : natureMod?.down === 'spDef' ? 'down' : null} />
                  <StatBar label="Velocità" value={pokemon.stats?.speed || 0} iv={pokemon.ivs?.speed} ev={pokemon.evs?.speed} color="bg-pink-500 shadow-pink-200" icon={Wind} modifier={natureMod?.up === 'speed' ? 'up' : natureMod?.down === 'speed' ? 'down' : null} />
               </div>
            </div>

            {/* Moves List */}
            <div className="bg-white rounded-3xl p-6 shadow-card">
               <div className="flex items-center gap-2 mb-4">
                  <Zap size={18} className="text-pk-blue" />
                  <h2 className="font-black text-xs uppercase tracking-widest text-slate-500">Mosse Conosciute</h2>
               </div>
                <div className="grid grid-cols-1 gap-2">
                   {pokemon.moves?.map((move, i) => (
                     <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-[20px] border border-slate-100 shadow-sm">
                        <span className="font-black text-[13px] uppercase tracking-tight text-pk-dark">{move.name}</span>
                        <div className="flex gap-3 items-center">
                           <span className={`${getTypeBadgeClass(move.type)} text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm`}>
                             {formatTypeName(move.type)}
                           </span>
                           <span className="text-[9px] font-black text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100 italic">PP {move.pp}/{move.maxPp}</span>
                        </div>
                     </div>
                   ))}
                   {(!pokemon.moves || pokemon.moves.length === 0) && <p className="text-center text-xs text-slate-400 font-bold uppercase py-10 border-2 border-dashed border-slate-100 rounded-3xl">Nessuna mossa conosciuta</p>}
                </div>
            </div>
         </section>
      </main>
      <BottomNav />
    </div>
  );
}
