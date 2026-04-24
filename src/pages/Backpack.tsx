import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Zap, ZapOff, Briefcase, Egg, Sparkles, HeartPulse, Hammer } from 'lucide-react';
import { useStore } from '../store/useStore';
import { ITEMS } from '../constants/items';

import BottomNav from '../components/BottomNav';

export default function Backpack() {
  const navigate = useNavigate();
  const { expShareEnabled, toggleExpShare, inventory } = useStore();
  const [tab, setTab] = useState<'items' | 'breeding'>('items');
  const [subTab, setSubTab] = useState<'cure' | 'utili'>('cure');

  const filteredInventory = Object.entries(inventory).filter(([name]) => {
     const item = ITEMS[name];
     return item && item.category === subTab;
  });

  return (
    <div className="flex flex-col h-screen bg-pk-light">
      <header className="h-[60px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black uppercase tracking-tighter ml-2">Zaino</h1>
      </header>

      <div className="flex border-b border-slate-200 bg-white">
        <button 
          onClick={() => setTab('items')}
          className={`flex-1 py-4 font-black uppercase text-xs flex items-center justify-center gap-2 ${tab === 'items' ? 'text-pk-red border-b-4 border-pk-red' : 'text-slate-400'}`}
        >
          <Briefcase size={18} /> Strumenti
        </button>
        <button 
          onClick={() => setTab('breeding')}
          className={`flex-1 py-4 font-black uppercase text-xs flex items-center justify-center gap-2 ${tab === 'breeding' ? 'text-pk-red border-b-4 border-pk-red' : 'text-slate-400'}`}
        >
          <Egg size={18} /> Breeding
        </button>
      </div>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
        {tab === 'items' ? (
          <>
            {/* Sub Tabs for cure/utili */}
            <div className="flex gap-2">
              <button 
                onClick={() => setSubTab('cure')}
                className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${subTab === 'cure' ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                <div className="flex items-center justify-center gap-1"><HeartPulse size={14}/> Cure</div>
              </button>
              <button 
                onClick={() => setSubTab('utili')}
                className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase border-2 transition-all ${subTab === 'utili' ? 'bg-pk-blue border-blue-800 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}
              >
                <div className="flex items-center justify-center gap-1"><Hammer size={14}/> Utili</div>
              </button>
            </div>

            {/* Exp Share Toggle */}
            <section className="bg-white rounded-2xl p-4 shadow-card border-2 border-transparent">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${expShareEnabled ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                      {expShareEnabled ? <Zap size={24} /> : <ZapOff size={24} />}
                    </div>
                    <div>
                      <h3 className="font-black text-sm uppercase">Exp Share</h3>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Esperienza per tutto il team</p>
                    </div>
                 </div>
                 <button 
                   onClick={toggleExpShare}
                   className={`w-14 h-8 rounded-full relative transition-colors ${expShareEnabled ? 'bg-green-500' : 'bg-slate-300'}`}
                 >
                   <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${expShareEnabled ? 'left-7' : 'left-1'}`} />
                 </button>
               </div>
            </section>

            {/* Inventory List */}
            <div className="grid grid-cols-1 gap-2">
               {filteredInventory.map(([name, qty]) => (
                 <div key={name} className="bg-white p-4 rounded-xl flex items-center justify-between shadow-sm border border-slate-100">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-xl">
                         {ITEMS[name]?.category === 'cure' ? '💊' : '🎒'}
                       </div>
                       <div>
                         <div className="font-bold text-sm uppercase tracking-tight">{name}</div>
                         <div className="text-[9px] font-medium text-slate-400 uppercase">{ITEMS[name]?.description}</div>
                       </div>
                    </div>
                    <span className="font-black text-pk-blue">x{qty}</span>
                 </div>
               ))}
               {filteredInventory.length === 0 && (
                 <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs italic">Nessun oggetto in questa categoria</p>
               )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
             {/* Eggs Section */}
             <section className="bg-white rounded-2xl p-6 shadow-card border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center py-12">
                <div className="text-6xl mb-4 animate-bounce">🥚</div>
                <h3 className="font-black text-lg uppercase">Nessun Uovo in incubatrice</h3>
                <p className="text-xs text-slate-500 max-w-[200px] mt-2 font-medium">Trova due Pokémon compatibili nel Box per iniziare il breeding!</p>
                <button 
                  onClick={() => navigate('/box')}
                  className="mt-6 bg-pk-gold text-pk-dark px-6 py-3 rounded-xl font-black uppercase text-xs shadow-md"
                >
                  Vai al Box
                </button>
             </section>

             <section className="bg-white rounded-2xl p-4 shadow-card">
                <h4 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Statistiche Breeding</h4>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                   <div className="flex items-center gap-2">
                      <Sparkles className="text-pk-gold" size={16} />
                      <span className="text-[10px] font-bold uppercase">Pokemon Schiusi</span>
                   </div>
                   <span className="font-black text-pk-dark">0</span>
                </div>
             </section>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
