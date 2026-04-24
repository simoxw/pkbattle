import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Swords, Smartphone, Sparkles, Package } from 'lucide-react';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Home', icon: Home, path: '/', id: 'home' },
    { label: 'Lotta', icon: Swords, path: '/battle', id: 'battle' },
    { label: 'Box', icon: Package, path: '/box', id: 'box' },
    { label: 'Pokedex', icon: Smartphone, path: '/pokedex', id: 'pokedex' },
    { label: 'Social', icon: Sparkles, path: '/social', id: 'social' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-md border-t border-slate-200 flex justify-around items-center px-2 z-[100] shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
        return (
          <button
            key={item.id}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 px-2 flex-1 ${
              isActive ? 'text-pk-red' : 'text-slate-400 hover:text-slate-500'
            }`}
          >
            <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-red-50 scale-110 shadow-sm' : 'bg-transparent'}`}>
              <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            </div>
            <span className={`text-[9px] font-black uppercase tracking-tighter ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
