import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Swords, Users, QrCode, Sparkles, Plus, X, Play } from 'lucide-react';
import { db } from '../lib/db';
import { type Pokemon, type Team } from '../types';
import { useStore } from '../store/useStore';
import { getPokemonSprite } from '../lib/pokemonUtils';
import BottomNav from '../components/BottomNav';
import { decodeTeam } from '../lib/serialization';
import { motion, AnimatePresence } from 'motion/react';

const BattleModeCard = ({ title, sub, icon: Icon, color, onClick, disabled = false }: any) => (
  <button
    disabled={disabled}
    onClick={onClick}
    className={`w-full bg-white rounded-3xl p-6 shadow-card border-2 border-transparent hover:border-pk-red transition-all active:scale-95 flex items-center gap-6 text-left relative overflow-hidden group ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
  >
    <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center text-white shrink-0 shadow-lg group-hover:rotate-6 transition-transform`}>
      <Icon size={32} />
    </div>
    <div className="flex-1">
      <h3 className="font-black text-lg uppercase leading-tight text-pk-dark">{title}</h3>
      <p className="text-xs text-slate-500 font-bold uppercase mt-1 tracking-tight">{sub}</p>
    </div>
    {disabled && <div className="absolute top-2 right-2 bg-slate-200 text-slate-500 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest">Presto Disponibile</div>}
  </button>
);

