import React from 'react';

/**
 * Diálogo de confirmación propio, sustituto de window.confirm().
 * window.confirm() bloquea el hilo principal mientras está abierto y Chrome
 * lo penaliza como problema de INP; este componente no bloquea nada.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-6"
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 shadow-2xl space-y-3 animate-view-in"
        role="alertdialog"
        aria-modal="true"
      >
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {message && <p className="text-sm text-zinc-500 leading-relaxed">{message}</p>}
        <div className="flex gap-2 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-xl text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all active:scale-[0.97]"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 h-10 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.97]
              ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-brand-600 hover:bg-brand-500'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
