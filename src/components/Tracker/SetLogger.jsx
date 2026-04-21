import React, { useMemo } from 'react';
import { Card, Button } from '../UI/Card';
import { PlayCircle } from 'lucide-react';

// Epley formula: 1RM = weight × (1 + reps/30)
// Most accurate between 2–12 reps.
function estimateRM(weight, reps) {
  const w = parseFloat(weight);
  const r = parseInt(reps, 10);
  if (!w || !r || r < 1) return null;
  if (r === 1) return { rm1: w, rm5: Math.round(w * 0.87 * 2) / 2, rm8: Math.round(w * 0.80 * 2) / 2 };
  const rm1 = w * (1 + r / 30);
  return {
    rm1: Math.round(rm1 * 2) / 2,
    rm5: Math.round(rm1 * 0.87 * 2) / 2,
    rm8: Math.round(rm1 * 0.80 * 2) / 2,
  };
}

function RmBadge({ label, value, unit, prev, isHigher }) {
  const deltaColor = prev == null
    ? 'text-zinc-500'
    : isHigher ? 'text-emerald-600 dark:text-emerald-400' : prev === value ? 'text-zinc-500' : 'text-red-500 dark:text-red-400';

  return (
    <div className="flex flex-col items-center">
      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">{label}</span>
      <span className={`text-sm font-black ${deltaColor}`}>{value}{unit}</span>
      {prev != null && prev !== value && (
        <span className={`text-[9px] font-bold ${deltaColor}`}>
          {isHigher ? `▲+${(value - prev).toFixed(1)}` : `▼${(value - prev).toFixed(1)}`}
        </span>
      )}
    </div>
  );
}

export default function SetLogger({
  activeSession,
  completedSessions,
  exerciseLibrary,
  unit,
  onSetFieldChange,
  onFinishSession,
  onCancelSession,
}) {
  const getExerciseById = (exerciseId) =>
    exerciseLibrary.find((exercise) => exercise.id === exerciseId);

  const previousSessionByExercise = useMemo(() => {
    const previousByExercise = {};
    for (let sessionIndex = completedSessions.length - 1; sessionIndex >= 0; sessionIndex -= 1) {
      const session = completedSessions[sessionIndex];
      session.exercises.forEach((exercise) => {
        if (previousByExercise[exercise.exerciseId]) return;
        const normalizedSets = exercise.sets.map((set) => ({
          weight: set.weight,
          reps: set.reps,
        }));
        const hasAnyData = normalizedSets.some((set) => set.weight !== '' || set.reps !== '');
        if (hasAnyData) {
          previousByExercise[exercise.exerciseId] = normalizedSets;
        }
      });
    }
    return previousByExercise;
  }, [completedSessions]);

  // Previous session best estimated 1RM per exercise (for delta comparison)
  const prevRmByExercise = useMemo(() => {
    const result = {};
    Object.entries(previousSessionByExercise).forEach(([exerciseId, sets]) => {
      let best = null;
      sets.forEach(set => {
        const est = estimateRM(set.weight, set.reps);
        if (est && (best === null || est.rm1 > best.rm1)) best = est;
      });
      if (best) result[exerciseId] = best;
    });
    return result;
  }, [previousSessionByExercise]);

  if (!activeSession) {
    return (
      <div className="p-4 h-full flex items-center justify-center">
        <Card className="max-w-sm text-center space-y-2">
          <h3 className="text-zinc-900 dark:text-zinc-200 font-semibold">No hay sesión activa</h3>
          <p className="text-xs text-zinc-500">
            Inicia un entrenamiento desde la pestaña de rutina para comenzar a registrar tus series.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-10">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Sesión Activa</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{activeSession.templateName}</p>
      </div>

      {activeSession.exercises.map((exercise) => (
        <Card key={exercise.id} className="space-y-4">
          <div className="mb-1">
            <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-lg">
              {getExerciseById(exercise.exerciseId)?.name || 'Ejercicio desconocido'}
            </h3>
            <p className="text-sm text-zinc-500">
              Objetivo: {exercise.targetSets} sets · {exercise.targetReps} reps
            </p>
          </div>

          <div className="space-y-3">
            {exercise.sets.map((set) => {
              const previousSet = previousSessionByExercise[exercise.exerciseId]?.[set.order - 1];
              const previousWeight = previousSet?.weight || '';
              const previousReps = previousSet?.reps || '';
              const exerciseName = getExerciseById(exercise.exerciseId)?.name || 'Ejercicio';

              // Current set RM estimation
              const currentRm = estimateRM(set.weight, set.reps);
              // Previous session best RM for comparison
              const prevBestRm = prevRmByExercise[exercise.exerciseId];

              return (
                <div key={set.id} className="flex flex-col gap-3 p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800/80 transition-all">
                  {/* Set header */}
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                      {exerciseName}
                      <span className="text-zinc-400 dark:text-zinc-500 font-normal text-xs ml-1.5">
                        #{set.order} · obj. {exercise.targetReps} reps
                      </span>
                    </span>
                  </div>

                  {/* Inputs */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Peso ({unit})</label>
                      <input
                        type="number"
                        step="0.5"
                        value={set.weight}
                        onChange={(event) =>
                          onSetFieldChange(exercise.id, set.id, 'weight', event.target.value)
                        }
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:border-brand-500 dark:focus:border-brand-500 outline-none rounded-lg px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        placeholder={previousWeight || '0'}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Reps</label>
                      <input
                        type="number"
                        value={set.reps}
                        onChange={(event) =>
                          onSetFieldChange(exercise.id, set.id, 'reps', event.target.value)
                        }
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:border-brand-500 dark:focus:border-brand-500 outline-none rounded-lg px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        placeholder={previousReps || '0'}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">RIR</label>
                      <input
                        type="text"
                        value={set.effort}
                        onChange={(event) =>
                          onSetFieldChange(exercise.id, set.id, 'effort', event.target.value)
                        }
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-800 focus:border-brand-500 dark:focus:border-brand-500 outline-none rounded-lg px-2.5 py-2 text-sm text-zinc-900 dark:text-zinc-100 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
                        placeholder="-"
                      />
                    </div>
                  </div>

                  {/* RM Estimations — only shown when weight + reps are entered */}
                  {currentRm && (
                    <div className="flex items-center justify-around bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700/60 py-2 px-3">
                      <RmBadge
                        label="1RM est."
                        value={currentRm.rm1}
                        unit={unit}
                        prev={prevBestRm?.rm1}
                        isHigher={prevBestRm && currentRm.rm1 > prevBestRm.rm1}
                      />
                      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
                      <RmBadge
                        label="5RM est."
                        value={currentRm.rm5}
                        unit={unit}
                        prev={prevBestRm?.rm5}
                        isHigher={prevBestRm && currentRm.rm5 > prevBestRm.rm5}
                      />
                      <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700" />
                      <RmBadge
                        label="8RM est."
                        value={currentRm.rm8}
                        unit={unit}
                        prev={prevBestRm?.rm8}
                        isHigher={prevBestRm && currentRm.rm8 > prevBestRm.rm8}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      ))}

      <div className="flex flex-col gap-3">
        <Button onClick={onFinishSession} className="h-12">
          <PlayCircle size={18} className="mr-2" />
          Finalizar sesión
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            if (window.confirm('¿Estás seguro de que deseas cancelar este entrenamiento? No se guardará ningún progreso.')) {
              onCancelSession?.();
            }
          }}
          className="h-12 text-red-500 hover:text-red-600 dark:hover:text-red-400 bg-red-50 dark:bg-red-950/20"
        >
          Cancelar entreno
        </Button>
      </div>
    </div>
  );
}
