import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, Trash2, Edit2, Check, X, Swords } from 'lucide-react';
import { db } from '../lib/db';
import { type Pokemon, type Team } from '../types';
import { getPokemonSprite } from '../lib/pokemonUtils';
import BottomNav from '../components/BottomNav';

export default function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [box, setBox] = useState<Pokemon[]>([]);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [selectedInEditor, setSelectedInEditor] = useState<string[]>([]);
  const [teamName, setTeamName] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const t = await db.teams.toArray();
    const b = await db.box.toArray();
    setTeams(t);
    setBox(b);
  };

  const handleCreateNew = () => {
    setEditingTeam({
      id: crypto.randomUUID(),
      name: `Squadra ${teams.length + 1}`,
      pokemonIds: [],
      isActive: teams.length === 0,
      createdAt: Date.now()
    });
    setSelectedInEditor([]);
    setTeamName(`Squadra ${teams.length + 1}`);
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setSelectedInEditor([...team.pokemonIds]);
    setTeamName(team.name);
  };

  const togglePokemonSelection = (pkId: string) => {
    if (selectedInEditor.includes(pkId)) {
      setSelectedInEditor(prev => prev.filter(id => id !== pkId));
    } else {
      if (selectedInEditor.length >= 6) {
        alert('Massimo 6 Pokémon per squadra!');
        return;
      }
      setSelectedInEditor(prev => [...prev, pkId]);
    }
  };

  const saveTeam = async () => {
    if (!editingTeam) return;
    if (selectedInEditor.length === 0) {
      alert('Seleziona almeno un Pokémon!');
      return;
    }

    const updatedTeam: Team = {
      ...editingTeam,
      name: teamName,
      pokemonIds: selectedInEditor
    };

    await db.teams.put(updatedTeam);
    setEditingTeam(null);
    loadData();
  };

  const deleteTeam = async (id: string) => {
    if (confirm('Vuoi davvero eliminare questa squadra?')) {
      await db.teams.delete(id);
      loadData();
    }
  };

  const setActive = async (id: string) => {
    const allTeams = await db.teams.toArray();
    const updated = allTeams.map(t => ({
      ...t,
      isActive: t.id === id
    }));
    await db.teams.bulkPut(updated);
    loadData();
  };

  if (editingTeam) {
    return (
      <div className="flex flex-col h-screen bg-pk-light overflow-hidden">
        <header className="h-[60px] bg-pk-red text-white flex items-center justify-between px-4 shrink-0">
          <button onClick={() => setEditingTeam(null)} className="p-2 -ml-2">
            <X size={24} />
          </button>
          <input 
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            className="bg-transparent border-b-2 border-white/30 font-black uppercase text-center focus:border-white outline-none px-2 py-1 mx-4 flex-1"
          />
          <button onClick={saveTeam} className="bg-white/20 p-2 rounded-lg">
            <Check size={24} />
          </button>
        </header>

        <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm shrink-0">
           <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Selezionati: {selectedInEditor.length} / 6</span>
           <div className="flex -space-x-2">
              {selectedInEditor.map((id, index) => {
                const pk = box.find(p => p.id === id);
                if (!pk) return null;
                return (
                  <img key={`${id}-${index}`} src={getPokemonSprite(pk.pokemonId)} className="w-8 h-8 bg-slate-100 rounded-full border-2 border-white shadow-sm" />
                );
              })}
           </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 grid grid-cols-4 gap-2">
           {box.map(pk => {
             const isSelected = selectedInEditor.includes(pk.id);
             return (
               <button 
                 key={pk.id}
                 onClick={() => togglePokemonSelection(pk.id)}
                 className={`relative bg-white rounded-2xl p-2 border-2 transition-all active:scale-95 flex flex-col items-center
                    ${isSelected ? 'border-pk-blue shadow-lg scale-105' : 'border-transparent shadow-sm opacity-60'}
                 `}
               >
                  <img src={getPokemonSprite(pk.pokemonId)} className="w-12 h-12 object-contain" />
                  <span className="text-[8px] font-black uppercase truncate w-full text-center mt-1">{pk.name}</span>
                  {isSelected && <div className="absolute -top-1 -right-1 bg-pk-blue text-white rounded-full p-0.5"><Check size={8}/></div>}
               </button>
             );
           })}
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-pk-light">
      <header className="h-[60px] bg-pk-red text-white flex items-center justify-between px-4 shrink-0 shadow-md">
        <button onClick={() => navigate('/')} className="p-2 -ml-2">
          <ChevronLeft size={24} />
        </button>
        <h1 className="font-black uppercase tracking-tighter">Le mie Squadre</h1>
        <button onClick={handleCreateNew} className="bg-white/20 p-2 rounded-lg">
          <Plus size={24} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-4 pb-28">
         {teams.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <Swords size={48} className="opacity-20" />
              <p className="font-black text-center uppercase text-sm tracking-widest leading-relaxed">
                Non hai ancora creato<br/>nessuna squadra!
              </p>
              <button 
                onClick={handleCreateNew}
                className="bg-pk-red text-white px-6 py-3 rounded-full font-black uppercase text-xs shadow-lg active:scale-95 transition-all"
              >
                Crea la prima
              </button>
           </div>
         )}

         {teams.sort((a, b) => b.createdAt - a.createdAt).map(team => (
           <div 
             key={team.id}
             className={`bg-white rounded-[32px] p-6 shadow-card border-2 transition-all relative overflow-hidden
                ${team.isActive ? 'border-pk-gold' : 'border-transparent'}
             `}
           >
              {team.isActive && <div className="absolute top-0 right-0 bg-pk-gold text-pk-dark text-[10px] font-black px-4 py-1 rounded-bl-2xl uppercase shadow-sm">Attiva</div>}
              
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="font-black text-xl text-pk-dark uppercase tracking-tighter">{team.name}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                      {team.pokemonIds.length} Pokémon selezionati
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-6 gap-2 mb-6">
                 {team.pokemonIds.map(id => {
                   const pk = box.find(p => p.id === id);
                   if (!pk) return null;
                   return (
                     <img 
                       key={id} 
                       src={getPokemonSprite(pk.pokemonId)} 
                       className="w-full aspect-square bg-slate-50 rounded-xl border border-slate-100 shadow-sm object-contain p-1" 
                     />
                   );
                 })}
                 {[...Array(Math.max(0, 6 - team.pokemonIds.length))].map((_, i) => (
                   <div key={i} className="w-full aspect-square bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-200">
                      <Plus size={16} />
                   </div>
                 ))}
              </div>

              <div className="flex gap-2">
                 {!team.isActive && (
                   <button 
                     onClick={() => setActive(team.id)}
                     className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-xs uppercase hover:bg-slate-200 transition-colors"
                   >
                     Imposta Attiva
                   </button>
                 )}
                 <button 
                   onClick={() => handleEdit(team)}
                   className="flex-1 bg-pk-dark text-white py-3 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2"
                 >
                   <Edit2 size={14} /> Modifica
                 </button>
                 <button 
                   onClick={() => deleteTeam(team.id)}
                   className="bg-red-50 text-pk-red p-3 rounded-2xl hover:bg-red-100"
                 >
                   <Trash2 size={20} />
                 </button>
              </div>
           </div>
         ))}
      </main>
      <BottomNav />
    </div>
  );
}
