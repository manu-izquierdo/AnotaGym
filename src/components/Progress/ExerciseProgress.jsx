import React, { useMemo, useState } from 'react';
import { Card, Input } from '../UI/Card';
import ProgressChart from '../UI/ProgressChart';
import { ChevronDown, Search, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getMuscleImage } from '../../data/muscleImages';

const METRICS = [
  { key: 'maxWeight', label: 'Peso máx' },
  { key: 'e1rm', label: '1RM est.' },
  { key: 'volume', label: 'Volumen' },
];

const RANGES = [
  { key: '3m', label: '3M', months: 3 },
  { key: '12m', label: '1A', months: 12 },
  { key: 'all', label: 'Todo', months: null },
];

function sessionDate(session) { return session.finishedAt || session.startedAt; }

// 1RM estimado con la fórmula de Epley: peso × (1 + reps/30)
function epley(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export default function ExerciseProgress({ completedSessions, exerciseLibrary, unit }) {
  const safeSessions = completedSessions || [];
  const safeLibrary = exerciseLibrary || [];

  const [selectedId, setSelectedId] = useState(null);
  const [metric, setMetric] = useState('maxWeight');
  const [range, setRange] = useState('all');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');

  const exerciseIndex = useMemo(
    () => safeLibrary.reduce((acc, ex) => { acc[ex.id] = ex; return acc; }, {}),
    [safeLibrary]
  );

  // Historial por ejercicio: una entrada por sesión en la que aparece,
  // con peso máximo, mejor 1RM estimado y volumen de ese día.
  const historyByExercise = useMemo(() => {
    const map = new Map();
    const sorted = [...safeSessions].sort((a, b) => new Date(sessionDate(a)) - new Date(sessionDate(b)));
    sorted.forEach((session) => {
      (session.exercises || []).forEach((ex) => {
        let maxWeight = 0;
        let bestE1rm = 0;
        let volume = 0;
        const setSummaries = [];
        (ex.sets || []).forEach((set) => {
          const w = parseFloat(set.weight) || 0;
          const r = parseInt(set.reps, 10) || 0;
          if (w <= 0 && r <= 0) return;
          maxWeight = Math.max(maxWeight, w);
          bestE1rm = Math.max(bestE1rm, epley(w, r));
          volume += w * r;
          setSummaries.push(`${r || '–'}×${w || '–'}`);
        });
        if (setSummaries.length === 0) return;
        const entry = {
          date: sessionDate(session),
          maxWeight,
          e1rm: Math.round(bestE1rm * 10) / 10,
          volume: Math.round(volume),
          detail: `Series: ${setSummaries.join('  ·  ')}`,
        };
        if (!map.has(ex.exerciseId)) map.set(ex.exerciseId, []);
        map.get(ex.exerciseId).push(entry);
      });
    });
    return map;
  }, [safeSessions]);

  // Ejercicios con datos, ordenados por número de sesiones (los más entrenados primero)
  const options = useMemo(() => {
    return [...historyByExercise.entries()]
      .map(([id, entries]) => ({
        id,
        count: entries.length,
        name: exerciseIndex[id]?.name || 'Ejercicio desconocido',
        muscleGroup: exerciseIndex[id]?.muscleGroup || '',
        imageUrl: exerciseIndex[id]?.imageUrl,
      }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [historyByExercise, exerciseIndex]);

  const current = options.find((o) => o.id === selectedId) || options[0] || null;

  const filteredOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.name.toLowerCase().includes(q) || o.muscleGroup.toLowerCase().includes(q));
  }, [options, query]);

  // Serie del ejercicio elegido, métrica y rango activos
  const { points, stats } = useMemo(() => {
    if (!current) return { points: [], stats: null };
    let entries = historyByExercise.get(current.id) || [];

    const months = RANGES.find((r) => r.key === range)?.months;
    if (months) {
      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);
      const inRange = entries.filter((e) => new Date(e.date) >= cutoff);
      // Si el rango deja la gráfica vacía, mejor enseñar todo que nada
      if (inRange.length >= 2) entries = inRange;
    }

    const values = entries.map((e) => e[metric]).filter(Number.isFinite);
    if (values.length === 0) return { points: [], stats: null };

    const best = Math.max(...values);
    const bestIdx = entries.findIndex((e) => e[metric] === best);
    const pts = entries.map((e, i) => ({
      date: e.date,
      value: e[metric],
      detail: e.detail,
      isBest: i === bestIdx && entries.length > 1,
    }));

    const first = values[0];
    const last = values[values.length - 1];
    const delta = last - first;
    const pct = first > 0 ? (delta / first) * 100 : null;

    return { points: pts, stats: { best, last, delta, pct, sessions: entries.length } };
  }, [current, historyByExercise, metric, range]);

  if (options.length === 0) {
    return (
      <Card className="text-center py-10 space-y-2">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">Aún no hay progresión que mostrar</p>
        <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
          Completa entrenamientos anotando peso y repeticiones y aquí verás cómo evolucionas en cada ejercicio.
        </p>
      </Card>
    );
  }

  const metricLabel = METRICS.find((m) => m.key === metric)?.label;
  const trendUp = stats && stats.delta > 0;
  const trendFlat = stats && stats.delta === 0;

  return (
    <div className="space-y-4">
      {/* Selector de ejercicio */}
      <Card className="p-0 overflow-hidden">
        <button
          type="button"
          onClick={() => { setPickerOpen((v) => !v); setQuery(''); }}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
        >
          {current && (
            <img
              src={current.imageUrl || getMuscleImage(current.muscleGroup)}
              alt=""
              loading="lazy"
              className="w-11 h-11 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
              onError={(e) => { e.target.onerror = null; e.target.src = getMuscleImage(current.muscleGroup); }}
            />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{current?.name}</p>
            <p className="text-xs text-zinc-500">{current?.muscleGroup} · {current?.count} {current?.count === 1 ? 'sesión' : 'sesiones'}</p>
          </div>
          <ChevronDown size={18} className={`text-zinc-400 shrink-0 transition-transform ${pickerOpen ? 'rotate-180' : ''}`} />
        </button>

        {pickerOpen && (
          <div className="border-t border-zinc-100 dark:border-zinc-800">
            <div className="p-3 pb-2">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                <Input
                  autoFocus
                  placeholder="Buscar ejercicio…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9 py-2.5 text-sm"
                />
              </div>
            </div>
            <div className="max-h-64 overflow-y-auto pb-2">
              {filteredOptions.length === 0 && (
                <p className="text-xs text-zinc-500 text-center py-4">Sin resultados para “{query}”.</p>
              )}
              {filteredOptions.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => { setSelectedId(o.id); setPickerOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors
                    ${o.id === current?.id ? 'bg-brand-50/60 dark:bg-brand-950/20' : ''}`}
                >
                  <img
                    src={o.imageUrl || getMuscleImage(o.muscleGroup)}
                    alt=""
                    loading="lazy"
                    className="w-9 h-9 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                    onError={(e) => { e.target.onerror = null; e.target.src = getMuscleImage(o.muscleGroup); }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{o.name}</p>
                    <p className="text-[11px] text-zinc-500">{o.muscleGroup}</p>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400 shrink-0">{o.count}×</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Métrica y rango */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
          {METRICS.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMetric(m.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors
                ${metric === m.key
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRange(r.key)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-colors
                ${range === r.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Resumen de la métrica */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-3">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Último</p>
            <p className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {stats.last.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
              <span className="text-[10px] font-semibold text-zinc-500 ml-1">{unit}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-3">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Récord</p>
            <p className="text-lg font-black tracking-tight text-brand-600 dark:text-brand-400">
              {stats.best.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
              <span className="text-[10px] font-semibold text-zinc-500 ml-1">{unit}</span>
            </p>
          </div>
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-3">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Evolución</p>
            <p className={`text-lg font-black tracking-tight flex items-center gap-1
              ${trendFlat ? 'text-zinc-500' : trendUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
              {trendFlat ? <Minus size={14} /> : trendUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {stats.pct !== null
                ? `${stats.pct > 0 ? '+' : ''}${stats.pct.toLocaleString('es-ES', { maximumFractionDigits: 0 })}%`
                : `${stats.delta > 0 ? '+' : ''}${stats.delta.toLocaleString('es-ES', { maximumFractionDigits: 1 })}`}
            </p>
          </div>
        </div>
      )}

      {/* Gráfica */}
      <Card className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{metricLabel}</h3>
          <span className="text-[11px] text-zinc-500">{unit}</span>
        </div>
        <ProgressChart
          points={points}
          unit={unit}
          emptyMessage="Necesitas al menos 2 sesiones con este ejercicio para ver la gráfica. ¡Sigue entrenando!"
        />
        {metric === 'e1rm' && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            1RM estimado con la fórmula de Epley a partir de tu mejor serie de cada día: peso × (1 + reps/30).
          </p>
        )}
        {metric === 'volume' && (
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
            Volumen = suma de peso × repeticiones de todas las series de ese día.
          </p>
        )}
      </Card>
    </div>
  );
}
