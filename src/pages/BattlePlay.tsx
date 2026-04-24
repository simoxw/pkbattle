import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Swords, Shield, Zap, Info, Wind, Heart, X, HeartPulse, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  getPokemonSprite, 
  formatTypeName, 
  getTypeBadgeClass, 
  getExpToNextLevel,
  getEvolutionData,
  getMoveAtLevel,
  getSpeciesBasicData
} from '../lib/pokemonUtils';
import { db } from '../lib/db';
import { useStore } from '../store/useStore';
import { ITEMS } from '../constants/items';
import { type Pokemon, type StatName } from '../types';
import { calculateDamage, calculateStats } from '../lib/battleEngine';
import { decodeTeam } from '../lib/serialization';
import { TRAINERS } from '../data/trainers';

interface StatStages {
  attack: number;
  defense: number;
  spAtk: number;
  spDef: number;
  speed: number;
}

const INITIAL_STAGES: StatStages = { attack: 0, defense: 0, spAtk: 0, spDef: 0, speed: 0 };

interface BattleMessage {
  text: string;
  type?: 'effective' | 'not-effective' | 'no-effect' | 'normal';
}

interface StatPopup {
  id: string;
  stat: string;
  change: number;
}

interface EvaluationEvent {
  type: 'level-up' | 'new-move' | 'evolution';
  pokemon: Pokemon;
  data?: any; 
}

const TypewriterLog = ({ messages }: { messages: BattleMessage[] }) => {
  const [displayedLines, setDisplayedLines] = useState<BattleMessage[]>([]);
  const [msgIndex, setMsgIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (msgIndex < messages.length) {
      const msg = messages[msgIndex];
      
      if (charIndex === 0) {
        setDisplayedLines(prev => [...prev, { text: '', type: msg.type }]);
      }

      const speed = 10; // Più veloce
      if (charIndex < msg.text.length) {
        const char = msg.text[charIndex];
        const timeout = setTimeout(() => {
          setDisplayedLines(prev => {
            const updated = [...prev];
            const lastIdx = updated.length - 1;
            updated[lastIdx] = { ...updated[lastIdx], text: updated[lastIdx].text + char };
            return updated;
          });
          setCharIndex(prev => prev + 1);
        }, speed);
        return () => clearTimeout(timeout);
      } else {
        const timeout = setTimeout(() => {
          setMsgIndex(prev => prev + 1);
          setCharIndex(0);
        }, 400); // Pausa più breve tra messaggi
        return () => clearTimeout(timeout);
      }
    }
  }, [msgIndex, charIndex, messages]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [displayedLines]);

  const getColorClass = (type?: string) => {
    switch (type) {
      case 'effective': return 'text-emerald-400 font-black';
      case 'not-effective': return 'text-orange-400 font-black';
      case 'no-effect': return 'text-purple-400 font-black';
      default: return 'text-white';
    }
  };

  return (
    <div 
      ref={logRef}
      className="bg-pk-dark text-white p-4 font-mono text-[13px] h-36 overflow-y-auto whitespace-pre-wrap border-t-4 border-pk-red leading-relaxed shadow-inner"
    >
      {displayedLines.map((line, i) => (
        <div key={i} className={getColorClass(line.type)}>{line.text}</div>
      ))}
      {msgIndex < messages.length && <span className="animate-pulse inline-block w-2 text-[10px] h-3 bg-pk-gold ml-1"></span>}
    </div>
  );
};

const MoveButton = ({ move, onMove, onShowTooltip, onHideTooltip }: any) => {
  const timerRef = useRef<any>(null);
  const tooltipActive = useRef(false);

  const handleTouchStart = () => {
    timerRef.current = setTimeout(() => {
      onShowTooltip(move);
      tooltipActive.current = true;
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    onHideTooltip();
    setTimeout(() => {
      tooltipActive.current = false;
    }, 100);
  };

  const handleClick = () => {
    if (!tooltipActive.current) {
      onMove(move);
    }
  };

  return (
    <button
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => e.preventDefault()}
      onClick={handleClick}
      className="bg-white border-2 border-slate-200 p-3 rounded-2xl flex items-center justify-between active:bg-slate-50 select-none touch-none relative overflow-hidden group shadow-sm"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${getTypeBadgeClass(move.type).split(' ')[0]}`} />
      <span className="font-black text-[12px] uppercase ml-1 tracking-tight text-pk-dark">{move.name}</span>
      <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase text-white ${getTypeBadgeClass(move.type).split(' ')[0]}`}>
        {formatTypeName(move.type)}
      </div>
    </button>
  );
};

