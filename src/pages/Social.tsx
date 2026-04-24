import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Share2, Download, Copy, Check, Users, MessageSquare, QrCode, Plus } from 'lucide-react';
import { db } from '../lib/db';
import { type Pokemon, type Team } from '../types';
import BottomNav from '../components/BottomNav';
import { encodeTeam, decodeTeam } from '../lib/serialization';

export default function Social() {
  const navigate = useNavigate();
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [exportCode, setExportCode] = useState('');
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchActiveTeam = async () => {
      const team = await db.teams.toCollection().filter(t => !!t.isActive).first();
      setActiveTeam(team || null);
    };
    fetchActiveTeam();
  }, []);

  const handleExport = async () => {
    if (!activeTeam) {
      alert("Attiva una squadra per poterla condividere!");
      return;
    }
    const pkList = await db.box.where('id').anyOf(activeTeam.pokemonIds).toArray();
    const data = {
      name: activeTeam.name,
      pokemon: pkList.map(p => ({
        pokemonId: p.pokemonId,
        level: p.level,
        moves: p.moves,
        stats: p.stats
      }))
    };
    const code = encodeTeam(data);
    setExportCode(code);
  };

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(exportCode).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(() => {
        prompt('Copia il codice qui sotto:', exportCode);
      });
    } catch (e) {
      prompt('Copia il codice qui sotto:', exportCode);
    }
  };

  const handleImport = async () => {
    try {
      const decoded = decodeTeam(importCode);
      if (!decoded) throw new Error();
      
      // Caso 1: Importazione singolo Pokémon
      if (decoded.pokemonId && decoded.stats) {
        const confirmPk = confirm(`Vuoi importare il Pokémon "${decoded.name}" nel tuo Box?`);
        if (!confirmPk) return;
        
        const id = crypto.randomUUID();
        await db.box.add({
          ...decoded,
          id,
          caughtAt: Date.now(),
        } as any);
        
        alert(`${decoded.name} aggiunto al tuo Box con successo!`);
        setImportCode('');
        return;
      }

      // Caso 2: Importazione intera Squadra
      if (!decoded.pokemon || !Array.isArray(decoded.pokemon)) throw new Error();
      
      const confirmImport = confirm(`Vuoi importare la squadra "${decoded.name}"? Verranno aggiunti ${decoded.pokemon.length} Pokémon al tuo box.`);
      if (!confirmImport) return;

      const newIds: string[] = [];
      for (const p of decoded.pokemon) {
        const id = crypto.randomUUID();
        await db.box.add({
          ...p,
          id,
          caughtAt: Date.now(),
          currentHp: p.stats.hp,
          exp: 0,
          growthRate: 'medium'
        } as any);
        newIds.push(id);
      }

      await db.teams.add({
        id: crypto.randomUUID(),
        name: `${decoded.name} (Import)`,
        pokemonIds: newIds,
        createdAt: Date.now(),
        isActive: false
      });

      alert("Squadra importata con successo! Cercala nella sezione Squadre.");
      setImportCode('');
    } catch (e) {
      alert("Codice non valido o corrotto!");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <header className="h-[60px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-md">
        <Sparkles size={20} className="mr-3 text-pk-gold" />
        <h1 className="font-black uppercase tracking-tighter text-xl">Social Hub & Exchange</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 pb-28">
         {/* Share Section */}
         <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-pk-red rounded-xl flex items-center justify-center text-white">
                  <Share2 size={20} />
               </div>
               <div>
                  <h2 className="font-black uppercase text-sm tracking-tight">Condividi Squadra</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Genera un codice per i tuoi amici</p>
               </div>
            </div>

            {activeTeam ? (
              <div className="space-y-4">
                 <div className="bg-slate-50 p-4 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Squadra pronta:</span>
                    <div className="font-black text-pk-dark text-lg mt-1 tracking-tighter">{activeTeam.name}</div>
                 </div>
                 <button 
                  onClick={handleExport}
                  className="w-full bg-pk-dark text-white py-3 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                 >
                    <QrCode size={16} className="text-pk-gold" /> Genera Codice
                 </button>
                 
                 {exportCode && (
                   <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                     <textarea 
                       readOnly
                       value={exportCode}
                       className="w-full bg-slate-100 p-3 rounded-xl text-[8px] font-mono break-all h-20 border-none focus:ring-0"
                     />
                     <button 
                      onClick={handleCopy}
                      className="w-full bg-emerald-500 text-white py-2 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2"
                     >
                        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiato!' : 'Copia Codice'}
                     </button>
                   </div>
                 )}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 font-bold text-xs uppercase italic">
                 Nessuna squadra attiva da condividere
              </div>
            )}
         </section>

         {/* Import Section */}
         <section className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4">
               <div className="w-10 h-10 bg-pk-blue rounded-xl flex items-center justify-center text-white">
                  <Download size={20} />
               </div>
               <div>
                  <h2 className="font-black uppercase text-sm tracking-tight">Importa Codice</h2>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aggiungi Pokémon dai tuoi amici</p>
               </div>
            </div>

            <textarea 
              placeholder="Incolla qui il codice della squadra..."
              value={importCode}
              onChange={(e) => setImportCode(e.target.value)}
              className="w-full bg-slate-50 p-4 rounded-2xl border-2 border-slate-100 text-[10px] font-mono h-24 mb-4 focus:ring-pk-blue focus:border-pk-blue transition-all"
            />

            <button 
              disabled={!importCode}
              onClick={handleImport}
              className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95
                ${importCode ? 'bg-pk-blue text-white shadow-lg shadow-pk-blue/20' : 'bg-slate-100 text-slate-300'}
              `}
            >
               <Plus size={16} /> Conferma Importazione
            </button>
         </section>

         <div className="bg-emerald-50 rounded-[32px] p-6 border-2 border-emerald-100 flex items-center gap-4">
            <MessageSquare className="text-emerald-500" size={32} />
            <div>
               <div className="font-black uppercase text-xs text-emerald-700">Chat & Clan</div>
               <div className="text-[10px] font-bold text-emerald-600/70 uppercase">Coming Soon in v1.2</div>
            </div>
         </div>
      </main>

      <BottomNav />
    </div>
  );
}
