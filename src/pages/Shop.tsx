import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingBag, Coins } from 'lucide-react';
import { useStore } from '../store/useStore';

const SHOP_ITEMS = [
  { id: 'rare_candy', name: 'Caramella Rara', price: 5000, icon: '🍬', desc: 'Aumenta il livello di 1' },
  { id: 'thunder_stone', name: 'Pietratuono', price: 3000, icon: '⚡', desc: 'Evolve certi Pokémon' },
  { id: 'moon_stone', name: 'Pietralunare', price: 3000, icon: '🌙', desc: 'Evolve certi Pokémon' },
  { id: 'everstone', name: 'Pietrastante', price: 1500, icon: '🪨', desc: 'Mantiene natura in breeding' },
  { id: 'potion', name: 'Pozione', price: 300, icon: '🧪', desc: 'Recupera 20 PS' },
  { id: 'super_potion', name: 'Super Pozione', price: 700, icon: '🧪', desc: 'Recupera 50 PS' },
  { id: 'hyper_potion', name: 'Iperpozione', price: 2000, icon: '🧪', desc: 'Recupera 200 PS' },
];

import BottomNav from '../components/BottomNav';

export default function Shop() {
  const navigate = useNavigate();
  const { coins, removeCoins, addItem } = useStore();

  const handleBuy = (item: any) => {
    if (coins >= item.price) {
      removeCoins(item.price);
      addItem(item.name);
      alert(`Hai comprato ${item.name}!`);
    } else {
      alert('Non hai abbastanza monete!');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-pk-light">
      <header className="h-[60px] bg-pk-red text-white flex items-center px-4 shrink-0 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black uppercase tracking-tighter ml-2">Negozio</h1>
      </header>

      <div className="bg-pk-dark text-white p-6 flex justify-between items-center shrink-0">
         <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
               <ShoppingBag size={28} className="text-pk-gold" />
            </div>
            <div>
               <h2 className="font-black text-xs uppercase tracking-widest text-white/50">Saldo Disponibile</h2>
               <div className="text-2xl font-black text-pk-gold flex items-center gap-2">
                  <Coins size={20} /> {coins.toLocaleString()} <span className="text-xs opacity-50">$</span>
               </div>
            </div>
         </div>
      </div>

      <main className="flex-1 overflow-y-auto p-4 grid grid-cols-1 gap-3 pb-28">
         {SHOP_ITEMS.map((item) => (
           <div key={item.id} className="bg-white p-4 rounded-2xl shadow-card flex items-center gap-4 group active:bg-slate-50 transition-colors">
              <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-3xl">
                 {item.icon}
              </div>
              <div className="flex-1">
                 <h3 className="font-black text-sm uppercase leading-tight">{item.name}</h3>
                 <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{item.desc}</p>
                 <div className="mt-2 text-pk-blue font-black text-sm">
                    {item.price} <span className="text-[10px]">$</span>
                 </div>
              </div>
              <button 
                onClick={() => handleBuy(item)}
                className="bg-pk-blue text-white px-4 py-2 rounded-lg font-black text-xs uppercase active:scale-90 transition-transform"
              >
                Compra
              </button>
           </div>
         ))}
      </main>
      <BottomNav />
    </div>
  );
}
