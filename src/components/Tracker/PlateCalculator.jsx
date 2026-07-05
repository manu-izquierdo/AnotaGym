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

function formatNum(n) {
  return n.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

/** Reparto voraz con un juego concreto de discos (de mayor a menor) */
function greedy(perSide, plateSet) {
  const breakdown = [];
  let remaining = perSide;
  plateSet.forEach((plate) => {
    const count = Math.floor((remaining + 1e-9) / plate);
    if (count > 0) {
      breakdown.push({ plate, count });
      remaining = Math.round((remaining - count * plate) * 1000) / 1000;
    }
  });
  return { breakdown, remaining, totalPlates: breakdown.reduce((a, b) => a + b.count, 0) };
}

function PlateChip({ plate, count, small = false }) {
  return (
    <span
      className={`flex items-center gap-1 rounded-lg font-black text-white ${PLATE_COLORS[plate] || 'bg-zinc-600'}
        ${small ? 'px-2 py-1 text-xs' : 'px-3 py-2 text-sm rounded-xl'}`}
    >
      {plate}{count != null && <span className="text-[10px] font-bold opacity-80">×{count}</span>}
    </span>
  );
}

export default function PlateCalculator({ unit = 'kg', initialWeight = '', onClose }) {
  const { bars, plates } = CONFIG[unit] || CONFIG.kg;
  const [weight, setWeight] = useState(String(initialWeight || ''));
  const [bar, setBar] = useState(bars[0]);
  // Discos que NO hay en el gym (se descartan tocándolos)
  const [disabled, setDisabled] = useState(() => new Set());

  const togglePlate = (plate) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(plate)) next.delete(plate); else next.add(plate);
      return next;
    });
  };

  const result = useMemo(() => {
    const total = parseFloat(String(weight).replace(',', '.'));
    if (!Number.isFinite(total) || total <= 0) return null;
    if (total < bar) return { error: `El peso es menor que la barra (${bar} ${unit}).` };

    const enabled = plates.filter((p) => !disabled.has(p));
    if (enabled.length === 0) return { error: 'Has descartado todos los discos.' };

    const perSide = (total - bar) / 2;
    if (perSide === 0) return { perSide, options: [] };

    // Varias maneras de montar el mismo peso: una por cada "disco más grande"
    // posible (con 25, empezando por 20, solo con 10 y menores…)
    const options = [];
    const seen = new Set();
    enabled.forEach((maxPlate, index) => {
      const combo = greedy(perSide, enabled.slice(index));
      if (combo.breakdown.length === 0) return;
      const key = combo.breakdown.map((b) => `${b.plate}x${b.count}`).join(',');
      if (seen.has(key)) return; // p. ej. si no usa el 25, coincide con la de máx 20
      seen.add(key);
      combo.maxPlate = maxPlate;
      options.push(combo);
    });

    // Si hay combinaciones exactas, las aproximadas solo meten ruido
    const exact = options.filter((o) => o.remaining <= 0.01);
    const usable = (exact.length > 0 ? exact : options.slice(0, 1))
      .filter((o) => o.totalPlates <= 12) // 14 discos de 2.5 no es un consejo serio
      .slice(0, 5);

    return { perSide, options: usable, inexact: exact.length === 0 };
  }, [weight, bar, plates, unit, disabled]);

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
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
                      ? 'bg-brand-600 text-on-brand'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Qué discos hay en tu gym: toca uno para descartarlo */}
        <div className="space-y-1.5">
          <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
            Discos disponibles <span className="normal-case font-medium tracking-normal">— toca los que no tengas</span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {plates.map((plate) => {
              const off = disabled.has(plate);
              return (
                <button
                  key={plate}
                  onClick={() => togglePlate(plate)}
                  className={`transition-all ${off ? 'opacity-30 grayscale' : ''}`}
                  aria-pressed={off}
                  title={off ? 'Descartado — toca para recuperarlo' : 'Toca para descartarlo'}
                >
                  <PlateChip plate={plate} small />
                </button>
              );
            })}
          </div>
        </div>

        {result?.error && (
          <p className="text-xs font-semibold text-red-500 text-center py-2">{result.error}</p>
        )}

        {result && !result.error && (
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
              Por cada lado ({formatNum(result.perSide)} {unit})
              {result.options.length > 1 && ` — ${result.options.length} maneras`}
            </p>

            {result.perSide === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-2">Barra sola, sin discos.</p>
            ) : result.options.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-2">
                No sale con los discos disponibles. Recupera alguno de los descartados.
              </p>
            ) : (
              <div className="space-y-2">
                {result.options.map((option, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border
                      ${index === 0
                        ? 'border-brand-300 dark:border-brand-800 bg-brand-50/60 dark:bg-brand-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40'}`}
                  >
                    <div className="flex flex-wrap gap-1.5">
                      {option.breakdown.map(({ plate, count }) => (
                        <PlateChip key={plate} plate={plate} count={count} small />
                      ))}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold shrink-0">
                      {option.totalPlates} {option.totalPlates === 1 ? 'disco' : 'discos'}
                    </span>
                  </div>
                ))}
                {result.inexact && (
                  <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                    No sale exacto: faltan {formatNum(result.options[0].remaining)} {unit} por lado con estos discos.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {!result && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
            Escribe el peso total y te enseño varias formas de montarlo.
          </p>
        )}
      </div>
    </div>
  );
}
