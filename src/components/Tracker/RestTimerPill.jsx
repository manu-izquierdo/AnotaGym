import React, { useEffect, useState } from 'react';
import { X, Plus, Minus, Timer } from 'lucide-react';

export default function RestTimerPill({ endTime, onAdd, onStop }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        // Vibrar si está soportado (iPhone/Android)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([300, 100, 300, 100, 300]);
        }
        onStop();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [endTime, onStop]);

  if (!endTime || timeLeft <= 0) return null;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full shadow-2xl shadow-brand-500/20 border border-zinc-800 dark:border-zinc-200 px-4 py-2 flex items-center gap-4 z-50 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-300">
      <div className="flex items-center gap-2 font-mono text-xl font-bold tracking-tight">
        <Timer size={18} className="text-brand-500" />
        {formatted}
      </div>
      
      <div className="flex items-center gap-2 border-l border-zinc-700 dark:border-zinc-300 pl-4">
        <button onClick={() => onAdd(-30)} className="p-1 hover:text-brand-500 transition-colors" title="-30s">
          <Minus size={16} strokeWidth={3} />
        </button>
        <button onClick={() => onAdd(30)} className="p-1 hover:text-brand-500 transition-colors" title="+30s">
          <Plus size={16} strokeWidth={3} />
        </button>
        <div className="w-px h-4 bg-zinc-700 dark:bg-zinc-300 mx-1" />
        <button onClick={onStop} className="p-1 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-500 transition-colors" title="Saltar">
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
