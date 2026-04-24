import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Database, Trash2, Volume2, Share2, Info, Download } from 'lucide-react';
import { downloadMasterData } from '../lib/pokeApi';
import { db } from '../lib/db';
import { useStore } from '../store/useStore';

import BottomNav from '../components/BottomNav';

export default function Settings() {
  const navigate = useNavigate();
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await downloadMasterData((p) => setProgress(p));
      alert('Sincronizzazione completata con successo!');
    } catch (err) {
      console.error(err);
      alert('Errore durante la sincronizzazione. Controlla la connessione.');
    } finally {
      setSyncing(false);
      setProgress(0);
    }
  };

  const handleReset = async () => {
    if (confirm('Sei sicuro di voler resettare tutti i dati? Questa azione è irreversibile.')) {
      await db.delete();
      window.location.reload();
    }
  };

  const handleExportData = async () => {
    const box = await db.box.toArray();
    const inventory = await db.inventory.toArray();
    const teams = await db.teams.toArray();
    const data = { box, inventory, teams, coins: useStore.getState().coins };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pokearena_save_${Date.now()}.json`;
    a.click();
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        if (data.box) {
          await db.box.clear();
          await db.box.bulkAdd(data.box);
        }
        if (data.teams) {
          await db.teams.clear();
          await db.teams.bulkAdd(data.teams);
        }
        if (data.coins) {
          useStore.setState({ coins: data.coins });
        }
        alert('Dati importati con successo!');
        window.location.reload();
      } catch (err) {
        alert('File non valido.');
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      <header className="h-[60px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black uppercase tracking-tighter ml-2">Impostazioni</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {/* Sync Database */}
        <section className="bg-white rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
               <Database size={24} />
             </div>
             <div>
               <h2 className="font-black text-sm uppercase">Database PokeAPI</h2>
               <p className="text-xs text-slate-500 italic">Sincronizza mosse, specie e abilità</p>
             </div>
          </div>

          {syncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-black">
                <span>SINCRONIZZAZIONE...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden border">
                 <div 
                   className="h-full bg-pk-gold transition-all duration-300"
                   style={{ width: `${progress}%` }}
                 />
              </div>
            </div>
          )}

          <button 
            disabled={syncing}
            onClick={handleSync}
            className="w-full bg-pk-blue text-white font-black py-3 rounded-xl disabled:opacity-50 active:scale-95 transition-transform uppercase text-sm"
          >
            {syncing ? 'Sincronizzazione in corso...' : 'Aggiorna Database'}
          </button>
        </section>

        {/* Audio & Video */}
        <section className="bg-white rounded-2xl p-5 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="text-slate-400" />
              <span className="font-bold text-sm uppercase">Volume Audio</span>
            </div>
            <input type="range" className="w-32 accent-pk-red" />
          </div>
        </section>

        {/* Import / Export */}
        <section className="bg-white rounded-2xl p-5 shadow-card space-y-3">
           <button 
             onClick={handleExportData}
             className="w-full border-2 border-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
           >
             <Share2 size={18} /> ESPORTA DATI (JSON)
           </button>
           <button 
             onClick={handleImportData}
             className="w-full border-2 border-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2"
           >
             <Download size={18} /> IMPORTA DATI (JSON)
           </button>
           <button className="w-full border-2 border-slate-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2">
             <Info size={18} /> CREDITI & INFO
           </button>
        </section>

        {/* Reset */}
        <button 
          onClick={handleReset}
          className="w-full p-4 text-red-500 font-black text-sm uppercase flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-colors"
        >
          <Trash2 size={18} /> Reset Totale Dati
        </button>

        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-8">
          Pokémon Battle Arena v1.0.0<br/>
          © 2026 Competitive Engine
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
