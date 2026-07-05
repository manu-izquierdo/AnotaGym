import React, { useState } from 'react';
import { BookmarkPlus } from 'lucide-react';

/**
 * Al terminar un entreno libre, ofrece convertirlo en una rutina reutilizable.
 */
export default function SaveRoutineDialog({ defaultName, exerciseCount, onSave, onClose }) {
  const [name, setName] = useState(defaultName || '');

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-3 animate-view-in"
      >
        <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
          <BookmarkPlus size={20} className="text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">¿Guardar como rutina?</h3>
          <p className="text-sm text-zinc-500 leading-relaxed mt-1">
            Entrenamiento guardado. Puedes convertir estos {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'} en
            una plantilla para repetirla cuando quieras.
          </p>
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre de la rutina"
          className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 transition-all"
        />
        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 h-10 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.97]"
          >
            Ahora no
          </button>
          <button
            onClick={() => name.trim() && onSave(name.trim())}
            disabled={!name.trim()}
            className="flex-1 h-10 rounded-xl text-sm font-bold text-on-brand bg-brand-600 hover:bg-brand-500 transition-all active:scale-[0.97] disabled:opacity-50"
          >
            Guardar rutina
          </button>
        </div>
      </div>
    </div>
  );
}