export default function BattlePlay() {
  const navigate = useNavigate();
  const location = useLocation();
  const { inventory, removeItem, addCoins, updateRankStats, expShareEnabled } = useStore();
  const [messages, setMessages] = useState<BattleMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const [playerTeam, setPlayerTeam] = useState<Pokemon[]>([]);
  const [activePlayerIndex, setActivePlayerIndex] = useState(0);
  const [enemyTeam, setEnemyTeam] = useState<any[]>([]);
  const [enemyIndex, setEnemyIndex] = useState(0);

  const [enemyHp, setEnemyHp] = useState(100);
  const [activeTooltip, setActiveTooltip] = useState<any>(null);
  const [rewards, setRewards] = useState({ coins: 0, rank: 0, exp: [] as { pkId: string, name: string, gain: number, levelUp: boolean }[] });
  const [battleState, setBattleState] = useState<'intro' | 'active' | 'victory' | 'defeat'>('active');
  const [modal, setModal] = useState<'switch' | 'backpack' | 'status' | 'evaluation' | null>(null);

  const [evaluationQueue, setEvaluationQueue] = useState<EvaluationEvent[]>([]);
  const loadingTimeoutRef = useRef<any>(null);
  const [currentEvalIndex, setCurrentEvalIndex] = useState(0);
  const [forgetMode, setForgetMode] = useState(false);
  const [currentEvalPk, setCurrentEvalPk] = useState<Pokemon | null>(null);

  useEffect(() => {
    setForgetMode(false);
    const fetchLatestPk = async () => {
      const currentEval = evaluationQueue[currentEvalIndex];
      if (currentEval && currentEval.pokemon) {
        const latest = await db.box.get(currentEval.pokemon.id);
        if (latest) {
          setCurrentEvalPk(latest);
        } else {
          setCurrentEvalPk(currentEval.pokemon);
        }
      }
    };
    if (modal === 'evaluation') {
      fetchLatestPk();
    }
  }, [currentEvalIndex, modal, evaluationQueue]);

  const [playerStages, setPlayerStages] = useState<StatStages>(INITIAL_STAGES);
  const [enemyStages, setEnemyStages] = useState<StatStages>(INITIAL_STAGES);

  const [playerStatPopups, setPlayerStatPopups] = useState<StatPopup[]>([]);
  const [enemyStatPopups, setEnemyStatPopups] = useState<StatPopup[]>([]);

  const triggerStatPopup = (target: 'player' | 'enemy', stat: string, change: number) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const newPopup = { id, stat, change };
    if (target === 'player') {
      setPlayerStatPopups(prev => [...prev, newPopup]);
      setTimeout(() => setPlayerStatPopups(prev => prev.filter(p => p.id !== id)), 2000);
    } else {
      setEnemyStatPopups(prev => [...prev, newPopup]);
      setTimeout(() => setEnemyStatPopups(prev => prev.filter(p => p.id !== id)), 2000);
    }
  };

  const translateStat = (stat: string) => {
    const stats: Record<string, string> = {
      attack: 'Attacco',
      defense: 'Difesa',
      spAtk: 'Att. Sp.',
      spDef: 'Dif. Sp.',
      speed: 'Velocità'
    };
    return stats[stat] || stat;
  };

  const playerPk = playerTeam[activePlayerIndex];
  const activeEnemy = enemyTeam[enemyIndex];

  const calculateExpGain = (enemy: any) => {
    // Formula semplificata: (BaseExp * Level) / 7
    // Poiché non abbiamo BaseExp nel minimalData, usiamo un valore medio di 150
    const baseExp = 150; 
    return Math.floor((baseExp * enemy.level) / 7);
  };

  const processVictory = async () => {
    const gainedCoins = 500 + Math.floor(Math.random() * 200);
    const gainedRank = 15;
    
    addCoins(gainedCoins);
    updateRankStats(1, 0, gainedRank);

    const expResults: any[] = [];
    const evaluationEvents: EvaluationEvent[] = [];
    const updatedTeam = [...playerTeam];

    // Distribuzione EXP
    for (let i = 0; i < updatedTeam.length; i++) {
      const pk = updatedTeam[i];
      if (pk.currentHp > 0 || expShareEnabled) {
        const totalEnemyExp = enemyTeam.reduce((sum, e) => sum + calculateExpGain(e), 0);
        const shareFactor = pk.currentHp > 0 ? (expShareEnabled ? 0.75 : 1) : 0.5;
        const gain = Math.floor(totalEnemyExp * shareFactor);
        
        let newExp = (pk.exp || 0) + gain;
        let newLevel = pk.level;
        let leveledUp = false;

        while (newExp >= getExpToNextLevel(newLevel, pk.growthRate) && newLevel < 100) {
          newExp -= getExpToNextLevel(newLevel, pk.growthRate);
          const oldLevel = newLevel;
          newLevel++;
          leveledUp = true;
          
          // Check for new moves at each level up
          const newMove = await getMoveAtLevel(pk.pokemonId, newLevel);
          if (newMove && !pk.moves.find(m => m.id === newMove.id)) {
            evaluationEvents.push({ type: 'new-move', pokemon: { ...pk, level: newLevel }, data: newMove });
          }

          // Check for evolution
          const evo = await getEvolutionData(pk.pokemonId);
          if (evo && newLevel >= evo.minLevel) {
            evaluationEvents.push({ type: 'evolution', pokemon: { ...pk, level: newLevel }, data: evo });
          }
        }

        pk.exp = newExp;
        const levelDiff = newLevel - pk.level;
        if (leveledUp) {
          evaluationEvents.unshift({ type: 'level-up', pokemon: { ...pk, level: newLevel } });
        }
        pk.level = newLevel;

        if (leveledUp) {
          pk.stats = calculateStats(pk.level, pk.baseStats, pk.ivs, pk.evs, pk.nature);
          pk.currentHp = pk.stats.hp; 
        }

        await db.box.update(pk.id, { 
          exp: pk.exp, 
          level: pk.level, 
          stats: pk.stats,
          currentHp: pk.currentHp
        });

        expResults.push({ pkId: pk.id, name: pk.name, gain, levelUp: leveledUp });
      }
    }

    setRewards({ coins: gainedCoins, rank: gainedRank, exp: expResults });
    if (evaluationEvents.length > 0) {
      setEvaluationQueue(evaluationEvents);
      setCurrentEvalIndex(0);
      setBattleState('victory');
    } else {
      setBattleState('victory');
    }
  };

  const handleNextEval = () => {
    if (currentEvalIndex < evaluationQueue.length - 1) {
      setCurrentEvalIndex(prev => prev + 1);
    } else {
      setModal(null);
      navigate('/battle', { replace: true });
    }
  };

  const handleLearnMove = async (newMove: any, pkId: string, forgetMoveIndex?: number) => {
    const pk = await db.box.get(pkId);
    if (!pk) return;

    let updatedMoves = [...pk.moves];
    if (forgetMoveIndex !== undefined) {
      updatedMoves[forgetMoveIndex] = newMove;
    } else if (updatedMoves.length < 4) {
      updatedMoves.push(newMove);
    } else {
      // should not happen without forgetMode
      return;
    }

    await db.box.update(pkId, { moves: updatedMoves });
    setForgetMode(false);
    handleNextEval();
  };

  const handleEvolution = async (pkId: string, evoData: any) => {
    const pk = await db.box.get(pkId);
    if (!pk) return;

    const basic = await getSpeciesBasicData(evoData.toId);
    if (!basic) return;

    await db.box.update(pkId, {
      pokemonId: evoData.toId,
      name: basic.name,
      types: basic.types,
      // Statistiche ricalcolate con formula ufficiale
      stats: calculateStats(pk.level, basic.baseStats, pk.ivs, pk.evs, pk.nature)
    });

    handleNextEval();
  };

  useEffect(() => {
    const initBattle = async () => {
      // Timeout di sicurezza: se dopo 15 secondi stiamo ancora caricando, torniamo all'hub
      loadingTimeoutRef.current = setTimeout(() => {
        alert("Errore nel caricamento della lotta. Verifica la connessione.");
        navigate('/battle');
      }, 45000);

      // Carica squadra attiva o la prima disponibile
      let activeTeam = await db.teams.toCollection().filter(t => !!t.isActive).first();
      
      if (!activeTeam) {
        activeTeam = await db.teams.toCollection().first();
        if (activeTeam) {
          // Se abbiamo trovato un team ma non era attivo, attiviamolo per coerenza
          await db.teams.update(activeTeam.id, { isActive: true });
        }
      }

      if (!activeTeam || activeTeam.pokemonIds.length === 0) {
         if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
         alert("Non hai una squadra valida! Crea un team di almeno un Pokémon.");
         navigate('/teams');
         return;
      }
      
      const teamPkRaw = await db.box.where('id').anyOf(activeTeam.pokemonIds).toArray();
      // Manteniamo l'ordine definito in pokemonIds
      const teamPk = activeTeam.pokemonIds
        .map(id => teamPkRaw.find(p => p.id === id))
        .filter((p): p is Pokemon => p !== undefined);
      setPlayerTeam(teamPk);

      // Gestione nemico: Sfidante Ufficiale, Codice o Default
      const trainerId = location.state?.trainerId;
      const enemyCode = location.state?.enemyTeamCode;

      if (trainerId) {
        const trainer = TRAINERS.find(t => t.id === trainerId);
        if (trainer) {
          const avgLevel = teamPk.reduce((sum, p) => sum + p.level, 0) / teamPk.length;
          const enemyLevel = Math.max(5, Math.floor(avgLevel) + 2);
          
          // Fetch parallelo di tutti i dati base dei pokemon del trainer
          const enemiesData = await Promise.all(trainer.team.map(id => 
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json())
          ));

          const enemies = await Promise.all(enemiesData.map(async (data, i) => {
            const pkId = trainer.team[i];
            
            // Statistiche Ottimizzate
            const baseStats = {
              hp: data.stats.find((s: any) => s.stat.name === 'hp').base_stat,
              attack: data.stats.find((s: any) => s.stat.name === 'attack').base_stat,
              defense: data.stats.find((s: any) => s.stat.name === 'defense').base_stat,
              spAtk: data.stats.find((s: any) => s.stat.name === 'special-attack').base_stat,
              spDef: data.stats.find((s: any) => s.stat.name === 'special-defense').base_stat,
              speed: data.stats.find((s: any) => s.stat.name === 'speed').base_stat,
            };

            const stats = {
              hp: Math.floor((2 * baseStats.hp + 31 + 63) * enemyLevel / 100) + enemyLevel + 10,
              attack: Math.floor((2 * baseStats.attack + 31 + 63) * enemyLevel / 100) + 5,
              defense: Math.floor((2 * baseStats.defense + 31 + 63) * enemyLevel / 100) + 5,
              spAtk: Math.floor((2 * baseStats.spAtk + 31 + 63) * enemyLevel / 100) + 5,
              spDef: Math.floor((2 * baseStats.spDef + 31 + 63) * enemyLevel / 100) + 5,
              speed: Math.floor((2 * baseStats.speed + 31 + 63) * enemyLevel / 100) + 5,
            };

            // Estrazione mosse (le ultime 4 imparate fino a quel livello)
            const levelUpMoves = data.moves
              .filter((m: any) => m.version_group_details.some((d: any) => 
                d.move_learn_method.name === 'level-up' && d.level_learned_at <= enemyLevel
              ))
              .slice(-4);

            const moves = await Promise.all(levelUpMoves.map(async (me: any) => {
              const mRes = await fetch(me.move.url);
              const m = await mRes.json();
              return {
                id: m.name,
                name: m.names.find((n: any) => n.language.name === 'it')?.name || m.name.charAt(0).toUpperCase() + m.name.slice(1),
                type: m.type.name,
                power: m.power || 0,
                category: (m.damage_class.name === 'status' ? 'status' : (m.damage_class.name === 'special' ? 'special' : 'physical')) as 'physical' | 'special' | 'status',
                accuracy: m.accuracy || 100,
                pp: m.pp,
                maxPp: m.pp,
                priority: m.priority || 0,
                description: m.flavor_text_entries?.find((f: any) => f.language.name === 'it')?.flavor_text || 'Descrizione non disponibile.',
                stat_changes: m.stat_changes?.map((sc: any) => ({
                  stat: sc.stat.name.replace('special-', 'sp'),
                  change: sc.change,
                  target: m.target.name === 'selected-pokemon' ? 'opponent' : 'self'
                }))
              };
            }));

            if (moves.length === 0) moves.push({ name: 'Scontro', type: 'normal', power: 40, category: 'physical' });

            return {
              id: `trainer-${trainerId}-${pkId}-${Math.random()}`,
              pokemonId: pkId,
              name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
              level: enemyLevel,
              currentHp: stats.hp,
              maxHp: stats.hp,
              fainted: false,
              types: data.types.map((t: any) => t.type.name),
              stats,
              moves
            };
          }));

          setEnemyTeam(enemies);
          setEnemyHp(enemies[0].maxHp);
          setMessages([
            { text: `${trainer.title} ${trainer.name} ti sfida!`, type: 'normal' },
            { text: `"${trainer.quote}"`, type: 'normal' },
            { text: `${trainer.name} manda in campo ${enemies[0].name}!`, type: 'normal' },
            { text: `Vai, ${teamPk[0].name}!`, type: 'normal' },
          ]);
          if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
          setLoading(false);
          return;
        }
      }

      if (enemyCode) {
        try {
          const decoded = decodeTeam(enemyCode);
          if (!decoded) throw new Error("Invalid team code");
          // Supporta sia il formato Social (object con .pokemon) che Array diretto
          const pkList = Array.isArray(decoded) ? decoded : decoded.pokemon;
          
          const enemies = pkList.map((p: any, i: number) => ({
            id: `enemy-${i}`,
            pokemonId: p.pokemonId,
            name: p.name || `PKMN ${p.pokemonId}`,
            level: p.level || 50,
            currentHp: p.stats?.hp || 100,
            maxHp: p.stats?.hp || 100,
            fainted: false,
            types: p.types || ['normal'],
            stats: p.stats || { hp: 100, attack: 100, defense: 100, spAtk: 100, spDef: 100, speed: 100 },
            moves: p.moves || [{ name: 'Scontro', type: 'normal', power: 40, category: 'physical' }]
          }));

          setEnemyTeam(enemies);
          setEnemyHp(enemies[0].maxHp);
          setMessages([
            { text: "Hai sfidato una squadra nemica!", type: 'normal' },
            { text: `L'avversario manda in campo ${enemies[0].name}!`, type: 'normal' },
            { text: `Vai, ${teamPk[0].name}!`, type: 'normal' },
          ]);
          if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
          setLoading(false);
          return;
        } catch (e) {
          console.error("Failed to decode enemy team", e);
        }
      }

      // Genera nemico Default
      setEnemyTeam([
        { 
          id: 'v1', pokemonId: 3, name: 'Venusaur', level: 46, currentHp: 160, maxHp: 160, fainted: false,
          types: ['grass', 'poison'],
          stats: { hp: 160, attack: 110, defense: 110, spAtk: 130, spDef: 130, speed: 100 },
          moves: [
            { name: 'Fogliamagica', type: 'grass', power: 60, category: 'special' },
            { name: 'Azione', type: 'normal', power: 40, category: 'physical' },
            { name: 'Colpo Coda', type: 'normal', power: 0, category: 'status', stat_changes: [{ stat: 'defense', change: -1, target: 'opponent' }] }
          ]
        },
        { 
          id: 'b1', pokemonId: 9, name: 'Blastoise', level: 48, currentHp: 170, maxHp: 170, fainted: false,
          types: ['water'],
          stats: { hp: 170, attack: 120, defense: 140, spAtk: 120, spDef: 140, speed: 110 },
          moves: [
            { name: 'Idropompa', type: 'water', power: 110, category: 'special' },
            { name: 'Rafforzamento', type: 'normal', power: 0, category: 'status', stat_changes: [{ stat: 'defense', change: 1, target: 'self' }] }
          ]
        }
      ]);
      
      setEnemyHp(160);
      setMessages([
        { text: "Un Allenatore desidera lottare!", type: 'normal' },
        { text: `L'Allenatore manda in campo Venusaur!`, type: 'normal' },
        { text: `Vai, ${teamPk[0].name}!`, type: 'normal' },
      ]);
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
      setLoading(false);
    };

    initBattle();

    return () => {
      if (loadingTimeoutRef.current) clearTimeout(loadingTimeoutRef.current);
    };
  }, [navigate]);

  const handleEnemyTurn = (currentEnemyHp: number, currentPlayerHp: number, currentEnemyStages: StatStages, currentPlayerStages: StatStages) => {
    if (activeEnemy.fainted || currentEnemyHp <= 0 || battleState !== 'active') return;
    
    setTimeout(() => {
      const moves = activeEnemy.moves || [{ name: 'Scontro', power: 40, type: 'normal', category: 'physical' }];
      const move = moves[Math.floor(Math.random() * moves.length)];
      
      setMessages(prev => [...prev, { text: `${activeEnemy.name} usa ${move.name}!`, type: 'normal' }]);

      if (move.category === 'status' && move.stat_changes) {
        move.stat_changes.forEach((sc: any) => {
          if (sc.target === 'self') {
            setEnemyStages(prev => ({ ...prev, [sc.stat]: Math.min(6, Math.max(-6, prev[sc.stat as keyof StatStages] + sc.change)) }));
            triggerStatPopup('enemy', sc.stat, sc.change);
            setMessages(prev => [...prev, { text: `La ${translateStat(sc.stat)} di ${activeEnemy.name} ${sc.change > 0 ? 'sale' : 'scende'}!`, type: 'normal' }]);
          } else {
            setPlayerStages(prev => ({ ...prev, [sc.stat]: Math.min(6, Math.max(-6, prev[sc.stat as keyof StatStages] + sc.change)) }));
            triggerStatPopup('player', sc.stat, sc.change);
            setMessages(prev => [...prev, { text: `La ${translateStat(sc.stat)} di ${playerPk.name} ${sc.change > 0 ? 'sale' : 'scende'}!`, type: 'normal' }]);
          }
        });
      } else {
        const { damage, effectiveness } = calculateDamage(
          { level: activeEnemy.level, stats: activeEnemy.stats, types: activeEnemy.types, status: activeEnemy.status },
          { stats: playerPk.stats, types: playerPk.types },
          move,
          currentEnemyStages[move.category === 'special' ? 'spAtk' : 'attack' as keyof StatStages],
          currentPlayerStages[move.category === 'special' ? 'spDef' : 'defense' as keyof StatStages]
        );

        let effType: 'effective' | 'not-effective' | 'no-effect' | 'normal' = 'normal';
        if (effectiveness > 1) effType = 'effective';
        else if (effectiveness > 0 && effectiveness < 1) effType = 'not-effective';
        else if (effectiveness === 0) effType = 'no-effect';

        setMessages(prev => [
          ...prev, 
          { text: `Colpito! (${damage} danni)`, type: 'normal' },
          effectiveness !== 1 ? { text: effectiveness > 1 ? "È superefficace!" : "Non è molto efficace...", type: effType } : null
        ].filter(Boolean) as BattleMessage[]);
        
        const newHp = Math.max(0, currentPlayerHp - damage);
        setPlayerTeam(prev => {
          const updated = [...prev];
          updated[activePlayerIndex].currentHp = newHp;
          return updated;
        });

        if (newHp <= 0) {
          setMessages(prev => [...prev, { text: `${playerPk.name} è esausto!`, type: 'normal' }]);
          const hasOthers = playerTeam.some((p, i) => i !== activePlayerIndex && p.currentHp > 0);
          if (!hasOthers) {
            setBattleState('defeat');
          } else {
            setModal('switch');
          }
        }
      }
    }, 1500);
  };

  const handleMove = (move: any) => {
    if (enemyHp <= 0 || playerPk.currentHp <= 0 || battleState !== 'active') return;

    setMessages(prev => [...prev, { text: `${playerPk.name} usa ${move.name}!`, type: 'normal' }]);

    if (move.category === 'status' && move.stat_changes) {
      move.stat_changes.forEach((sc: any) => {
        if (sc.target === 'self') {
          setPlayerStages(prev => ({ ...prev, [sc.stat]: Math.min(6, Math.max(-6, prev[sc.stat as keyof StatStages] + sc.change)) }));
          triggerStatPopup('player', sc.stat, sc.change);
          setMessages(prev => [...prev, { text: `La ${translateStat(sc.stat)} di ${playerPk.name} ${sc.change > 0 ? 'sale' : 'scende'}!`, type: 'normal' }]);
        } else {
          setEnemyStages(prev => ({ ...prev, [sc.stat]: Math.min(6, Math.max(-6, prev[sc.stat as keyof StatStages] + sc.change)) }));
          triggerStatPopup('enemy', sc.stat, sc.change);
          setMessages(prev => [...prev, { text: `La ${translateStat(sc.stat)} di ${activeEnemy.name} ${sc.change > 0 ? 'sale' : 'scende'}!`, type: 'normal' }]);
        }
      });
      handleEnemyTurn(enemyHp, playerPk.currentHp, enemyStages, playerStages);
    } else {
      const { damage, effectiveness } = calculateDamage(
        { level: playerPk.level, stats: playerPk.stats, types: playerPk.types, status: playerPk.status },
        { stats: activeEnemy.stats, types: activeEnemy.types },
        move,
        playerStages[move.category === 'special' ? 'spAtk' : 'attack' as keyof StatStages],
        enemyStages[move.category === 'special' ? 'spDef' : 'defense' as keyof StatStages]
      );

      let effType: 'effective' | 'not-effective' | 'no-effect' | 'normal' = 'normal';
      if (effectiveness > 1) effType = 'effective';
      else if (effectiveness > 0 && effectiveness < 1) effType = 'not-effective';
      else if (effectiveness === 0) effType = 'no-effect';

      setMessages(prev => [
        ...prev, 
        { text: `Colpito! (${damage} danni)`, type: 'normal' },
        effectiveness !== 1 ? { text: effectiveness > 1 ? "È superefficace!" : "Non è molto efficace...", type: effType } : null
      ].filter(Boolean) as BattleMessage[]);
      
      const newEnemyHp = Math.max(0, enemyHp - damage);
      setEnemyHp(newEnemyHp);

      if (newEnemyHp <= 0) {
        setTimeout(() => {
          setMessages(prev => [...prev, { text: `${activeEnemy.name} è esausto!`, type: 'normal' }]);
          
          const nextIndex = enemyIndex + 1;
          if (nextIndex < enemyTeam.length) {
            const updatedTeam = [...enemyTeam];
            updatedTeam[enemyIndex].fainted = true;
            setEnemyTeam(updatedTeam);
            
            setTimeout(() => {
              setEnemyIndex(nextIndex);
              setEnemyHp(enemyTeam[nextIndex].maxHp);
              setEnemyStages(INITIAL_STAGES);
              setMessages(prev => [...prev, { text: `L'avversario manda in campo ${enemyTeam[nextIndex].name}!`, type: 'normal' }]);
            }, 1500);
          } else {
            setTimeout(() => {
              processVictory();
            }, 1000);
          }
        }, 1000);
        return;
      }
      
      handleEnemyTurn(newEnemyHp, playerPk.currentHp, enemyStages, playerStages);
    }
  };

  const handleItemUse = (itemName: string) => {
    const item = ITEMS[itemName];
    if (!item) return;

    const msg = item.effect(playerPk);
    setMessages(prev => [...prev, { text: `Hai usato ${itemName}!`, type: 'normal' }, { text: msg, type: 'normal' }]);
    removeItem(itemName);
    setModal(null);
    
    handleEnemyTurn(enemyHp, playerPk.currentHp, enemyStages, playerStages);
  };

  const handleSwitch = (index: number) => {
    if (index === activePlayerIndex || playerTeam[index].currentHp <= 0) return;

    setMessages(prev => [
      ...prev, 
      { text: `${playerPk.name}, torna!`, type: 'normal' },
      { text: `Vai, ${playerTeam[index].name}!`, type: 'normal' }
    ]);
    setActivePlayerIndex(index);
    setModal(null);

    handleEnemyTurn(enemyHp, playerTeam[index].currentHp, enemyStages, playerStages);
  };

  if (loading) return <div className="h-screen bg-pk-dark flex items-center justify-center text-white font-black uppercase italic animate-pulse">Preparazione Lotta...</div>;

 interface StatBadgeProps {
  stat: string;
  stage: number;
}

