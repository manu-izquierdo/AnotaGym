import React, { useMemo, useState } from 'react';
import { Card, Input } from '../UI/Card';
import { Trophy } from 'lucide-react';
import { getMuscleImage } from '../../data/muscleImages';

function sessionDate(session) { return session.finishedAt || session.startedAt; }

function epley(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' });
}

/**
 * Mejores marcas por ejercicio: peso máximo levantado y mejor 1RM estimado,
 * cada uno con la fecha en la que se consiguió.
 */
export default function RecordsView({ completedSessions, exerciseLibrary, unit }) {
  const [query, setQuery] = useState('');

  const exerciseIndex = useMemo(
    () => (exerciseLibrary || []).reduce((acc, ex) => { acc[ex.id] = ex; return acc; }, {}),
    [exerciseLibrary]
  );

  const records = useMemo(() => {
    const map = new Map();
    [...(completedSessions || [])]
      .sort((a, b) => new Date(sessionDate(a)) - new Date(sessionDate(b)))
      .forEach((session) => {
        const date = sessionDate(session);
        (session.exercises || []).forEach((ex) => {
          (ex.sets || []).forEach((set) => {
            const w = parseFloat(set.weight) || 0;
            const r = parseInt(set.reps, 10) || 0;
            if (w <= 0) return;
            const e1rm = Math.round(epley(w, r) * 10) / 10;
            const current = map.get(ex.exerciseId) || {
              bestWeight: 0, bestWeightDate: null, bestWeightReps: 0,
              bestE1rm: 0, bestE1rmDate: null,
              sessions: new Set(),
            };
            // ">" y no ">=": el récord se queda con la PRIMERA vez que se logró
            if (w > current.bestWeight) {
              current.bestWeight = w;
              current.bestWeightDate = date;
              current.bestWeightReps = r;
            }
            if (e1rm > current.bestE1rm) {
              current.bestE1rm = e1rm;
              current.bestE1rmDate = date;
            }
            current.sessions.add(session.id);
            map.set(ex.exerciseId, current);
          });
        });
      });

    return [...map.entries()]
      .map(([id, rec]) => ({
        id,
        ...rec,
        sessionCount: rec.sessions.size,
        name: exerciseIndex[id]?.name || 'Ejercicio desconocido',
        muscleGroup: exerciseIndex[id]?.muscleGroup || '',
        imageUrl: exerciseIndex[id]?.imageUrl,
      }))
      .sort((a, b) => b.bestE1rm - a.bestE1rm);
  }, [completedSessions, exerciseIndex]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return records;
    return records.filter((r) =>
      r.name.toLowerCase().includes(q) || r.muscleGroup.toLowerCase().includes(q));
  }, [records, query]);

  if (records.length === 0) {
    return (
      <Card className="text-center py-10 space-y-2">
        <Trophy className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700" />
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-200">Aún no hay récords</p>
        <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
          Anota peso en tus entrenamientos y aquí aparecerán tus mejores marcas de cada ejercicio.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Input
        placeholder="Buscar ejercicio…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="py-2.5 text-sm"
      />

      {filtered.length === 0 && (
        <p className="text-xs text-zinc-500 text-center py-4">Sin resultados para “{query}”.</p>
      )}

      <div className="space-y-2">
        {filtered.map((rec, i) => (
          <Card key={rec.id} className="p-3.5 flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={rec.imageUrl || getMuscleImage(rec.muscleGroup)}
                alt=""
                loading="lazy"
                className="w-12 h-12 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-800"
                onError={(e) => { e.target.onerror = null; e.target.src = getMuscleImage(rec.muscleGroup); }}
              />
              {i < 3 && !query && (
                <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black flex items-center justify-center shadow">
                  {i + 1}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{rec.name}</p>
              <p className="text-[11px] text-zinc-500">
                {rec.muscleGroup} · {rec.sessionCount} {rec.sessionCount === 1 ? 'sesión' : 'sesiones'}
              </p>
            </div>

            <div className="flex gap-4 shrink-0 text-right">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">Peso máx</p>
                <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                  {rec.bestWeight.toLocaleString('es-ES')}
                  <span className="text-[10px] font-semibold text-zinc-500 ml-0.5">{unit}</span>
                  {rec.bestWeightReps > 0 && <span className="text-[10px] font-semibold text-zinc-500"> ×{rec.bestWeightReps}</span>}
                </p>
                <p className="text-[9px] text-zinc-400">{fmtDate(rec.bestWeightDate)}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">1RM est.</p>
                <p className="text-sm font-black text-brand-600 dark:text-brand-400">
                  {rec.bestE1rm.toLocaleString('es-ES', { maximumFractionDigits: 1 })}
                  <span className="text-[10px] font-semibold text-zinc-500 ml-0.5">{unit}</span>
                </p>
                <p className="text-[9px] text-zinc-400">{fmtDate(rec.bestE1rmDate)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed px-1">
        1RM estimado con la fórmula de Epley sobre tu mejor serie. Ordenado de mayor a menor 1RM.
      </p>
    </div>
  );
}
