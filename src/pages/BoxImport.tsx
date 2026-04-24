import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Download, AlertTriangle } from 'lucide-react';
import { db } from '../lib/db';
import { decodePokemon } from '../lib/serialization';
import BottomNav from '../components/BottomNav';

export default function BoxImport() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleImport = async () => {
    try {
      const pokemon = decodePokemon(code);
      // Forza nuovo ID per evitare duplicati
      pokemon.id = crypto.randomUUID();
      
      // Assicura la presenza dei campi critici per la visualizzazione
      if (!pokemon.ivs) pokemon.ivs = { hp: 31, attack: 31, defense: 31, spAtk: 31, spDef: 31, speed: 31 };
      if (!pokemon.evs) pokemon.evs = { hp: 0, attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };
      if (!pokemon.stats) pokemon.stats = { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 };
      if (!pokemon.types) pokemon.types = ['normal'];
      
      await db.box.add(pokemon);
      alert(`${pokemon.name} aggiunto al tuo Box con successo!`);
      navigate('/box');
    } catch (err) {
      setError('Codice non valido o malformato.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-pk-light">
      <header className="h-[60px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black uppercase tracking-tighter ml-2">Importa Pokémon</h1>
      </header>

      <main className="p-6 space-y-6 flex-1 overflow-y-auto pb-28">
         <div className="bg-white rounded-3xl p-6 shadow-card space-y-4">
            <h2 className="font-black text-xs uppercase tracking-widest text-slate-400">Incolla Codice Base64</h2>
            <textarea 
              rows={8}
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError('');
              }}
              placeholder="Incolla qui il codice..."
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 text-xs font-mono focus:border-pk-blue transition-colors resize-none"
            />
            {error && <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-50 p-3 rounded-xl"><AlertTriangle size={16}/> {error}</div>}
            
            <button 
              disabled={!code.trim()}
              onClick={handleImport}
              className="w-full bg-pk-dark text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95 transition-all"
            >
              <Download size={20} /> IMPORTA ORA
            </button>
         </div>

         <div className="bg-blue-50 border-2 border-blue-100 p-6 rounded-3xl text-blue-800 space-y-2">
            <h3 className="font-black text-xs uppercase">Come funziona?</h3>
            <p className="text-[11px] leading-relaxed font-medium">
               Copia il codice Base64 da un amico o esportalo dal tuo Box per scambiare istanze specifiche di Pokémon con tutti i loro IV, EV e mosse.
            </p>
         </div>
      </main>
      <BottomNav />
    </div>
  );
}
