import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Swords, Trophy } from 'lucide-react';
import { TRAINERS, type Trainer } from '../data/trainers';
import { motion } from 'motion/react';

export default function Trainers() {
  const navigate = useNavigate();

  const handleChallenge = (trainer: Trainer) => {
    navigate('/battle/play', { state: { trainerId: trainer.id } });
  };

  return (
    <div className="flex flex-col h-screen bg-pk-dark text-white overflow-hidden">
      <header className="h-[60px] flex items-center px-4 shrink-0 border-b border-white/10">
        <button onClick={() => navigate('/battle')} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black uppercase tracking-[0.2em] ml-2 text-xl italic flex-1 text-center pr-10">Allenatori</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-10">
        <div className="flex items-center gap-3 px-2 mb-2">
          <div className="w-10 h-10 bg-pk-gold/20 text-pk-gold rounded-xl flex items-center justify-center">
            <Trophy size={20} />
          </div>
          <div>
            <h2 className="font-black text-xs uppercase tracking-widest text-white/40">Griglia Sfidanti</h2>
            <p className="text-[10px] font-bold text-pk-gold uppercase tracking-tighter">Batti i campioni per scalare il rango</p>
          </div>
        </div>

        <div className="grid gap-4">
          {TRAINERS.map((trainer, index) => (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              key={trainer.id}
              onClick={() => handleChallenge(trainer)}
              className="group relative w-full bg-gradient-to-r from-slate-900 to-slate-800 rounded-[32px] p-5 flex items-center gap-5 border-2 border-white/5 hover:border-pk-blue/50 transition-all active:scale-[0.98] overflow-hidden"
            >
              {/* Background Glow */}
              <div className="absolute -right-10 -top-10 w-32 h-32 bg-pk-blue/5 rounded-full blur-3xl group-hover:bg-pk-blue/10 transition-colors" />
              
              {/* Trainer Sprite */}
              <div className="relative w-20 h-20 bg-white/5 rounded-2xl flex items-center justify-center shrink-0 border border-white/5 group-hover:scale-110 transition-transform">
                <img 
                  src={trainer.sprite} 
                  alt={trainer.name} 
                  className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-left relative z-10">
                <div className="text-[10px] font-black text-pk-blue uppercase tracking-[0.2em] mb-1">{trainer.title}</div>
                <div className="text-2xl font-black uppercase tracking-tighter italic leading-none mb-2 group-hover:text-pk-blue transition-colors">{trainer.name}</div>
                <div className="text-[10px] font-medium text-white/40 italic line-clamp-1">"{trainer.quote}"</div>
              </div>

              {/* Action */}
              <div className="shrink-0 w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20 group-hover:bg-pk-blue group-hover:text-white transition-all shadow-lg">
                <Swords size={20} />
              </div>
            </motion.button>
          ))}
        </div>
      </main>
    </div>
  );
}
