import { useState, useEffect, useCallback, useMemo, useRef, ChangeEvent } from 'react';
import { Import, RotateCcw, Share2, XCircle, Package, Filter, Star, Heart, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Pokemon, BattleState, Move, Trainer } from './types';
import { fetchPokemon, calculateDamage, fetchLearnableMoves } from './services/api';
import { decodeTeam, encodeTeam } from './services/base64';
import { getTypeColors } from './constants';
import { TRAINERS } from './data/trainers';
import { useGameStore } from './store/gameStore';

export default function App() {
  const [battle, setBattle] = useState<BattleState>({
    playerTeam: [],
    opponentTeam: [],
    playerActiveIndex: 0,
    opponentActiveIndex: 0,
    turn: 'player',
    history: [{ text: 'Benvenuto nel campo di battaglia Pokémon!' }],
    status: 'idle',
  });

  const [loading, setLoading] = useState(true);
  const [showImport, setShowImport] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [showBattleMenu, setShowBattleMenu] = useState(false);
  const [showTrainerMenu, setShowTrainerMenu] = useState(false);
  const [showBox, setShowBox] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [selectedBoxPokemon, setSelectedBoxPokemon] = useState<Pokemon | null>(null);
  const [learnableMoves, setLearnableMoves] = useState<Move[]>([]);
  const [infoTab, setInfoTab] = useState<'stats' | 'moves' | 'about'>('stats');
  const box = useGameStore(state => state.box);
  const setBox = useGameStore(state => state.setBox);
  const filters = useGameStore(state => state.filters);
  const setFilterType = useGameStore(state => state.setFilterType);
  const setFilterFav = useGameStore(state => state.setFilterFav);
  const setSortBy = useGameStore(state => state.setSortBy);
  const view = useGameStore(state => state.view);
  const setView = useGameStore(state => state.setView);
  const battleState = useGameStore(state => state.battleState);
  const setBattleState = useGameStore(state => state.setBattleState);
  const setPlayerTeam = useGameStore(state => state.setPlayerTeam);
  const rehydrated = useGameStore(state => state.rehydrated);
  const [importText, setImportText] = useState('');
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [saveText, setSaveText] = useState('');
  const [saveManagerMessage, setSaveManagerMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const defaultPlayerIds = [6, 9, 3, 25, 448, 445];
  const defaultOpponentIds = [150, 248, 143, 130, 94, 65];

  const playerTeamIdsRef = useRef(defaultPlayerIds);
  const restoredBattleRef = useRef(false);

  const initializeBattle = useCallback(async (
    playerIds?: number[], 
    opponentIds = defaultOpponentIds, 
    trainer?: Trainer,
    shouldSwitchView = false
  ) => {
    setLoading(true);
    try {
      // If no playerIds provided, we use the Ref (current selection)
      const finalPlayerIds = playerIds || playerTeamIdsRef.current;
      
      const pTeam = await Promise.all(finalPlayerIds.map(id => fetchPokemon(id)));
      const oTeam = await Promise.all(opponentIds.map(id => fetchPokemon(id)));
      
      // Also populate the box with some initial variety if empty
      if (box.length === 0) {
        setBox([...pTeam]);
      }

      setBattle({
        playerTeam: pTeam,
        opponentTeam: oTeam,
        playerActiveIndex: 0,
        opponentActiveIndex: 0,
        turn: 'player',
        history: [{ text: trainer ? `Ti sfida l'allenatore ${trainer.name}!` : 'Scegli una mossa per iniziare la battaglia!' }],
        status: 'selecting',
        opponentTrainer: trainer
      });
      
      if (shouldSwitchView) {
        setView('battle');
        setShowBattleMenu(false);
        setShowTrainerMenu(false);
      }
    } catch (error) {
      console.error("Initialization error:", error);
    } finally {
      setLoading(false);
    }
  }, [box]);

  const filteredBox = useMemo(() => {
    let result = [...box];
    if (filters.filterType !== 'all') {
      result = result.filter(p => p.types.includes(filters.filterType));
    }
    if (filters.filterFav) {
      result = result.filter(p => p.isFavorite);
    }
    
    result.sort((a, b) => {
      if (filters.sortBy === 'level') return b.level - a.level;
      if (filters.sortBy === 'id') return a.id - b.id;
      if (filters.sortBy === 'ivs') {
        const aIvs: number = a.ivs ? (Object.values(a.ivs) as number[]).reduce((sum, val) => sum + val, 0) : 0;
        const bIvs: number = b.ivs ? (Object.values(b.ivs) as number[]).reduce((sum, val) => sum + val, 0) : 0;
        return bIvs - aIvs;
      }
      return 0;
    });
    
    return result;
  }, [box, filters]);

  const toggleFavorite = (uniqueId: string) => {
    setBox(box.map(p => p.uniqueId === uniqueId ? { ...p, isFavorite: !p.isFavorite } : p));
  };

  const addToTeam = (pokemon: Pokemon) => {
    if (battle.playerTeam.length >= 6) {
        alert("La squadra è già piena! Rimuovi un Pokémon prima.");
        return;
    }
    // Check if already in team (by uniqueId)
    if (battle.playerTeam.some(p => p.uniqueId === pokemon.uniqueId)) {
        alert("Questo Pokémon è già in squadra!");
        return;
    }

    setBattle(prev => ({
        ...prev,
        playerTeam: [...prev.playerTeam, { ...pokemon, fainted: false, hp: pokemon.maxHp }]
    }));
  };

  const removeFromTeam = (index: number) => {
    if (battle.playerTeam.length <= 1) {
        alert("Devi avere almeno un Pokémon in squadra!");
        return;
    }
    setBattle(prev => {
        const newTeam = prev.playerTeam.filter((_, i) => i !== index);
        const newIndex = prev.playerActiveIndex >= newTeam.length ? 0 : prev.playerActiveIndex;
        return {
            ...prev,
            playerTeam: newTeam,
            playerActiveIndex: newIndex
        };
    });
  };

  const openInfoPanel = async (p: Pokemon) => {
    setSelectedBoxPokemon(p);
    setInfoTab('stats');
    setLearnableMoves([]);
    try {
        const moves = await fetchLearnableMoves(p.id);
        setLearnableMoves(moves);
    } catch (e) {
        console.error("Failed to fetch learnable moves:", e);
    }
  };

  useEffect(() => {
    if (battle.playerTeam.length > 0) {
      playerTeamIdsRef.current = battle.playerTeam.map(p => p.id);
    }
  }, [battle.playerTeam]);

  useEffect(() => {
    if (view === 'box') {
      setShowBox(true);
    } else {
      setShowBox(false);
    }
  }, [view]);

  useEffect(() => {
    if (!rehydrated) return;
    if (restoredBattleRef.current) return;

    if (battleState && battleState.playerTeam.length > 0) {
      setBattle(battleState);
      setLoading(false);
    } else {
      initializeBattle();
    }

    restoredBattleRef.current = true;
  }, [rehydrated, battleState, initializeBattle]);

  useEffect(() => {
    setBattleState(battle);
    setPlayerTeam(battle.playerTeam);
  }, [battle, setBattleState, setPlayerTeam]);

  const handleImport = async () => {
    if (!importText) return;
    const ids = decodeTeam(importText);
    if (ids.length > 0) {
      setLoading(true);
      try {
        const newPkmn = await Promise.all(ids.map(id => fetchPokemon(id)));
        setBox([...box, ...newPkmn]);
        setShowImport(false);
        setImportText('');
        setToast(`${newPkmn.length} POKÉMON AGGIUNTI AL BOX!`);
        setTimeout(() => setToast(null), 3000);
      } catch (e) {
        setToast("ERRORE CARICAMENTO!");
      } finally {
        setLoading(false);
      }
    } else {
      setToast("CODICE NON VALIDO!");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const handleChallenge = () => {
    if (!importText) return;
    const ids = decodeTeam(importText);
    if (ids.length > 0) {
      const currentPlayerIds = battle.playerTeam.map(p => p.id);
      initializeBattle(currentPlayerIds.length > 0 ? currentPlayerIds : defaultPlayerIds, ids, undefined, true);
      setShowChallenge(false);
      setImportText('');
    } else {
      setToast("CODICE NON VALIDO!");
      setTimeout(() => setToast(null), 2000);
    }
  };

  const getSavePayload = () => ({
    version: '1',
    box,
    playerTeam: battle.playerTeam,
    battleState: battle,
    filters,
    view,
  });

  const handleExportSave = () => {
    const payload = JSON.stringify(getSavePayload(), null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pkbattle-save.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setToast('Salvataggio esportato!');
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopySave = () => {
    navigator.clipboard.writeText(JSON.stringify(getSavePayload()));
    setToast('Salvataggio copiato negli appunti!');
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenSaveFile = () => {
    fileInputRef.current?.click();
  };

  const handleSaveFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setSaveText(text);
      setSaveManagerMessage('File JSON caricato. Premi IMPORTA SALVATAGGIO per applicarlo.');
    } catch (error) {
      setSaveManagerMessage('Impossibile leggere il file.');
    } finally {
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleLoadSave = () => {
    if (!saveText) return;

    try {
      const parsed = JSON.parse(saveText);
      if (!parsed || typeof parsed !== 'object') throw new Error('Invalid save data');

      setBox(Array.isArray(parsed.box) ? parsed.box : []);
      setPlayerTeam(Array.isArray(parsed.playerTeam) ? parsed.playerTeam : []);
      const incomingBattle = parsed.battleState || null;
      setBattleState(incomingBattle);
      if (incomingBattle) {
        setBattle(incomingBattle);
      }
      if (parsed.view && ['hub', 'battle', 'box'].includes(parsed.view)) {
        setView(parsed.view);
      }
      setFilterType(parsed.filters?.filterType ?? 'all');
      setFilterFav(parsed.filters?.filterFav ?? false);
      setSortBy(parsed.filters?.sortBy ?? 'id');
      setShowSaveManager(false);
      setSaveManagerMessage('Salvataggio caricato correttamente.');
      setToast('Salvataggio caricato!');
      setTimeout(() => setToast(null), 3000);
    } catch (e) {
      setSaveManagerMessage('Salvataggio non valido! Controlla il file JSON.');
      setToast('Salvataggio non valido!');
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleShare = () => {
    const ids = battle.playerTeam.map(p => p.id);
    const code = encodeTeam(ids);
    navigator.clipboard.writeText(code);
    setToast("CODICE COPIATO!");
    setTimeout(() => setToast(null), 2000);
  };

  const executeTurn = async (playerMove: Move) => {
    if (battle.status !== 'selecting') return;

    setBattle(prev => ({ ...prev, status: 'attacking' }));
    
    const playerPkmn = battle.playerTeam[battle.playerActiveIndex];
    const opponentPkmn = battle.opponentTeam[battle.opponentActiveIndex];

    const getEffectLog = (multiplier: number, dmg: number) => {
        if (multiplier > 1) return { text: `È superefficace! (${dmg})`, color: '#51ae5f' };
        if (multiplier === 0) return { text: `Non ha effetto... (${dmg})`, color: '#a855f7' };
        if (multiplier < 1) return { text: `Non è molto efficace... (${dmg})`, color: '#f2ab43' };
        return { text: `Danno inferto: ${dmg}`, color: '#666' };
    };

    // 1. Player Attack
    const pResult = calculateDamage(playerPkmn, opponentPkmn, playerMove);
    const newOpponentHp = Math.max(0, opponentPkmn.hp - pResult.damage);
    
    const pEffectLog = getEffectLog(pResult.multiplier, pResult.damage);

    setBattle(prev => {
      const newOdt = [...prev.opponentTeam];
      newOdt[prev.opponentActiveIndex] = { ...newOdt[prev.opponentActiveIndex], hp: newOpponentHp };
      return {
        ...prev,
        opponentTeam: newOdt,
        history: [
            pEffectLog,
            { text: `${playerPkmn.name} usa ${playerMove.name.toUpperCase()}!` }, 
            ...prev.history
        ],
      };
    });

    await new Promise(r => setTimeout(r, 1000));

    if (newOpponentHp <= 0) {
      setBattle(prev => {
        const newOdt = [...prev.opponentTeam];
        newOdt[prev.opponentActiveIndex] = { ...newOdt[prev.opponentActiveIndex], fainted: true };
        
        const nextIndex = newOdt.findIndex((p, i) => !p.fainted);
        if (nextIndex === -1) {
            return { ...prev, status: 'ended', winner: 'player', history: [{ text: 'HAI VINTO LA BATTAGLIA!', color: '#51ae5f' }, ...prev.history] };
        }
        return {
            ...prev,
            opponentTeam: newOdt,
            opponentActiveIndex: nextIndex,
            status: 'selecting',
            history: [{ text: `${opponentPkmn.name} è esausto! Entra ${newOdt[nextIndex].name}!` }, ...prev.history],
        };
      });
      return;
    }

    // 2. Opponent Attack
    const oMove = opponentPkmn.moves[Math.floor(Math.random() * opponentPkmn.moves.length)];
    const oResult = calculateDamage(opponentPkmn, playerPkmn, oMove);
    const newPlayerHp = Math.max(0, playerPkmn.hp - oResult.damage);
    const oEffectLog = getEffectLog(oResult.multiplier, oResult.damage);

    setBattle(prev => {
      const newPt = [...prev.playerTeam];
      newPt[prev.playerActiveIndex] = { ...newPt[prev.playerActiveIndex], hp: newPlayerHp };
      return {
        ...prev,
        playerTeam: newPt,
        history: [
            oEffectLog,
            { text: `${opponentPkmn.name} nemico usa ${oMove.name.toUpperCase()}!` }, 
            ...prev.history
        ],
      };
    });

    await new Promise(r => setTimeout(r, 1000));

    if (newPlayerHp <= 0) {
      setBattle(prev => {
        const newPt = [...prev.playerTeam];
        newPt[prev.playerActiveIndex] = { ...newPt[prev.playerActiveIndex], fainted: true };
        
        const nextIndex = newPt.findIndex((p, i) => !p.fainted);
        if (nextIndex === -1) {
            return { ...prev, status: 'ended', winner: 'opponent', history: [{ text: 'SCONFITTA! Tutti i tuoi Pokémon sono esausti.', color: '#ff1c1c' }, ...prev.history] };
        }
        return {
            ...prev,
            playerTeam: newPt,
            status: 'switching',
            history: [{ text: `${playerPkmn.name} è esausto! Scegli un altro Pokémon.` }, ...prev.history],
        };
      });
    } else {
      setBattle(prev => ({ ...prev, status: 'selecting' }));
    }
  };

  const switchPokemon = (index: number) => {
    if (battle.playerTeam[index].fainted || index === battle.playerActiveIndex) return;
    
    setBattle(prev => ({
        ...prev,
        playerActiveIndex: index,
        status: 'selecting',
        history: [{ text: `Entra in campo ${prev.playerTeam[index].name}!` }, ...prev.history]
    }));
  };

  const currentOpponent = battle.opponentTeam[battle.opponentActiveIndex];
  const currentPlayer = battle.playerTeam[battle.playerActiveIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-gray flex flex-col items-center justify-center space-y-4">
        <RotateCcw className="animate-spin text-poke-red w-12 h-12" />
        <p className="font-bold text-dark-gray uppercase tracking-widest">Caricamento Squadre...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-gray flex items-center justify-center p-0">
      <div className="app-shell relative w-full min-h-screen max-w-[100vw] bg-[#1a1a1a] overflow-hidden">
        
        <div className="screen-container w-full min-h-screen bg-gradient-to-b from-[#87CEEB] to-[#E0F7FA] overflow-hidden flex flex-col relative">
          
          <AnimatePresence mode="wait">
            {view === 'hub' && (
              <motion.div 
                key="hub"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col p-6 items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-repeat"
              >
                {/* Hub Header */}
                <div className="text-center mb-12">
                   <motion.div 
                    initial={{ y: -20 }}
                    animate={{ y: 0 }}
                    className="text-[10px] font-black text-poke-blue uppercase tracking-[0.3em] mb-2"
                   >
                     Benvenuto Allenatore
                   </motion.div>
                   <h1 className="text-5xl font-black text-dark-gray leading-none tracking-tighter uppercase italic transform -skew-x-12">
                     POKÉ<span className="text-poke-red">BATTLE</span>
                   </h1>
                   <div className="h-1 w-24 bg-poke-yellow mx-auto mt-2 rounded-full" />
                </div>

                {/* Hub Menu */}
                <div className="w-full space-y-4">
                  <button 
                    onClick={() => setShowBattleMenu(true)}
                    className="w-full group relative overflow-hidden bg-poke-red text-white p-6 rounded-3xl border-4 border-white shadow-[0_8px_0_#b91c1c] active:translate-y-1 active:shadow-none transition-all flex items-center justify-between"
                  >
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs font-black uppercase opacity-60 tracking-widest">Inizia la</span>
                      <span className="text-2xl font-black uppercase italic tracking-tight">LOTTA</span>
                    </div>
                    <RotateCcw className="group-hover:rotate-180 transition-transform duration-500" size={32} />
                  </button>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setView('box'); setShowBox(true); }}
                      className="bg-white p-4 rounded-3xl border-4 border-poke-blue text-poke-blue shadow-[0_6px_0_#3b4cca] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Package size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Il Mio Box</span>
                    </button>
                    <button 
                      onClick={() => setShowTrainerMenu(true)}
                      className="bg-white p-4 rounded-3xl border-4 border-poke-red text-poke-red shadow-[0_6px_0_#ff1c1c] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Star size={24} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Campioni</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => { setShowChallenge(true); setView('hub'); }}
                      className="bg-poke-blue text-white p-4 rounded-3xl border-4 border-white shadow-[0_6px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <RotateCcw size={24} className="rotate-45" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Sfida Codice</span>
                    </button>
                    <button 
                      onClick={handleShare}
                      className="bg-poke-yellow text-dark-gray p-4 rounded-3xl border-4 border-white shadow-[0_6px_0_#d1b700] active:translate-y-1 active:shadow-none transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <Share2 size={24} />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Copia Squadra</span>
                    </button>
                  </div>

                  <button 
                    onClick={() => setShowImport(true)}
                    className="w-full bg-dark-gray text-white p-4 rounded-3xl border-4 border-white shadow-[0_6px_0_#000] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4"
                  >
                    <Import size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Importa Pokémon nel Box</span>
                  </button>

                  <button 
                    onClick={() => { setSaveText(JSON.stringify(getSavePayload(), null, 2)); setSaveManagerMessage(''); setShowSaveManager(true); }}
                    className="w-full bg-poke-yellow text-dark-gray p-4 rounded-3xl border-4 border-white shadow-[0_6px_0_#d1b700] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-4"
                  >
                    <Package size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Salvataggio Gioco</span>
                  </button>
                </div>

                {/* Hub Footer Animation */}
                <div className="absolute bottom-8 left-0 right-0 overflow-hidden h-16 opacity-30 pointer-events-none">
                  <div className="flex gap-4 animate-marquee opacity-50 grayscale">
                    {/* Just some sprites for decoration */}
                    {[25, 6, 9, 3, 150].map(id => (
                      <img key={id} src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} className="w-16 h-16" />
                    ))}
                    {[25, 6, 9, 3, 150].map(id => (
                      <img key={id+'-clone'} src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`} className="w-16 h-16" />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {view === 'battle' && (
              <motion.div 
                key="battle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col relative"
              >
                {/* Header Action Bar (Simplified in Battle) */}
                <div className="absolute top-4 left-0 right-0 px-4 flex justify-between z-10">
                  <button 
                    onClick={() => setView('hub')}
                    className="px-3 py-1.5 bg-white text-dark-gray rounded-full text-[10px] font-black border-2 border-dark-gray shadow-md active:scale-95 transition-transform flex items-center gap-1 uppercase"
                  >
                    <ArrowLeft size={10} /> HUB
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleShare}
                      className="p-1.5 bg-poke-yellow text-dark-gray rounded-full text-[10px] font-bold border-2 border-white shadow-md active:scale-95 transition-transform"
                    >
                      <Share2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Battle Arena */}
                <div className="flex-1 relative p-5">
                  {/* Opponent Status */}
                  {currentOpponent && (
                    <motion.div 
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="hp-bar-card absolute top-16 left-4"
                    >
                      <div className="pkmn-name font-bold text-sm flex justify-between items-center mb-1 text-dark-gray">
                        {currentOpponent.name}
                        <span className="text-[8px] bg-poke-blue/10 text-poke-blue px-1.5 py-0.5 rounded">Lv {currentOpponent.level}</span>
                      </div>
                      <div className="flex gap-1 mb-1.5">
                          {currentOpponent.types.map(t => (
                              <span key={t} className={`type-pill`} style={{ backgroundColor: getTypeCode(t) }}>{t}</span>
                          ))}
                      </div>
                      <div className="hp-container">
                        <motion.div 
                          initial={{ width: "100%" }}
                          animate={{ width: `${(currentOpponent.hp / currentOpponent.maxHp) * 100}%` }}
                          className="h-full transition-all duration-500"
                          style={{ backgroundColor: (currentOpponent.hp / currentOpponent.maxHp) < 0.2 ? '#ff1c1c' : (currentOpponent.hp / currentOpponent.maxHp) < 0.5 ? '#f2ab43' : '#51ae5f' }}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Player Status */}
                  {currentPlayer && (
                    <motion.div 
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="hp-bar-card absolute bottom-6 right-4"
                    >
                      <div className="pkmn-name font-bold text-sm flex justify-between items-center mb-1 text-dark-gray">
                        {currentPlayer.name}
                        <span className="text-[8px] bg-poke-red/10 text-poke-red px-1.5 py-0.5 rounded">Lv {currentPlayer.level}</span>
                      </div>
                      <div className="flex gap-1 mb-1.5">
                          {currentPlayer.types.map(t => (
                              <span key={t} className="type-pill" style={{ backgroundColor: getTypeCode(t) }}>{t}</span>
                          ))}
                      </div>
                      <div className="hp-container">
                        <motion.div 
                          initial={{ width: "100%" }}
                          animate={{ width: `${(currentPlayer.hp / currentPlayer.maxHp) * 100}%` }}
                          className="h-full transition-all duration-500"
                          style={{ backgroundColor: (currentPlayer.hp / currentPlayer.maxHp) < 0.2 ? '#ff1c1c' : (currentPlayer.hp / currentPlayer.maxHp) < 0.5 ? '#f2ab43' : '#51ae5f' }}
                        />
                      </div>
                      <div className="text-[9px] mt-1 text-right font-medium text-gray-500 italic">
                        HP: {currentPlayer.hp}/{currentPlayer.maxHp}
                      </div>
                    </motion.div>
                  )}

                  {/* Sprites */}
                  <AnimatePresence mode="wait">
                    {currentOpponent && (
                      <div className="absolute top-24 right-4 sm:right-10 flex flex-col items-center">
                        {battle.opponentTrainer && (
                          <motion.img 
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 0.2, scale: 1.1 }}
                            src={battle.opponentTrainer.sprite}
                            className="w-32 h-32 absolute -top-8 -right-8 z-0 grayscale brightness-0 blur-[1px]"
                            alt="trainer shadow"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <motion.img
                          key={`opp-${currentOpponent.id}`}
                          initial={{ x: 100, opacity: 0, scale: 0.5 }}
                          animate={{ x: 0, opacity: 1, scale: 1 }}
                          exit={{ x: -100, opacity: 0, scale: 0.5 }}
                          src={currentOpponent.sprite}
                          className="w-28 h-28 drop-shadow-2xl pokemon-floating relative z-10"
                          alt="opponent"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </AnimatePresence>

                  <AnimatePresence mode="wait">
                    {currentPlayer && (
                      <motion.img
                        key={`play-${currentPlayer.id}`}
                        initial={{ x: -100, opacity: 0, scale: 0.5 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: 100, opacity: 0, scale: 0.5 }}
                        src={currentPlayer.backSprite}
                        className="absolute bottom-12 left-4 sm:bottom-20 sm:left-10 w-28 h-28 sm:w-36 sm:h-36 drop-shadow-2xl"
                        alt="player"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </AnimatePresence>
                </div>

                <div className="bg-white border-t-4 border-poke-red p-4 flex flex-col gap-3 z-30">
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-[11px] font-bold leading-tight h-24 overflow-y-auto scrollbar-hide space-y-1">
                    {battle.history.map((log, i) => (
                      <div key={i} style={{ color: log.color || '#333' }}>
                        {log.text}
                      </div>
                    ))}
                  </div>

                  {battle.status === 'selecting' && currentPlayer && (
                    <div className="grid grid-cols-2 gap-3">
                      {currentPlayer.moves.slice(0, 4).map((move, i) => (
                        <button
                          key={`${move.name}-${i}`}
                          onClick={() => executeTurn(move)}
                          className="btn-battle text-[11px]"
                          style={{ backgroundColor: getTypeCode(move.type) }}
                        >
                          {move.name.toUpperCase()}
                        </button>
                      ))}
                      <button 
                        onClick={() => setBattle(prev => ({ ...prev, status: 'switching' }))}
                        className="col-span-1 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg py-3 font-bold text-[10px] uppercase shadow-inner"
                      >
                        CAMBIA
                      </button>
                      <button 
                        onClick={() => setView('hub')}
                        className="col-span-1 bg-red-50 text-poke-red border border-red-200 rounded-lg py-3 font-bold text-[10px] uppercase shadow-inner"
                      >
                        RESA
                      </button>
                    </div>
                  )}

                  {(battle.status === 'attacking') && (
                    <div className="flex items-center justify-center italic text-gray-400 text-sm animate-pulse h-12">
                      In attesa della mossa...
                    </div>
                  )}

                  {battle.status === 'switching' && (
                    <div className="grid grid-cols-3 gap-2">
                      {battle.playerTeam.map((p, i) => (
                        <button
                          key={`switch-${i}`}
                          onClick={() => switchPokemon(i)}
                          disabled={p.fainted || i === battle.playerActiveIndex}
                          className={`p-1 rounded-lg border-2 transition-all ${p.fainted ? 'opacity-50 grayscale' : 'active:bg-gray-100'} ${i === battle.playerActiveIndex ? 'border-poke-yellow bg-yellow-50' : 'border-gray-100'}`}
                        >
                          <img src={p.sprite} className="w-10 h-10 mx-auto" alt={p.name} referrerPolicy="no-referrer" />
                          <div className="text-[8px] font-bold text-center truncate uppercase">{p.name}</div>
                        </button>
                      ))}
                      <button 
                        onClick={() => setBattle(prev => ({ ...prev, status: 'selecting' }))}
                        className="col-span-3 py-3 bg-gray-200 text-gray-600 rounded text-[10px] uppercase font-bold"
                      >
                        Annulla
                      </button>
                    </div>
                  )}

                  {battle.status === 'ended' && (
                    <div className="space-y-2">
                      <div className={`text-center font-black text-xl ${battle.winner === 'player' ? 'text-green-600' : 'text-poke-red'}`}>
                        {battle.winner === 'player' ? 'VITTORIA!' : 'SCONFITTA!'}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => initializeBattle()}
                          className="flex-1 bg-poke-blue text-white rounded-xl py-3 font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                        >
                          <RotateCcw size={16} /> RIGIOCA
                        </button>
                        <button 
                          onClick={() => setView('hub')}
                          className="flex-1 bg-dark-gray text-white rounded-xl py-3 font-black text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform"
                        >
                          HUB
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="h-12 bg-black/40 backdrop-blur-md flex items-center justify-center gap-2.5 px-4 mb-0 z-20">
                    {battle.playerTeam.map((p, i) => (
                      <button
                        key={`${p.id}-${i}`}
                        onClick={() => switchPokemon(i)}
                        disabled={battle.status === 'attacking' || p.fainted}
                        className={`relative w-8 h-8 rounded-full border-2 transition-all active:scale-90 ${
                          i === battle.playerActiveIndex ? 'border-poke-yellow bg-poke-yellow shadow-[0_0_10px_rgba(255,222,0,0.5)]' : 'border-white bg-white/20'
                        } ${p.fainted ? 'opacity-30 grayscale cursor-not-allowed' : 'cursor-pointer overflow-hidden'}`}
                      >
                        <img src={p.sprite} className="w-full h-full object-contain" alt={p.name} referrerPolicy="no-referrer" />
                        {p.fainted && <XCircle size={10} className="absolute -top-1 -right-1 text-poke-red bg-white rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase z-[200] border-2 border-white shadow-xl"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Box Overlay */}
        <AnimatePresence>
          {showBox && (
            <motion.div 
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute inset-0 bg-white z-[150] rounded-[36px] flex flex-col overflow-hidden"
            >
                {/* Box Header */}
                <div className="bg-poke-red p-4 text-white flex items-center justify-between">
                    <button onClick={() => { setShowBox(false); setView('hub'); }} className="p-2 active:scale-90"><ArrowLeft size={24} /></button>
                    <h2 className="font-black text-xl tracking-tight uppercase tracking-widest italic">IL MIO BOX</h2>
                    <div className="w-10"></div>
                </div>

                {/* Filters */}
                <div className="p-3 bg-gray-50 border-b flex flex-wrap gap-2 items-center">
                    <div className="flex items-center gap-1 bg-white border rounded-lg px-2 py-1">
                        <Filter size={12} className="text-gray-400" />
                        <select 
                            value={filters.filterType} 
                            onChange={(e) => setFilterType(e.target.value)}
                            className="text-[10px] outline-none bg-transparent font-bold uppercase"
                        >
                            <option value="all">Tutti i Tipi</option>
                            {Object.keys(getTypeColors()).map(t => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>

                    <button 
                        onClick={() => setFilterFav(!filters.filterFav)}
                        className={`flex items-center gap-1 border rounded-lg px-2 py-1 text-[10px] font-bold uppercase ${filters.filterFav ? 'bg-yellow-100 border-yellow-300 text-yellow-700' : 'bg-white text-gray-400'}`}
                    >
                        <Heart size={12} fill={filters.filterFav ? "currentColor" : "none"} /> Preferiti
                    </button>

                    <div className="flex-1"></div>

                    <select 
                        value={filters.sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-[10px] font-bold border rounded-lg px-2 py-1 outline-none"
                    >
                        <option value="id">Ordina per ID</option>
                        <option value="level">Ordina per Livello</option>
                        <option value="ivs">Ordina per Potenziale (IV)</option>
                    </select>
                </div>

                {/* Active Team Section */}
                <div className="p-3 bg-blue-50/50 border-b">
                    <h3 className="text-[10px] font-black text-poke-blue uppercase mb-2 tracking-widest">Squadra Attiva ({battle.playerTeam.length}/6)</h3>
                    <div className="flex gap-2 min-h-12">
                        {battle.playerTeam.map((p, i) => (
                            <div key={p.uniqueId} className="relative group">
                                <div className="w-12 h-12 bg-white rounded-xl border-2 border-poke-blue p-1 shadow-sm overflow-hidden flex items-center justify-center">
                                    <img src={p.sprite} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                                <button 
                                    onClick={() => removeFromTeam(i)}
                                    className="absolute -top-1 -right-1 bg-poke-red text-white rounded-full p-0.5 shadow-md active:scale-95"
                                >
                                    <XCircle size={10} />
                                </button>
                            </div>
                        ))}
                        {Array.from({ length: 6 - battle.playerTeam.length }).map((_, i) => (
                            <div key={i} className="w-12 h-12 bg-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                                <Star size={16} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Box List */}
                <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start">
                    {filteredBox.map((p) => {
                        const isInTeam = battle.playerTeam.some(tp => tp.uniqueId === p.uniqueId);
                        const totalIvs: number = p.ivs ? (Object.values(p.ivs) as number[]).reduce((a, b) => a + b, 0) : 0;
                        const ivPercentage = Math.floor((totalIvs / 186) * 100);

                        return (
                            <motion.div 
                                layout
                                key={p.uniqueId}
                                className={`relative bg-white border-2 rounded-2xl p-3 shadow-sm transition-all ${isInTeam ? 'border-poke-blue bg-blue-50' : 'border-gray-100'}`}
                            >
                                <button 
                                    onClick={() => toggleFavorite(p.uniqueId!)}
                                    className="absolute top-2 left-2 z-10"
                                >
                                    <Heart size={16} className={p.isFavorite ? "text-red-500" : "text-gray-200"} fill={p.isFavorite ? "currentColor" : "none"} />
                                </button>
                                
                                <div className="text-[8px] text-gray-400 absolute top-2 right-2 font-mono">#{p.id.toString().padStart(3, '0')}</div>

                                <div 
                                    onClick={() => openInfoPanel(p)}
                                    className="flex flex-col items-center cursor-pointer"
                                >
                                    <div className="w-20 h-20 flex items-center justify-center mb-1">
                                        <img src={p.sprite} className="w-full h-full object-contain" referrerPolicy="no-referrer" alt={p.name} />
                                    </div>
                                    <div className="font-black text-xs text-center truncate w-full uppercase">{p.name}</div>
                                    <div className="flex gap-1 mt-1">
                                        {p.types.map(t => (
                                            <span key={t} className="text-[7px] text-white px-1.5 py-0.5 rounded font-bold uppercase" style={{ backgroundColor: getTypeCode(t) }}>
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <div className="w-full mt-3 grid grid-cols-2 gap-1 text-[8px] border-t pt-2">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">LV:</span>
                                            <span className="font-bold">{p.level}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">IV%:</span>
                                            <span className={`font-bold ${ivPercentage > 80 ? 'text-poke-blue' : ivPercentage > 50 ? 'text-hp-green' : 'text-gray-600'}`}>
                                                {ivPercentage}%
                                            </span>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => isInTeam ? null : addToTeam(p)}
                                        disabled={isInTeam}
                                        className={`w-full mt-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-sm transition-all ${
                                            isInTeam 
                                            ? 'bg-green-100 text-green-600' 
                                            : 'bg-poke-blue text-white active:scale-95'
                                        }`}
                                    >
                                        {isInTeam ? <><CheckCircle2 size={10} /> In Squadra</> : 'Aggiungi'}
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pokemon Info Panel */}
        <AnimatePresence>
            {selectedBoxPokemon && (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="absolute inset-4 bg-white z-[200] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-poke-red"
                >
                    <div className="bg-poke-red p-4 flex items-center justify-between text-white">
                        <h3 className="font-black uppercase tracking-tight">Dettagli Pokémon</h3>
                        <button onClick={() => setSelectedBoxPokemon(null)} className="p-1"><XCircle size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-24 h-24 bg-gray-50 rounded-2xl flex items-center justify-center border p-2">
                                <img src={selectedBoxPokemon.sprite} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] text-gray-400 font-mono italic">#{selectedBoxPokemon.id.toString().padStart(3, '0')}</div>
                                <h4 className="font-black text-xl text-dark-gray uppercase leading-none mb-1">{selectedBoxPokemon.name}</h4>
                                <div className="flex gap-1 mb-2">
                                    {selectedBoxPokemon.types.map(t => (
                                        <span key={t} className="text-[8px] text-white px-2 py-0.5 rounded font-bold uppercase" style={{ backgroundColor: getTypeCode(t) }}>{t}</span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">LV {selectedBoxPokemon.level}</span>
                                    <span className="text-[10px] font-bold bg-poke-yellow/20 px-2 py-0.5 rounded text-poke-yellow-dark text-[#856404]">{selectedBoxPokemon.nature}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tabs */}
                        <div className="flex border-b">
                            {['stats', 'moves', 'about'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setInfoTab(tab as any)}
                                    className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                        infoTab === tab ? 'border-b-2 border-poke-red text-poke-red bg-red-50' : 'text-gray-400'
                                    }`}
                                >
                                    {tab === 'stats' ? 'Statistiche' : tab === 'moves' ? 'Mosse' : 'Info'}
                                </button>
                            ))}
                        </div>

                        {/* Tab Content */}
                        <div className="py-2">
                            {infoTab === 'stats' && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-3 gap-2 text-center border-b pb-3">
                                        <div>
                                            <div className="text-[8px] text-gray-400 uppercase font-bold">Base Total</div>
                                            <div className="font-black text-sm text-poke-blue">
                                                {selectedBoxPokemon.baseStats ? Object.values(selectedBoxPokemon.baseStats).reduce((a, b) => (a as any) + b, 0) as any : '---'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-gray-400 uppercase font-bold">IV Total</div>
                                            <div className="font-black text-sm text-hp-green">
                                                {selectedBoxPokemon.ivs ? (Object.values(selectedBoxPokemon.ivs) as number[]).reduce((a, b) => a + b, 0) : '---'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] text-gray-400 uppercase font-bold">EV Total</div>
                                            <div className="font-black text-sm text-poke-red">
                                                {selectedBoxPokemon.evs ? (Object.values(selectedBoxPokemon.evs) as number[]).reduce((a, b) => a + b, 0) : '---'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Stats Rows */}
                                    <div className="space-y-2">
                                        {[
                                            { label: 'HP', key: 'hp', color: 'bg-hp-green' },
                                            { label: 'ATTACK', key: 'attack', color: 'bg-poke-red' },
                                            { label: 'DEFENSE', key: 'defense', color: 'bg-poke-blue' },
                                            { label: 'SP. ATK', key: 'spAtk', color: 'bg-purple-500' },
                                            { label: 'SP. DEF', key: 'spDef', color: 'bg-yellow-500' },
                                            { label: 'SPEED', key: 'speed', color: 'bg-pink-500' },
                                        ].map(s => {
                                            const base = selectedBoxPokemon.baseStats?.[s.key as keyof typeof selectedBoxPokemon.baseStats] || 0;
                                            const iv = selectedBoxPokemon.ivs?.[s.key as keyof typeof selectedBoxPokemon.ivs] || 0;
                                            const ev = selectedBoxPokemon.evs?.[s.key as keyof typeof selectedBoxPokemon.evs] || 0;
                                            const current = (selectedBoxPokemon as any)[s.key === 'spAtk' ? 'specialAttack' : s.key === 'spDef' ? 'specialDefense' : s.key] || 0;
                                            
                                            return (
                                                <div key={s.key} className="space-y-1">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{s.label}</span>
                                                        <div className="flex gap-2">
                                                            <span className="text-[8px] text-gray-400 font-mono italic">B:{base} / I:{iv} / E:{ev}</span>
                                                            <span className="text-[11px] font-black text-dark-gray">{current}</span>
                                                        </div>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(100, (current / 250) * 100)}%` }}
                                                            className={`h-full ${s.color}`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {infoTab === 'moves' && (
                                <div className="space-y-4">
                                     <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-poke-blue uppercase border-l-4 border-poke-blue pl-2 tracking-widest">Attuali</h5>
                                        <div className="grid grid-cols-2 gap-2">
                                            {selectedBoxPokemon.moves.map(m => (
                                                <div key={m.name} className="p-2 border rounded-xl bg-gray-50 flex flex-col">
                                                    <div className="font-black text-[9px] uppercase truncate">{m.name}</div>
                                                    <div className="text-[7px] text-gray-400 uppercase font-bold mt-1 line-clamp-1">{m.description}</div>
                                                    <div className="flex justify-between items-center mt-2">
                                                        <span className="text-[7px] text-white px-1 rounded font-bold uppercase" style={{ backgroundColor: getTypeCode(m.type) }}>{m.type}</span>
                                                        <span className="text-[8px] font-bold">P: {m.power || '--'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h5 className="text-[10px] font-black text-poke-red uppercase border-l-4 border-poke-red pl-2 tracking-widest">Imparabili</h5>
                                        {learnableMoves.length === 0 ? (
                                             <div className="text-center py-4 text-gray-400 animate-pulse text-[10px] uppercase font-bold">Caricamento mosse...</div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-2">
                                                {learnableMoves.slice(0, 8).map(m => (
                                                    <div key={m.name} className="p-2 border border-dashed rounded-xl flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[8px] shrink-0" style={{ backgroundColor: getTypeCode(m.type) }}>{m.type[0].toUpperCase()}</div>
                                                        <div className="flex-1">
                                                            <div className="font-black text-[9px] uppercase">{m.name}</div>
                                                            <div className="text-[7px] text-gray-400 line-clamp-1 italic">{m.description}</div>
                                                        </div>
                                                        <div className="text-[8px] font-bold tabular-nums">P: {m.power || '--'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {infoTab === 'about' && (
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <h5 className="text-[10px] font-black text-dark-gray uppercase mb-1 tracking-widest">Abilità</h5>
                                        <div className="font-black text-sm text-poke-blue uppercase mb-1">{selectedBoxPokemon.ability?.name}</div>
                                        <div className="text-xs text-gray-600 leading-relaxed italic">
                                            {selectedBoxPokemon.ability?.description || 'Nessuna descrizione disponibile.'}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                                            <div className="text-[8px] text-poke-red font-black uppercase mb-1">Catturato il</div>
                                            <div className="text-[10px] font-bold text-gray-600">{new Date().toLocaleDateString('it-IT')}</div>
                                        </div>
                                        <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                                            <div className="text-[8px] text-poke-blue font-black uppercase mb-1">Esperienza</div>
                                            <div className="text-[10px] font-bold text-gray-600">--- PV</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        {/* Battle Selection Menu */}
        <AnimatePresence>
          {showBattleMenu && (
            <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-[40px] p-8 w-full max-w-sm space-y-6 border-4 border-poke-red shadow-2xl"
              >
                <div className="text-center space-y-1">
                  <h3 className="font-black text-dark-gray text-2xl uppercase italic leading-none">Modalità Lotta</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scegli la tua sfida</p>
                </div>
                
                <div className="grid gap-4">
                  <button 
                    onClick={() => initializeBattle(undefined, undefined, undefined, true)}
                    className="w-full bg-hp-green text-white p-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-between border-b-4 border-green-700 active:translate-y-1 active:border-b-0"
                  >
                    Sfida Casuale <RotateCcw size={18} />
                  </button>

                  <button 
                    onClick={() => setShowTrainerMenu(true)}
                    className="w-full bg-poke-blue text-white p-5 rounded-3xl font-black text-sm uppercase tracking-widest flex items-center justify-between border-b-4 border-blue-900 active:translate-y-1 active:border-b-0"
                  >
                    Allenatori <CheckCircle2 size={18} />
                  </button>
                  
                  <button 
                    onClick={() => setShowBattleMenu(false)}
                    className="w-full bg-gray-100 text-gray-400 p-4 rounded-2xl font-black text-xs uppercase"
                  >
                    CHIUDI
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Trainer Selection Menu */}
        <AnimatePresence>
          {showTrainerMenu && (
            <div className="absolute inset-0 bg-black/90 z-[250] flex flex-col p-8 backdrop-blur-md overflow-y-auto scrollbar-hide">
               <div className="flex items-center justify-between mb-8">
                  <button onClick={() => setShowTrainerMenu(false)} className="text-white bg-white/10 p-2 rounded-full"><ArrowLeft size={24} /></button>
                  <h3 className="font-black text-white text-xl uppercase italic">ALLENATORI</h3>
                  <div className="w-10"></div>
               </div>

               <div className="grid grid-cols-1 gap-4 pb-12">
                  {TRAINERS.map(trainer => (
                    <motion.button
                      key={trainer.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => initializeBattle(undefined, trainer.team, trainer, true)}
                      className="group relative bg-white/5 border-2 border-white/10 p-5 rounded-[32px] flex items-center gap-6 text-left hover:bg-white/10 transition-colors"
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-poke-blue/20 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img src={trainer.sprite} className="w-24 h-24 object-contain relative z-10" alt={trainer.name} />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-black text-poke-blue uppercase tracking-widest mb-1">{trainer.id === 'red' ? 'Leggenda' : 'Campione'}</div>
                        <div className="text-2xl font-black text-white uppercase italic leading-none truncate">{trainer.name}</div>
                        <div className="mt-2 text-[10px] text-white/40 italic line-clamp-2">"{trainer.quote}"</div>
                      </div>
                    </motion.button>
                  ))}
               </div>
            </div>
          )}
        </AnimatePresence>

        {showImport && (
          <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl">
              <h3 className="font-black text-poke-red text-center text-xl tracking-tight">IMPORTA NEL BOX</h3>
              <p className="text-[11px] text-gray-500 text-center uppercase font-bold tracking-tighter italic">I Pokémon verranno aggiunti alla tua collezione.</p>
              <textarea 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-32 bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-xs font-mono focus:border-poke-blue focus:ring-0 outline-hidden transition-all text-dark-gray"
                placeholder="Incolla il codice..."
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowImport(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm"
                >
                  ANNULLA
                </button>
                <button 
                  onClick={handleImport}
                  className="flex-[2] py-3 bg-poke-blue text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
                >
                  IMPORTA
                </button>
              </div>
            </div>
          </div>
        )}

        {showSaveManager && (
          <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md space-y-4 shadow-2xl">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setShowSaveManager(false)}
                  className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-dark-gray bg-gray-100 rounded-full px-3 py-2 border border-gray-200 shadow-sm active:scale-95 transition-transform"
                >
                  <ArrowLeft size={14} /> INDIETRO
                </button>
                <h3 className="font-black text-poke-yellow text-center text-xl tracking-tight flex-1">SALVATAGGIO DI GIOCO</h3>
                <div className="w-20" />
              </div>
              <p className="text-[11px] text-gray-500 text-center uppercase font-bold tracking-tighter italic">Esporta o importa il salvataggio completo del gioco.</p>
              <p className="text-[10px] text-gray-400 text-center italic">Puoi incollare il JSON oppure selezionare un file `.json` dal dispositivo.</p>
              {saveManagerMessage && (
                <div className="text-[11px] text-center text-dark-gray bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                  {saveManagerMessage}
                </div>
              )}
              <textarea 
                value={saveText}
                onChange={(e) => setSaveText(e.target.value)}
                className="w-full h-48 bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-xs font-mono focus:border-poke-blue focus:ring-0 outline-hidden transition-all text-dark-gray"
                placeholder="Incolla qui il JSON del salvataggio..."
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={handleSaveFileChange}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
                <button 
                  onClick={() => { setShowSaveManager(false); setSaveManagerMessage(''); }}
                  className="py-3 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm"
                >
                  ANNULLA
                </button>
                <button 
                  onClick={handleOpenSaveFile}
                  className="py-3 bg-white text-dark-gray rounded-xl font-bold text-sm border-2 border-gray-200 shadow-sm active:scale-95 transition-transform"
                >
                  SELEZIONA FILE
                </button>
                <button 
                  onClick={handleLoadSave}
                  className="py-3 bg-poke-blue text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
                >
                  IMPORTA SALVATAGGIO
                </button>
                <button 
                  onClick={handleExportSave}
                  className="py-3 bg-poke-yellow text-dark-gray rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
                >
                  ESPORTA FILE
                </button>
              </div>
              <button 
                onClick={handleCopySave}
                className="w-full py-3 bg-white text-dark-gray rounded-xl font-bold text-sm border-2 border-gray-200 shadow-sm active:scale-95 transition-transform"
              >
                COPIA JSON NEGLI APPUNTI
              </button>
            </div>
          </div>
        )}

        {showChallenge && (
          <div className="absolute inset-0 bg-black/80 z-[200] flex items-center justify-center p-8 backdrop-blur-sm">
            <div className="bg-white rounded-3xl p-6 w-full max-w-xs space-y-4 shadow-2xl">
              <h3 className="font-black text-poke-blue text-center text-xl tracking-tight">SFIDA CODICE</h3>
              <p className="text-[11px] text-gray-500 text-center uppercase font-bold tracking-tighter italic">Incolla il codice dell'amico per sfidare la sua squadra!</p>
              <textarea 
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="w-full h-32 bg-gray-50 border-2 border-gray-200 rounded-xl p-3 text-xs font-mono focus:border-poke-blue focus:ring-0 outline-hidden transition-all text-dark-gray"
                placeholder="Incolla il codice sfida..."
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowChallenge(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-400 rounded-xl font-bold text-sm"
                >
                  ANNULLA
                </button>
                <button 
                  onClick={handleChallenge}
                  className="flex-[2] py-3 bg-poke-red text-white rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform"
                >
                  COMBATTI
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .pokemon-floating {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(2deg); }
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .mobile-shell {
          box-sizing: content-box;
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}} />
    </div>
  );
}

function getTypeCode(type: string): string {
    return getTypeColors()[type] || '#777';
}

