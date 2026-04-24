import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Swords, Package, Users, Briefcase, ShoppingBag, Settings as SettingsIcon, Home, Smartphone, Sparkles, Plus } from 'lucide-react';

import { useStore } from '../store/useStore';
import { db } from '../lib/db';
import { type Pokemon, type Team } from '../types';
import { getPokemonSprite, getRecommendedMoves } from '../lib/pokemonUtils';
import BottomNav from '../components/BottomNav';

const TopBar = () => {
  const { coins } = useStore();
  return (
    <header className="h-[60px] bg-pk-red text-white flex items-center justify-between px-6 shadow-md z-10 shrink-0">
      <div className="flex items-center gap-3">
        <div className="pk-ball" />
        <div className="text-[22px] font-black tracking-tight uppercase">
          Battle Arena <span className="font-light opacity-80">PWA</span>
        </div>
      </div>
      
      <div className="hidden md:flex flex-col w-[240px]">
        <div className="flex justify-between text-[11px] font-bold mb-0.5">
          <span>DATABASE PokeAPI</span>
          <span>85%</span>
        </div>
        <div className="h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="w-[85%] h-full bg-pk-gold" />
        </div>
      </div>

      <div className="font-black text-emerald-500 text-xl flex items-center gap-1 bg-white px-3 py-1 rounded-full shadow-inner">
        <span className="text-sm opacity-70">$</span> {coins.toLocaleString()}
      </div>
    </header>
  );
};

const MenuCard = ({ label, subText, icon: Icon, color, onClick, active = false }: any) => (
  <button
    onClick={onClick}
    className={`bg-white rounded-2xl p-6 flex items-center gap-5 shadow-card border-2 transition-all active:scale-95 text-left h-full ${active ? 'border-pk-red' : 'border-transparent'}`}
  >
    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: color }}>
      <Icon size={32} />
    </div>
    <div>
      <div className="text-lg font-bold text-pk-dark uppercase leading-tight">{label}</div>
      <div className="text-[13px] text-slate-500 mt-0.5 leading-tight">{subText}</div>
    </div>
  </button>
);

export default function HomePage() {
  const navigate = useNavigate();
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [teamPk, setTeamPk] = useState<Pokemon[]>([]);

  useEffect(() => {
    const fixMissingMoves = async () => {
      const boxPokemon = await db.box.toArray();
      const needsFix = boxPokemon.filter(p => !p.moves || p.moves.length === 0);
      
      if (needsFix.length > 0) {
        console.log(`Fixing moves for ${needsFix.length} Pokémon...`);
        for (const pk of needsFix) {
          const moves = await getRecommendedMoves(pk.pokemonId);
          await db.box.update(pk.id, { moves });
        }
      }
    };

    const fetchActiveTeam = async () => {
      await fixMissingMoves();
      const team = await db.teams.toCollection().filter(t => !!t.isActive).first();
      setActiveTeam(team || null);
      if (team && team.pokemonIds.length > 0) {
        const pk = await db.box.where('id').anyOf(team.pokemonIds).toArray();
        const sortedPk = team.pokemonIds.map(id => pk.find(p => p.id === id)).filter(Boolean) as Pokemon[];
        setTeamPk(sortedPk);
      } else {
        setTeamPk([]);
      }
    };
    fetchActiveTeam();
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <TopBar />
      
      <main className="flex-1 overflow-y-auto p-6 pb-28">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Menu Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <MenuCard
              label="Battaglia"
              subText="Lotta 6vs6 competitiva"
              icon={Swords}
              color="#EE1515"
              active
              onClick={() => navigate('/battle')}
            />
            <MenuCard
              label="Box Pokémon"
              subText="Gestisci i tuoi esemplari"
              icon={Package}
              color="#3B4CCA"
              onClick={() => navigate('/box')}
            />
            <MenuCard
              label="Squadre"
              subText="Costruisci il team perfetto"
              icon={Users}
              color="#10B981"
              onClick={() => navigate('/teams')}
            />
            <MenuCard
              label="Zaino"
              subText="Strumenti e Breeding"
              icon={Briefcase}
              color="#F59E0B"
              onClick={() => navigate('/zaino')}
            />
            <MenuCard
              label="Negozio"
              subText="Pietre, Caramelle e Mega"
              icon={ShoppingBag}
              color="#8B5CF6"
              onClick={() => navigate('/shop')}
            />
            <MenuCard
              label="Impostazioni"
              subText="Dati, Audio e Import"
              icon={SettingsIcon}
              color="#64748B"
              onClick={() => navigate('/settings')}
            />
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-5">
            <button 
              onClick={() => navigate('/daily')}
              className="daily-banner rounded-3xl p-6 text-[#5a3e00] relative overflow-hidden shadow-lg h-[160px] flex flex-col justify-center text-left transition-transform active:scale-95 group shrink-0 bg-pk-gold/20"
            >
              <div className="absolute inset-0 bg-pk-gold/10 group-hover:bg-transparent transition-colors"></div>
              <div className="text-sm font-extrabold uppercase tracking-tight relative z-10">Cattura Giornaliera</div>
              <div className="text-3xl font-black my-1 uppercase relative z-10">8 Nuovi Pokémon</div>
              <div className="text-xs font-bold opacity-80 relative z-10">CLICCA PER SCOPRIRE</div>
              <div className="absolute -right-4 -bottom-4 text-8xl font-black opacity-10 rotate-12 select-none group-hover:scale-110 transition-transform tracking-tighter">PB</div>
            </button>

            <div className="bg-white rounded-3xl p-6 shadow-card border border-slate-100">
              <div className="flex justify-between items-center mb-5">
                <span className="font-black text-sm uppercase tracking-widest text-slate-400">
                  {activeTeam ? activeTeam.name : 'Squadra Attiva'}
                </span>
                <button 
                  onClick={() => navigate('/teams')}
                  className="text-[11px] text-pk-red font-black hover:underline tracking-tighter"
                >
                  {activeTeam ? 'MODIFICA' : 'CREA'}
                </button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                {teamPk.map((pk) => (
                  <button 
                    key={pk.id} 
                    onClick={() => navigate(`/box/${pk.id}`)}
                    className="aspect-square bg-slate-50 rounded-2xl border-2 border-pk-blue/20 flex items-center justify-center relative p-1 overflow-hidden group active:scale-95 transition-all"
                  >
                    <img 
                      src={getPokemonSprite(pk.pokemonId)}
                      alt={pk.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                    />
                    <span className="absolute bottom-1 right-1 font-black text-[9px] text-pk-blue tracking-tighter bg-white/80 px-1 rounded shadow-sm">L{pk.level}</span>
                  </button>
                ))}
                {[...Array(Math.max(0, 6 - teamPk.length))].map((_, i) => (
                  <div key={i} className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center">
                    <Plus size={20} className="text-slate-300" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-card border-2 border-dashed border-slate-200 flex-1 flex flex-col items-center justify-center min-h-[180px]">
               <div className="text-6xl mb-3">🥚</div>
               <div className="font-black text-slate-400 uppercase tracking-tight text-lg">Nessun Uovo</div>
               <div className="text-xs text-slate-300 font-bold uppercase tracking-widest mt-1">Breeding in arrivo</div>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