const StatBadge: React.FC<StatBadgeProps> = ({ stat, stage }) => {
  if (stage === 0) return null;
  const isUp = stage > 0;
  return (
    <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${isUp ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} shadow-sm`}>
       {stat === 'attack' ? 'Atk' : stat === 'defense' ? 'Dif' : stat === 'spAtk' ? 'Atk+' : stat === 'spDef' ? 'Dif+' : 'Vel'} 
       {Math.abs(stage) > 1 && <span className="opacity-70">x{Math.abs(stage)}</span>}
       {isUp ? '↑' : '↓'}
    </div>
  );
};

  return (
    <div className="flex flex-col h-screen bg-pk-light overflow-hidden font-sans select-none" onContextMenu={(e) => e.preventDefault()}>
      <AnimatePresence>
        {activeTooltip && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-x-4 bottom-44 bg-pk-dark text-white p-5 rounded-[32px] z-50 shadow-2xl border-4 border-pk-gold"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col gap-1">
                <span className="font-black uppercase text-pk-gold tracking-widest text-xl leading-none">{activeTooltip.name}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase ${getTypeBadgeClass(activeTooltip.type)}`}>
                    {formatTypeName(activeTooltip.type)}
                  </span>
                  <span className="text-[8px] font-black uppercase bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                    {activeTooltip.category === 'physical' ? 'Fisica' : activeTooltip.category === 'special' ? 'Speciale' : 'Stato'}
                  </span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                {activeTooltip.category !== 'status' && (
                  <div className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <span className="text-[7px] font-bold text-white/40 uppercase">Potenza</span>
                      <span className="text-xs font-black">{activeTooltip.power || '--'}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-[7px] font-bold text-white/40 uppercase">Prec.</span>
                      <span className="text-xs font-black">{activeTooltip.accuracy === 100 ? '100%' : activeTooltip.accuracy ? activeTooltip.accuracy + '%' : '--'}</span>
                    </div>
                  </div>
                )}
                {activeTooltip.priority !== 0 && (
                  <span className="text-[8px] font-black text-amber-400 uppercase">Priorità {activeTooltip.priority > 0 ? '+' : ''}{activeTooltip.priority}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4 bg-white/5 p-3 rounded-2xl border border-white/5">
              <div className="flex flex-col gap-0.5">
                <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">Attacco usato</span>
                <span className="text-[10px] font-black uppercase text-pk-gold">
                  {activeTooltip.category === 'physical' ? 'Attacco' : activeTooltip.category === 'special' ? 'Attacco Sp.' : 'N/A'}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 border-l border-white/10 pl-4">
                <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest">Difesa bersaglio</span>
                <span className="text-[10px] font-black uppercase text-pk-gold">
                  {activeTooltip.category === 'physical' ? 'Difesa' : activeTooltip.category === 'special' ? 'Difesa Sp.' : 'N/A'}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 font-medium leading-tight italic">
              "{activeTooltip.description || 'Nessuna descrizione disponibile.'}"
            </p>
          </motion.div>
        )}

        {modal === 'switch' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-pk-dark/80 z-[100] p-6 flex flex-col justify-center">
            <div className="bg-white rounded-[40px] p-6 shadow-2xl relative">
              <button onClick={() => setModal(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
              <h2 className="text-xl font-black uppercase mb-6 flex items-center gap-2"><Heart className="text-pk-red"/> Sostituisci Pokémon</h2>
              <div className="grid grid-cols-2 gap-3">
                {playerTeam.map((p, i) => (
                  <button 
                    key={p.id} 
                    onClick={() => handleSwitch(i)}
                    disabled={p.currentHp <= 0 || i === activePlayerIndex}
                    className={`p-3 rounded-3xl border-2 transition-all flex flex-col items-center gap-1 ${i === activePlayerIndex ? 'border-pk-blue bg-blue-50 opacity-50' : p.currentHp <= 0 ? 'bg-slate-100 opacity-30 cursor-not-allowed' : 'border-slate-100 active:scale-95'}`}
                  >
                    <img src={getPokemonSprite(p.pokemonId)} alt="" className="w-12 h-12 object-contain" referrerPolicy="no-referrer" />
                    <div className="text-[10px] font-black uppercase truncate w-full text-center">{p.name}</div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                      <div className={`h-full ${p.currentHp/p.stats.hp > 0.5 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${(p.currentHp/p.stats.hp)*100}%` }} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {modal === 'backpack' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-pk-dark/80 z-[100] p-6 flex flex-col justify-center">
            <div className="bg-white rounded-[40px] p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
              <button onClick={() => setModal(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
              <h2 className="text-xl font-black uppercase mb-4 flex items-center gap-2"><HeartPulse className="text-emerald-500"/> Strumenti Cura</h2>
              <div className="flex-1 overflow-y-auto space-y-2">
                {Object.entries(inventory).filter(([name]) => ITEMS[name]?.category === 'cure').map(([name, qty]) => (
                  <button 
                    key={name}
                    onClick={() => handleItemUse(name)}
                    className="w-full flex justify-between items-center p-4 bg-slate-50 rounded-2xl border-2 border-transparent active:border-emerald-500 transition-all"
                  >
                    <div className="text-left">
                      <div className="font-black text-sm uppercase">{name}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{ITEMS[name].description}</div>
                    </div>
                    <div className="font-black text-pk-blue">x{qty}</div>
                  </button>
                ))}
                {Object.entries(inventory).filter(([name]) => ITEMS[name]?.category === 'cure').length === 0 && (
                  <div className="py-10 text-center text-slate-400 font-bold uppercase text-xs italic">Nessun oggetto curativo</div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {modal === 'status' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-pk-dark/80 z-[100] p-6 flex flex-col justify-center">
             <div className="bg-white rounded-[40px] p-8 shadow-2xl relative text-center">
                <button onClick={() => setModal(null)} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><X size={20}/></button>
                <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6"><Info size={40}/></div>
                <h2 className="text-2xl font-black uppercase mb-2">Stato Lotta</h2>
                <div className="space-y-4 mt-6 text-left">
                   <div className="flex justify-between border-b pb-2">
                      <span className="font-bold text-slate-400 uppercase text-xs">Meteo</span>
                      <span className="font-black text-xs uppercase">Sereno ☀️</span>
                   </div>
                   <div className="flex justify-between border-b pb-2">
                      <span className="font-bold text-slate-400 uppercase text-xs">Turni</span>
                      <span className="font-black text-xs uppercase">{messages.length}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="font-bold text-slate-400 uppercase text-xs">Nemici rimasti</span>
                      <span className="font-black text-xs uppercase">{enemyTeam.filter(e => !e.fainted).length} / {enemyTeam.length}</span>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 relative bg-gradient-to-b from-blue-50/50 to-emerald-50/50 flex flex-col items-center justify-center p-6 overflow-hidden">
        {/* Enemy Side */}
        <div className="w-full flex justify-end items-start mb-6 mt-4">
          <div className="bg-white p-3 rounded-2xl border-2 border-pk-dark shadow-xl w-[200px] relative">
            {/* Stat Change Popups */}
            <div className="absolute -top-12 left-0 right-0 flex flex-col items-center pointer-events-none">
               <AnimatePresence>
                 {enemyStatPopups.map((p) => (
                   <motion.div 
                     key={p.id}
                     initial={{ opacity: 0, y: 10, scale: 0.5 }}
                     animate={{ opacity: 1, y: -20, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className={`mb-1 px-3 py-1 rounded-full font-black text-[10px] uppercase shadow-lg border-2 ${p.change > 0 ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-500 border-rose-600 text-white'}`}
                   >
                     {translateStat(p.stat)} {p.change > 0 ? '↑' : '↓'}
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>

            <div className="flex justify-between items-center mb-1.5">
              <span className="font-black text-[12px] uppercase tracking-widest truncate">{activeEnemy.name}</span>
              <span className="font-bold text-[9px] bg-slate-100 px-1.5 rounded">Lv.{activeEnemy.level}</span>
            </div>
            <div className="h-2.5 bg-slate-200 rounded-full border border-pk-dark overflow-hidden shadow-inner mb-0.5">
               <motion.div 
                 initial={{ width: '100%' }} animate={{ width: `${(enemyHp/activeEnemy.maxHp)*100}%` }}
                 className={`h-full ${enemyHp/activeEnemy.maxHp > 0.5 ? 'bg-emerald-500' : 'bg-rose-500'} transition-colors duration-500`}
               />
            </div>
            <div className="flex justify-between items-center pr-1 mb-1">
               <div className="flex flex-wrap gap-0.5 mt-1 -ml-1">
                  {Object.entries(enemyStages).map(([s, v]) => <StatBadge key={s} stat={s} stage={v as number} />)}
               </div>
               <div className="font-black text-[8px] tabular-nums flex items-center gap-1 opacity-60">
                 <span>{Math.round(enemyHp)}</span>
                 <span className="text-slate-400">/ {activeEnemy.maxHp}</span>
                 <span className="bg-slate-800 text-white px-1 rounded text-[7px] ml-0.5">PS</span>
               </div>
            </div>
            <div className="absolute -bottom-3 right-4 flex gap-1.5">
               {enemyTeam.map((pk, i) => (
                 <div key={i} className={`w-2 h-2 rounded-full border-2 border-white shadow-sm ${pk.fainted ? 'bg-slate-400' : 'bg-pk-red'}`} />
               ))}
            </div>
          </div>
          <div className="ml-4 w-28 h-28 flex items-center justify-center">
             <AnimatePresence mode='wait'>
               <motion.img 
                 key={activeEnemy.id} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                 src={getPokemonSprite(activeEnemy.pokemonId, 'animated')} alt="" className="w-full h-full object-contain drop-shadow-lg" referrerPolicy="no-referrer"
               />
             </AnimatePresence>
          </div>
        </div>

        {/* Player Side */}
        <div className="w-full flex justify-start items-end mt-2 px-4 relative">
          <div className="mr-2 w-40 h-40 flex items-center justify-center relative">
             <AnimatePresence mode='wait'>
               <motion.img 
                 key={playerPk.id} initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                 src={getPokemonSprite(playerPk.pokemonId, 'animated')} alt="" referrerPolicy="no-referrer"
                 className="w-44 h-44 object-contain origin-bottom drop-shadow-[0_15px_15px_rgba(0,0,0,0.15)]"
                 style={{ transform: 'scaleX(-1)' }} // Back sprite simplified as flipped animated
               />
             </AnimatePresence>
          </div>
          <div className="bg-white p-4 rounded-3xl border-2 border-pk-dark shadow-xl w-[230px] bottom-4 left-4 z-10">
            {/* Stat Change Popups */}
            <div className="absolute -top-12 left-0 right-0 flex flex-col items-center pointer-events-none">
               <AnimatePresence>
                 {playerStatPopups.map((p) => (
                   <motion.div 
                     key={p.id}
                     initial={{ opacity: 0, y: 10, scale: 0.5 }}
                     animate={{ opacity: 1, y: -20, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.8 }}
                     className={`mb-1 px-3 py-1 rounded-full font-black text-[10px] uppercase shadow-lg border-2 ${p.change > 0 ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-500 border-rose-600 text-white'}`}
                   >
                     {translateStat(p.stat)} {p.change > 0 ? '↑' : '↓'}
                   </motion.div>
                 ))}
               </AnimatePresence>
            </div>

            <div className="flex justify-between items-center mb-1.5">
              <span className="font-black text-[12px] uppercase tracking-widest text-pk-dark">{playerPk.name}</span>
              <span className="font-bold text-[9px] bg-slate-50 px-2 py-0.5 rounded">Lv.{playerPk.level}</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full border border-pk-dark overflow-hidden mb-1.5 shadow-inner">
               <motion.div 
                 initial={{ width: '100%' }} animate={{ width: `${(playerPk.currentHp / playerPk.stats.hp) * 100}%` }}
                 className={`h-full ${playerPk.currentHp/playerPk.stats.hp > 0.5 ? 'bg-emerald-500' : 'bg-rose-500'} transition-colors duration-500`}
               />
            </div>
            <div className="flex justify-between items-center pr-1 mb-1">
               <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {Object.entries(playerStages).map(([s, v]) => <StatBadge key={s} stat={s} stage={v as number} />)}
               </div>
               <div className="font-black text-[9px] tabular-nums flex items-center gap-1 opacity-60">
                 <span>{Math.round(playerPk.currentHp)}</span>
                 <span className="text-slate-400">/ {playerPk.stats.hp} PS</span>
               </div>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden border border-slate-200 mt-1">
               <motion.div 
                 initial={{ width: '0%' }}
                 animate={{ width: `${((playerPk.exp || 0) / getExpToNextLevel(playerPk.level, playerPk.growthRate)) * 100}%` }}
                 className="h-full bg-pk-blue shadow-[0_0_5px_rgba(59,76,202,0.5)]"
               />
            </div>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col z-20">
        <TypewriterLog messages={messages} />
        
        <div className="grid grid-cols-2 gap-3 p-4 bg-white border-t border-slate-100">
           {playerPk.moves.length > 0 ? playerPk.moves.slice(0, 4).map((move, i) => (
             <MoveButton key={`${move.name}-${i}`} move={move} onMove={handleMove} onShowTooltip={setActiveTooltip} onHideTooltip={() => setActiveTooltip(null)} />
           )) : [
             { name: 'Scontro', type: 'normal' }
           ].map((m, i) => (
             <MoveButton key={`${m.name}-${i}`} move={m} onMove={handleMove} onShowTooltip={setActiveTooltip} onHideTooltip={() => setActiveTooltip(null)} />
           ))}
        </div>

        <div className="grid grid-cols-4 gap-3 px-4 pb-4 bg-white">
           <button onClick={() => setModal('backpack')} className="flex flex-col items-center gap-1.5 bg-slate-50 py-3 rounded-2xl border active:bg-slate-100 transition-colors">
             <Shield size={20} className="text-pk-blue"/> <span className="text-[9px] font-black uppercase tracking-tighter">Zaino</span>
           </button>
           <button onClick={() => setModal('switch')} className="flex flex-col items-center gap-1.5 bg-slate-50 py-3 rounded-2xl border active:bg-slate-100 transition-colors">
             <Heart size={20} className="text-rose-500"/> <span className="text-[9px] font-black uppercase tracking-tighter">Pokémon</span>
           </button>
           <button onClick={() => setModal('status')} className="flex flex-col items-center gap-1.5 bg-slate-50 py-3 rounded-2xl border active:bg-slate-100 transition-colors">
             <Info size={20} className="text-amber-500"/> <span className="text-[9px] font-black uppercase tracking-tighter">Stato</span>
           </button>
           <button 
             onClick={() => {
               navigate('/battle', { replace: true });
             }}
             className="flex flex-col items-center gap-1.5 bg-red-50 py-3 rounded-2xl border border-red-100/50 active:bg-red-100 transition-colors text-pk-red"
           >
             <ChevronLeft size={20}/> <span className="text-[9px] font-black uppercase tracking-tighter">Fuga</span>
           </button>
        </div>
      </div>

      <AnimatePresence>
         {battleState === 'defeat' && (
           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-pk-dark/90 z-[200] flex flex-col items-center justify-center p-12 text-center backdrop-blur-sm">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[48px] p-10 shadow-2xl max-w-sm w-full">
                 <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Heart size={40} /></div>
                 <h2 className="text-3xl font-black uppercase mb-2">Sconfitto</h2>
                 <p className="text-slate-400 font-bold uppercase text-[10px] mb-8">La tua squadra è esausta</p>
                 <button onClick={() => navigate('/battle', { replace: true })} className="w-full bg-pk-dark text-white py-5 rounded-3xl font-black uppercase shadow-xl tracking-widest text-xs">Torna al Centro</button>
              </motion.div>
           </motion.div>
         )}
         {battleState === 'victory' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-pk-dark/90 z-[200] flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm overflow-y-auto">
               <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[48px] p-8 shadow-2xl max-w-sm w-full relative overflow-hidden my-auto">
                  <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-pk-gold via-white to-pk-gold animate-pulse" />
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4"><Swords size={32} /></div>
                  <h2 className="text-3xl font-black text-pk-dark uppercase mb-1 tracking-tighter">Vittoria!</h2>
                  <p className="text-slate-400 font-bold uppercase text-[9px] mb-6 tracking-widest">Risultati Sfida</p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 p-4 rounded-3xl text-left">
                          <div className="text-[8px] font-black text-slate-400 mb-0.5 uppercase tracking-widest">Monete</div>
                          <div className="text-xl font-black text-amber-500">+{rewards.coins}</div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-3xl text-left">
                          <div className="text-[8px] font-black text-slate-400 mb-0.5 uppercase tracking-widest">Rank</div>
                          <div className="text-xl font-black text-pk-blue">+{rewards.rank}</div>
                      </div>
                    </div>

                    <div className="bg-pk-dark text-white p-5 rounded-[32px] text-left max-h-48 overflow-y-auto">
                       <div className="text-[8px] font-black text-white/40 mb-3 uppercase tracking-[0.2em]">Punti Esperienza</div>
                       <div className="space-y-3">
                         {rewards.exp.map(e => (
                           <div key={e.pkId} className="flex justify-between items-center bg-white/5 p-2 px-3 rounded-xl">
                              <div>
                                <div className="text-[10px] font-black uppercase text-pk-gold">{e.name}</div>
                                <div className="text-[8px] font-black text-emerald-400">{e.levelUp ? 'LIVELLO SUPERATO!' : `+${e.gain} EXP`}</div>
                              </div>
                              {e.levelUp && <Sparkles size={14} className="text-pk-gold animate-bounce" />}
                           </div>
                         ))}
                       </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                       if (evaluationQueue.length > 0) {
                         setModal('evaluation');
                       } else {
                         navigate('/battle', { replace: true });
                       }
                    }} 
                    className="w-full bg-pk-dark text-white py-5 rounded-3xl font-black uppercase shadow-xl tracking-widest text-xs active:scale-95 transition-transform"
                  >
                    {evaluationQueue.length > 0 ? 'Continua (Evoluzioni)' : 'Vai al Hub'}
                  </button>
               </motion.div>
            </motion.div>
          )}

          {modal === 'evaluation' && evaluationQueue[currentEvalIndex] && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-pk-dark/95 z-[200] flex items-center justify-center p-6 backdrop-blur-md">
               <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-[48px] p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden border-4 border-pk-gold/20">
                  <div className="absolute top-0 inset-x-0 h-1 bg-pk-gold animate-pulse"></div>
                  
                  {evaluationQueue[currentEvalIndex].type === 'level-up' && (
                    <div className="py-6">
                      <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6"><Sparkles size={40} /></div>
                      <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">{evaluationQueue[currentEvalIndex].pokemon.name}</h2>
                      <p className="text-sm font-bold text-slate-400 uppercase mb-8 tracking-widest">è salito al livello <span className="text-pk-blue">{evaluationQueue[currentEvalIndex].pokemon.level}</span>!</p>
                      <button onClick={handleNextEval} className="w-full bg-pk-dark text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-transform">Fantastico!</button>
                    </div>
                  )}

                  {evaluationQueue[currentEvalIndex].type === 'new-move' && (
                    <div className="py-2 text-left">
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-blue-50 text-pk-blue rounded-full flex items-center justify-center mx-auto mb-4 scale-110 shadow-inner"><Zap size={32} /></div>
                        <h2 className="text-xl font-black uppercase tracking-tighter">{evaluationQueue[currentEvalIndex].pokemon.name}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">vuole imparare <span className="text-pk-blue">{evaluationQueue[currentEvalIndex].data.name}</span></p>
                      </div>

                      {!forgetMode ? (
                        <div className="space-y-4">
                          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                             <div className="flex justify-between items-center mb-2">
                                <span className="font-black text-[13px] uppercase text-pk-dark tracking-tighter">{evaluationQueue[currentEvalIndex].data.name}</span>
                                <span className={`${getTypeBadgeClass(evaluationQueue[currentEvalIndex].data.type)} text-[8px] px-2 py-0.5 rounded-full uppercase font-black`}>{formatTypeName(evaluationQueue[currentEvalIndex].data.type)}</span>
                             </div>
                             <p className="text-[10px] text-slate-500 font-medium italic leading-relaxed">"{evaluationQueue[currentEvalIndex].data.description}"</p>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                             <button 
                               onClick={() => {
                                 const pk = currentEvalPk || evaluationQueue[currentEvalIndex].pokemon;
                                 if (pk.moves && pk.moves.length < 4) {
                                   handleLearnMove(evaluationQueue[currentEvalIndex].data, pk.id);
                                 } else {
                                   setForgetMode(true);
                                 }
                               }}
                               className="w-full bg-pk-blue text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-200 active:scale-95 transition-transform"
                             >
                               Impara Mossa
                             </button>
                             <button onClick={handleNextEval} className="w-full text-slate-300 py-3 font-black uppercase text-[10px] tracking-widest active:opacity-50">Rinuncia</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                           <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                              <p className="text-[10px] font-black text-rose-500 uppercase text-center tracking-tight">Quale mossa deve dimenticare?</p>
                           </div>
                           <div className="grid grid-cols-1 gap-2">
                               {(currentEvalPk || evaluationQueue[currentEvalIndex].pokemon).moves.map((m, idx) => (
                                <button 
                                  key={idx}
                                  onClick={() => handleLearnMove(evaluationQueue[currentEvalIndex].data, (currentEvalPk || evaluationQueue[currentEvalIndex].pokemon).id, idx)}
                                  className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-transparent active:border-rose-500 flex justify-between items-center group transition-all shadow-sm"
                                >
                                   <div className="text-left">
                                      <div className="font-black text-xs uppercase text-pk-dark group-active:text-rose-500">{m.name}</div>
                                      <div className="text-[8px] font-bold text-slate-400">{formatTypeName(m.type)}</div>
                                   </div>
                                   <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-200 group-active:text-rose-500"><X size={16}/></div>
                                </button>
                              ))}
                           </div>
                           <button onClick={() => setForgetMode(false)} className="w-full text-pk-red py-3 font-black uppercase text-[10px] tracking-widest opacity-60">Annulla</button>
                        </div>
                      )}
                    </div>
                  )}

                  {evaluationQueue[currentEvalIndex].type === 'evolution' && (
                    <div className="py-6">
                      <div className="w-24 h-24 bg-pk-gold/10 text-pk-gold rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-inner animate-pulse">
                        <Sparkles size={48} />
                      </div>
                      <h2 className="text-3xl font-black uppercase tracking-tighter mb-2 text-pk-dark">Evoluzione!</h2>
                      <p className="text-[11px] font-bold text-slate-500 uppercase mb-8 tracking-widest leading-relaxed">
                        {evaluationQueue[currentEvalIndex].pokemon.name} <br/>sta per evolversi in <br/>
                        <span className="text-pk-gold text-xl font-black block mt-2">{evaluationQueue[currentEvalIndex].data.toName}</span>
                      </p>
                      <div className="flex flex-col gap-3">
                         <button 
                           onClick={() => handleEvolution(evaluationQueue[currentEvalIndex].pokemon.id, evaluationQueue[currentEvalIndex].data)}
                           className="w-full bg-pk-gold text-pk-dark py-5 rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl shadow-pk-gold/20 active:scale-95 transition-transform"
                         >
                           Conferma
                         </button>
                         <button onClick={handleNextEval} className="w-full text-slate-300 py-2 font-black uppercase text-[10px] tracking-widest active:opacity-50">Ferma</button>
                      </div>
                    </div>
                  )}
               </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
}