export default function BattleHub() {
  const navigate = useNavigate();
  const { rankStats } = useStore();
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [teamPk, setTeamPk] = useState<Pokemon[]>([]);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [challengeCode, setChallengeCode] = useState('');
  const [previewTeam, setPreviewTeam] = useState<any>(null);

  useEffect(() => {
    const fetchActiveTeam = async () => {
      const team = await db.teams.toCollection().filter(t => !!t.isActive).first();
      setActiveTeam(team || null);
      if (team && team.pokemonIds.length > 0) {
        const pk = await db.box.where('id').anyOf(team.pokemonIds).toArray();
        const sortedPk = team.pokemonIds.map(id => pk.find(p => p.id === id)).filter(Boolean) as Pokemon[];
        setTeamPk(sortedPk);
      }
    };
    fetchActiveTeam();
  }, []);

  const handlePreviewCode = () => {
    if (!challengeCode) return;
    try {
      const decoded = decodeTeam(challengeCode);
      if (!decoded) throw new Error();
      const pks = Array.isArray(decoded) ? decoded : decoded.pokemon;
      if (!pks || !Array.isArray(pks)) throw new Error();
      setPreviewTeam(decoded);
    } catch (e) {
      alert("Codice non valido!");
      setPreviewTeam(null);
    }
  };

  const startChallenge = () => {
    if (challengeCode) {
      navigate('/battle/play', { state: { enemyTeamCode: challengeCode } });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-pk-light overflow-hidden">
      <header className="h-[60px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-md z-10">
        <button onClick={() => navigate('/')} className="p-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black uppercase tracking-tighter ml-2 text-xl italic">Battle Hub</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">
         {/* Team Preview Card */}
         <div className="bg-white rounded-[32px] p-6 shadow-card border border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team Attivo</span>
               </div>
               <button onClick={() => navigate('/teams')} className="text-[10px] font-black text-pk-blue uppercase bg-pk-blue/10 px-3 py-1 rounded-full">Cambia</button>
            </div>
            
            <div className="flex justify-between items-center">
               <div className="font-black text-xl uppercase tracking-tighter text-pk-dark">{activeTeam?.name || 'Senza Nome'}</div>
               <div className="flex -space-x-3">
                  {teamPk.slice(0, 6).map(pk => (
                    <div key={pk.id} className="w-11 h-11 bg-slate-50 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                      <img src={getPokemonSprite(pk.pokemonId)} className="w-full h-full object-contain" />
                    </div>
                  ))}
                  {teamPk.length === 0 && <div className="text-[10px] font-bold text-slate-300 italic uppercase">Crea un team</div>}
               </div>
            </div>
         </div>

         <div className="space-y-4">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] pl-2">Scegli Modalità</h2>
            
            <div className="space-y-4">
               <BattleModeCard 
                 title="Lotta Casuale"
                 sub="Sfida allenatore casuale"
                 icon={Sparkles}
                 color="bg-rose-500"
                 onClick={() => navigate('/battle/play')}
               />
               <BattleModeCard 
                 title="Sfida da Codice"
                 sub="Incolla codice team amico"
                 icon={QrCode}
                 color="bg-emerald-500"
                 onClick={() => setShowCodeModal(true)}
               />
               <BattleModeCard 
                 title="Allenatori"
                 sub="Griglia sfidanti ufficiali"
                 icon={Users}
                 color="bg-indigo-500"
                 onClick={() => navigate('/battle/trainers')}
               />
            </div>
         </div>

         <div className="bg-pk-dark rounded-[40px] p-8 text-white relative overflow-hidden shadow-2xl border-4 border-pk-gold/20">
            <div className="relative z-10">
               <h3 className="font-black text-xs uppercase tracking-[0.3em] text-pk-gold/60 mb-2">Statistiche Rango</h3>
               <div className="text-5xl font-black tracking-tighter flex items-center gap-4">
                  <span className="text-pk-gold italic drop-shadow-lg">BRONZO</span>
               </div>
               <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl">
                    <div className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">V / S</div>
                    <div className="font-black text-2xl tracking-tighter">{rankStats.wins} / {rankStats.losses}</div>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl flex flex-col justify-center items-center">
                    <div className="text-[10px] font-black text-pk-gold uppercase tracking-tighter">Win Rate</div>
                    <div className="font-black text-2xl tracking-tighter italic">
                      {rankStats.wins + rankStats.losses > 0 
                        ? Math.round((rankStats.wins / (rankStats.wins + rankStats.losses)) * 100)
                        : 0}%
                    </div>
                  </div>
               </div>
               <div className="mt-4 bg-white/5 p-4 rounded-2xl flex justify-between items-center">
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Punti Rango</span>
                  <span className="font-black text-xl text-pk-gold">{rankStats.points}</span>
               </div>
            </div>
            <div className="absolute -right-16 -top-16 w-64 h-64 bg-pk-gold/5 rounded-full blur-3xl pointer-events-none"></div>
         </div>
      </main>

      <AnimatePresence>
        {showCodeModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-pk-dark/80 z-[100] flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white w-full max-w-md rounded-[40px] p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => { setShowCodeModal(false); setPreviewTeam(null); setChallengeCode(''); }}
                className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <QrCode size={24} />
                </div>
                <div>
                  <h2 className="font-black text-xl uppercase tracking-tight text-pk-dark leading-none">Sfida Amico</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Inserisci codice squadra</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl p-5 text-[10px] font-mono h-24 focus:border-pk-blue transition-all outline-none"
                    placeholder="Incolla qui il codice Base64 ricevuto..."
                    value={challengeCode}
                    onChange={(e) => setChallengeCode(e.target.value)}
                  />
                  <button 
                    onClick={handlePreviewCode}
                    className="w-full text-xs font-black uppercase text-pk-blue py-3 border-2 border-pk-blue/10 rounded-2xl hover:bg-pk-blue/5 transition-colors"
                  >
                    Verifica Codice
                  </button>
                </div>

                {previewTeam && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-50 rounded-[32px] p-6 border-2 border-pk-blue/5"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="font-black text-[10px] uppercase text-slate-400">Squadra Sfidante</div>
                      <div className="font-black text-xs uppercase text-pk-dark truncate max-w-[150px]">{previewTeam.name || 'Team Nemico'}</div>
                    </div>
                    <div className="flex justify-center -space-x-4">
                      {(Array.isArray(previewTeam) ? previewTeam : (previewTeam.pokemon || [])).slice(0, 6).map((pk: any, i: number) => (
                        <div key={i} className="w-14 h-14 bg-white rounded-2xl border-2 border-white shadow-lg overflow-hidden flex items-center justify-center p-1">
                          <img src={getPokemonSprite(pk.pokemonId)} className="w-full h-full object-contain" />
                        </div>
                      ))}
                    </div>
                    
                    <button 
                      onClick={startChallenge}
                      className="w-full bg-pk-red text-white font-black uppercase py-4 rounded-3xl mt-6 shadow-lg shadow-pk-red/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                    >
                      <Swords size={20} /> Inizia Lotta
                    </button>
                  </motion.div>
                )}

                {!previewTeam && challengeCode && (
                  <div className="text-center py-4">
                     <p className="text-[10px] font-black text-pk-blue/40 uppercase tracking-widest italic animate-pulse">Verifica il codice per procedere</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
