import React, { useState, useEffect } from 'react';
import { Gamepad2, Brain, Box, Target, Trophy, Dice5, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';
import toast from 'react-hot-toast';

const GAMES = [
  { id: 'ludo', name: 'Ludo Express', icon: Dice5, description: '4-Player race to the finish line.' },
  { id: 'tictactoe', name: 'Tic Tac Toe', icon: Target, description: 'Classic 3-in-a-row challenge.' },
  { id: 'memory', name: 'Memory Tiles', icon: Brain, description: 'Test your photographic memory.' },
];

export default function GameZone() {
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const { user } = useAuth();

  const awardPoints = async (points: number, type: 'game' | 'post') => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {
        totalPoints: increment(points)
      };
      if (type === 'game') updates.gamePoints = increment(points);
      else updates.postsPoints = increment(points);
      
      await updateDoc(userRef, updates);
      toast.success(`+${points} Points earned!`);
    } catch (err) {
      console.error('Points award failed:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-black font-heading mb-4 tracking-tight uppercase">GAME ZONE</h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Unlock your arcade spirit & Earn Points</p>
      </div>

      {!activeGame ? (
        <div className="grid md:grid-cols-3 gap-8">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => setActiveGame(game.id)}
              className="group glass-card p-8 text-left hover:border-primary-500/50 transition-all hover:shadow-2xl hover:shadow-primary-500/10"
            >
              <div className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 rounded-3xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-500 group-hover:scale-110 transition-transform shadow-inner">
                  <game.icon className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold font-heading group-hover:text-primary-500 transition-colors uppercase">{game.name}</h3>
                  <p className="text-slate-500 mt-2 font-medium text-sm line-clamp-2">{game.description}</p>
                </div>
                <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-primary-500 bg-primary-500/10 px-4 py-2 rounded-full">
                   Play & Earn Points
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <button onClick={() => setActiveGame(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors">Exit Game</button>
             <h2 className="font-black font-heading uppercase text-primary-500">{GAMES.find(g => g.id === activeGame)?.name}</h2>
             <div className="w-20"></div>
          </div>
          
          <div className="glass-card p-4 md:p-12 flex items-center justify-center min-h-[500px]">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeGame}
                 initial={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="w-full max-w-2xl"
               >
                 {activeGame === 'ludo' && <LudoGame onWin={() => awardPoints(50, 'game')} />}
                 {activeGame === 'tictactoe' && <TicTacToe onWin={() => awardPoints(10, 'game')} />}
                 {activeGame === 'memory' && <MemoryGame onWin={() => awardPoints(20, 'game')} />}
               </motion.div>
             </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function LudoGame({ onWin }: { onWin: () => void }) {
  const players = [
    { color: 'red', pos: -1, id: 0, name: 'Red Player' },
    { color: 'blue', pos: -1, id: 1, name: 'Blue Player' },
    { color: 'green', pos: -1, id: 2, name: 'Green Player' },
    { color: 'yellow', pos: -1, id: 3, name: 'Yellow Player' }
  ];
  const [gameState, setGameState] = useState(players);
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(1);
  const [rolling, setRolling] = useState(false);
  const [winner, setWinner] = useState<number | null>(null);

  const rollDice = () => {
    if (rolling || winner !== null) return;
    setRolling(true);
    setTimeout(() => {
      const val = Math.floor(Math.random() * 6) + 1;
      setDice(val);
      setRolling(false);
      
      setGameState(prev => {
        const next = [...prev];
        const currentPlayer = next[turn];
        
        // Simple logic: need a 6 to start
        if (currentPlayer.pos === -1) {
          if (val === 6) currentPlayer.pos = 0;
        } else {
          currentPlayer.pos = Math.min(currentPlayer.pos + val, 20); // 20 steps to win
        }

        if (currentPlayer.pos === 20) {
          setWinner(turn);
          onWin();
        }
        
        return next;
      });

      if (val !== 6) {
        setTurn((turn + 1) % 4);
      }
    }, 600);
  };

  const getPlayerStyles = (color: string) => {
    const colors: any = {
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500'
    };
    return colors[color];
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      <div className="flex flex-wrap justify-center gap-4 w-full">
         {gameState.map((p, i) => (
           <div key={p.id} className={`flex-1 min-w-[120px] p-4 rounded-2xl border-2 transition-all ${turn === i ? `border-${p.color}-500 shadow-lg scale-105` : 'border-slate-100 dark:border-slate-800 opacity-50'}`}>
              <div className={`w-3 h-3 rounded-full mb-1 ${getPlayerStyles(p.color)}`}></div>
              <p className="text-[10px] font-black uppercase text-slate-400">Player {i + 1}</p>
              <p className="font-bold text-sm truncate">{p.name}</p>
              <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                 <div className={`h-full ${getPlayerStyles(p.color)} transition-all duration-500`} style={{width: `${(p.pos/20)*100}%`}}></div>
              </div>
           </div>
         ))}
      </div>

      <div className="relative glass-card p-12 flex flex-col items-center">
         {winner !== null && (
           <motion.div initial={{scale:0}} animate={{scale:1}} className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex flex-col items-center justify-center p-6 text-center z-10 rounded-2xl">
              <Trophy className="w-16 h-16 text-yellow-500 mb-4" />
              <h3 className="text-2xl font-black uppercase">Winner!</h3>
              <p className="font-bold text-slate-500 uppercase tracking-widest">{gameState[winner].name} WON!</p>
              <button 
                onClick={() => { setGameState(players); setTurn(0); setWinner(null); }}
                className="mt-6 px-8 py-3 bg-primary-500 text-white rounded-xl font-bold uppercase text-xs"
              >
                Play Again
              </button>
           </motion.div>
         )}

         <div className={`w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-3xl font-black mb-6 border-4 border-white dark:border-slate-700 shadow-inner ${rolling ? 'animate-bounce' : ''}`}>
            {dice}
         </div>

         <button 
           onClick={rollDice}
           disabled={rolling || winner !== null}
           className="px-12 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50"
         >
           {rolling ? 'Rolling...' : 'Roll Dice'}
         </button>

         <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
           Turn: <span className={`font-black text-${gameState[turn].color}-500`}>{gameState[turn].name}</span>
         </p>
      </div>
      
      <div className="text-center">
         <p className="text-xs font-medium text-slate-500 max-w-sm">Reach position 20 to win. You must roll a 6 to start moving!</p>
      </div>
    </div>
  );
}

function TicTacToe({ onWin }: { onWin: () => void }) {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);

  const winner = calculateWinner(board);
  const status = winner ? `Winner: ${winner}` : board.every(b => b) ? 'Draw!' : `Next: ${isXNext ? 'X' : 'O'}`;

  useEffect(() => {
    if (winner === 'X') onWin();
  }, [winner]);

  function calculateWinner(squares: any[]) {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let line of lines) {
      const [a, b, c] = line;
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <div className={`mb-8 p-4 rounded-xl font-black uppercase text-xl ${winner ? 'bg-green-100 text-green-700' : 'bg-primary-50 text-primary-600'}`}>
        {status}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            disabled={!!winner || !!cell}
            onClick={() => {
              const newBoard = [...board];
              newBoard[i] = isXNext ? 'X' : 'O';
              setBoard(newBoard);
              setIsXNext(!isXNext);
            }}
            className="w-24 h-24 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl flex items-center justify-center text-4xl font-black disabled:cursor-not-allowed group shadow-sm active:scale-95 transition-transform"
          >
            <span className={cell === 'X' ? 'text-primary-500' : 'text-slate-400'}>{cell}</span>
          </button>
        ))}
      </div>
      <button onClick={() => { setBoard(Array(9).fill(null)); setIsXNext(true); }} className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs">Reset Game</button>
    </div>
  );
}

function MemoryGame({ onWin }: { onWin: () => void }) {
  const icons = ['🍎', '🍌', '🍇', '🍊', '🍓', '🍒', '🍉', '🥝'];
  const [cards, setCards] = useState(() => [...icons, ...icons].sort(() => Math.random() - 0.5));
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);

  useEffect(() => {
    if (matched.length === cards.length && matched.length > 0) onWin();
  }, [matched]);

  const handleFlip = (i: number) => {
    if (flipped.length === 2 || matched.includes(i) || flipped.includes(i)) return;
    const newFlipped = [...flipped, i];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setMatched([...matched, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="mb-8 p-4 bg-primary-50 dark:bg-primary-900/20 text-xl font-black uppercase text-primary-600 rounded-xl">
        {matched.length === cards.length ? 'Complexity Mastered!' : `Matched: ${matched.length / 2} / ${icons.length}`}
      </div>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((icon, i) => (
          <button
            key={i}
            onClick={() => handleFlip(i)}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 transition-all duration-300 transform ${flipped.includes(i) || matched.includes(i) ? 'rotate-y-180 bg-white dark:bg-slate-900 border-primary-500 scale-105 shadow-xl shadow-primary-500/20' : 'bg-slate-200 dark:bg-slate-800 border-transparent hover:scale-95'}`}
          >
            {(flipped.includes(i) || matched.includes(i)) ? (
                <span className="text-3xl">{icon}</span>
            ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20 font-black">?</div>
            )}
          </button>
        ))}
      </div>
      <button onClick={() => { setCards([...icons, ...icons].sort(() => Math.random() - 0.5)); setFlipped([]); setMatched([]); }} className="mt-8 px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs">Shuffle Deck</button>
    </div>
  );
}

