import React, { useMemo, useState } from 'react';
import { X, Calculator } from 'lucide-react';

// Discos y barras estándar según la unidad
const CONFIG = {
  kg: { bars: [20, 15, 10], plates: [25, 20, 15, 10, 5, 2.5, 1.25] },
  lb: { bars: [45, 35, 15], plates: [45, 35, 25, 10, 5, 2.5] },
};

// Colores aproximados de discos olímpicos (kg)
const PLATE_COLORS = {
  25: 'bg-red-600', 20: 'bg-blue-600', 15: 'bg-yellow-500', 10: 'bg-green-600',
  5: 'bg-zinc-100 text-zinc-900', 2.5: 'bg-zinc-700', 1.25: 'bg-zinc-500',
  45: 'bg-blue-600', 35: 'bg-yellow-500',
};

export default function PlateCalculator({ unit = 'kg', initialWeight = '', onClose }) {
  const { bars, plates } = CONFIG[unit] || CONFIG.kg;
  const [weight, setWeight] = useState(String(initialWeight || ''));
  const [bar, setBar] = useState(bars[0]);

  const result = useMemo(() => {
    const total = parseFloat(String(weight).replace(',', '.'));
    if (!Number.isFinite(total) || total <= 0) return null;
    if (total < bar) return { error: `El peso es menor que la barra (${bar} ${unit}).` };

    let perSide = (total - bar) / 2;
    const breakdown = [];
    let remaining = perSide;
    plates.forEach((plate) => {
      const count = Math.floor((remaining + 1e-9) / plate);
      if (count > 0) {
        breakdown.push({ plate, count });
        remaining = Math.round((remaining - count * plate) * 1000) / 1000;
      }
    });
    return { perSide, breakdown, remaining };
  }, [weight, bar, plates, unit]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Calculator size={16} className="text-brand-500" /> Calculadora de discos
          </h3>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Peso total ({unit})</label>
            <input
              type="number"
              step="0.5"
              autoFocus
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="0"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2.5 text-lg font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-brand-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Barra</label>
            <div className="flex gap-1">
              {bars.map((b) => (
                <button
                  key={b}
                  onClick={() => setBar(b)}
                  className={`px-2.5 py-2.5 rounded-xl text-sm font-bold transition-colors
                    ${bar === b
                      ? 'bg-brand-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {result?.error && (
          <p className="text-xs font-semibold text-red-500 text-center py-2">{result.error}</p>
        )}

        {result && !result.error && (
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
              Por cada lado ({result.perSide.toLocaleString('es-ES', { maximumFractionDigits: 2 })} {unit})
            </p>
            {result.breakdown.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-2">Barra sola, sin discos.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {result.breakdown.map(({ plate, count }) => (
                  <span
                    key={plate}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-black text-white ${PLATE_COLORS[plate] || 'bg-zinc-600'}`}
                  >
                    {plate} <span className="text-xs font-bold opacity-80">×{count}</span>
                  </span>
                ))}
              </div>
            )}
            {result.remaining > 0.01 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                No sale exacto: faltan {result.remaining.toLocaleString('es-ES', { maximumFractionDigits: 2 })} {unit} por lado con discos estándar.
              </p>
            )}
          </div>
        )}

        {!result && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
            Escribe el peso total y te digo qué discos poner por lado.
          </p>
        )}
      </div>
    </div>
  );
}
