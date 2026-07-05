import React, { useMemo, useState, useCallback } from 'react';
import { Card, Button } from '../UI/Card';
import ConfirmDialog from '../UI/ConfirmDialog';
import { PlayCircle, Check, BookOpen, Plus, Trash2, Search, X, Dumbbell, Calculator } from 'lucide-react';
import PlateCalculator from './PlateCalculator';
import { SET_TYPE_MAP, SET_TYPES } from '../Dashboard/TemplateEditor';
import { getMuscleImage } from '../../data/muscleImages';

// ─── 1RM Estimation (Epley formula) ─────────────────────────────────────────
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

// ─── Sub-components ───────────────────────────────────────────────────────────

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

/** Small chip showing the set type with its color */
function SetTypeBadge({ typeId, size = 'sm' }) {
  const type = SET_TYPE_MAP[typeId] || SET_TYPE_MAP.normal;
  const sizeClass = size === 'xs'
    ? 'text-[8px] px-1.5 py-0.5'
    : 'text-[10px] px-2 py-0.5';
  return (
    <span className={`font-black rounded-md ${type.color} ${sizeClass}`}>
      {type.short}
    </span>
  );
}

/** Inline type picker — horizontal scroll row of chips */
function InlineTypePicker({ current, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
      {SET_TYPES.map((type) => (
        <button
          key={type.id}
          onClick={() => onChange(type.id)}
          className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-md transition-all border-2 ${type.color} ${
            current === type.id ? 'border-white/60 scale-110' : 'border-transparent opacity-60 hover:opacity-100'
          }`}
          title={type.desc}
        >
          {type.short}
        </button>
      ))}
    </div>
  );
}

/** Hoja modal para añadir un ejercicio a la sesión en marcha (Quick Log) */
function ExercisePickerSheet({ exerciseLibrary, onPick, onClose }) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const pool = (exerciseLibrary || []).filter((ex) => !ex.hidden);
    const q = query.trim().toLowerCase();
    const filtered = q
      ? pool.filter((ex) =>
          (ex.name || '').toLowerCase().includes(q) ||
          (ex.muscleGroup || '').toLowerCase().includes(q))
      : pool;
    return filtered.slice(0, 50);
  }, [exerciseLibrary, query]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[80vh]"
      >
        <div className="p-4 pb-3 flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar ejercicio…"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-500 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all"
            />
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors" aria-label="Cerrar">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-2" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
          {results.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-6">Sin resultados para “{query}”.</p>
          )}
          {results.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex.id)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-left transition-colors"
            >
              <img
                src={ex.imageUrl || getMuscleImage(ex.muscleGroup)}
                alt=""
                loading="lazy"
                className="w-10 h-10 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                onError={(e) => { e.target.onerror = null; e.target.src = getMuscleImage(ex.muscleGroup); }}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{ex.name}</p>
                <p className="text-[11px] text-zinc-500">{ex.muscleGroup}{ex.equipment ? ` · ${ex.equipment}` : ''}</p>
              </div>
            </button>
          ))}
          {!query && results.length > 0 && (
            <p className="text-[10px] text-zinc-400 text-center py-2">Escribe para buscar entre todo el catálogo.</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SetLogger({
  activeSession,
  completedSessions,
  exerciseLibrary,
  unit,
  onSetFieldChange,
  onExerciseFieldChange,
  onFinishSession,
  onCancelSession,
  onAddExercise,
  onAddSet,
  onRemoveSet,
  onRemoveExercise,
  showRmEstimates = false,
  plateCalcEnabled = false,
  effortMode = 'off', // 'rir' | 'rpe' | 'off' — apagado por defecto, como el resto de herramientas opcionales
}) {
  // Track which set has the type-picker open: { exerciseId, setId }
  const [openTypePicker, setOpenTypePicker] = useState(null);
  const [openNotes, setOpenNotes] = useState({});
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [calcWeight, setCalcWeight] = useState(null); // null = cerrada; ''|número = abierta

  const getExerciseById = useCallback(
    (exerciseId) => exerciseLibrary.find((exercise) => exercise.id === exerciseId),
    [exerciseLibrary]
  );

  // ── Previous session data ──

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

  // Últimas notas escritas para este ejercicio en sesiones anteriores — funcionan
  // como ficha del ejercicio (agarre, inclinación del banco, recordatorios…):
  // se muestran cada vez que vuelve a aparecer, con la fecha de cada una.
  const previousNotesByExercise = useMemo(() => {
    const notesByExercise = {};
    for (let sessionIndex = completedSessions.length - 1; sessionIndex >= 0; sessionIndex -= 1) {
      const session = completedSessions[sessionIndex];
      session.exercises.forEach((exercise) => {
        const text = String(exercise.notes || '').trim();
        if (!text) return;
        if (!notesByExercise[exercise.exerciseId]) notesByExercise[exercise.exerciseId] = [];
        if (notesByExercise[exercise.exerciseId].length >= 3) return;
        notesByExercise[exercise.exerciseId].push({
          date: session.finishedAt || session.startedAt,
          text,
        });
      });
    }
    return notesByExercise;
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

  // ── Completion progress ──
  const completedCount = useMemo(() => {
    if (!activeSession) return { done: 0, total: 0 };
    let done = 0, total = 0;
    activeSession.exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        total++;
        if (set.completed) done++;
      });
    });
    return { done, total };
  }, [activeSession]);

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

  const progressPct = completedCount.total > 0
    ? Math.round((completedCount.done / completedCount.total) * 100)
    : 0;

  return (
    <div className="p-4 space-y-6 pb-10">
      {/* Session header */}
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Sesión Activa
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{activeSession.templateName}</p>

        {/* Progress bar */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-[11px] text-zinc-500">
            <span>{completedCount.done} / {completedCount.total} series completadas</span>
            <span className="font-bold">{progressPct}%</span>
          </div>
          <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Exercise cards */}
      {activeSession.exercises.map((exercise) => (
        <Card key={exercise.id} className="space-y-4">
          <div className="mb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={getExerciseById(exercise.exerciseId)?.imageUrl || getMuscleImage(getExerciseById(exercise.exerciseId)?.muscleGroup)}
                  alt={getExerciseById(exercise.exerciseId)?.muscleGroup}
                  loading="lazy"
                  className="w-12 h-12 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-900 shadow-sm border border-zinc-200 dark:border-zinc-800"
                />
                <div>
                  <h3 className="text-zinc-900 dark:text-zinc-100 font-bold text-lg leading-tight">
                    {getExerciseById(exercise.exerciseId)?.name || 'Ejercicio desconocido'}
                  </h3>
                  <p className="text-sm text-zinc-500 mt-0.5">
                    {exercise.targetReps
                      ? `Objetivo: ${exercise.targetSets} sets · ${exercise.targetReps} reps`
                      : `${exercise.sets.length} ${exercise.sets.length === 1 ? 'serie' : 'series'}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {plateCalcEnabled && (
                  <button
                    onClick={() => {
                      const maxW = Math.max(0, ...exercise.sets.map((s) => parseFloat(s.weight) || 0));
                      setCalcWeight(maxW > 0 ? maxW : '');
                    }}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-brand-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    title="Calculadora de discos"
                  >
                    <Calculator size={16} />
                  </button>
                )}
                <button
                  onClick={() => setOpenNotes(p => ({ ...p, [exercise.id]: !p[exercise.id] }))}
                  className={`p-1.5 rounded-lg transition-colors ${openNotes[exercise.id] || exercise.notes ? 'bg-brand-50 text-brand-500 dark:bg-brand-500/20' : 'text-zinc-400 hover:text-brand-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                  title="Añadir notas"
                >
                  <BookOpen size={16} />
                </button>
                <button
                  onClick={() => setConfirmRemoveId(exercise.id)}
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  title="Quitar ejercicio de la sesión"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {(previousNotesByExercise[exercise.exerciseId] || []).length > 0 && (
            <div className="space-y-1.5">
              {previousNotesByExercise[exercise.exerciseId].map((note, noteIndex) => (
                <div key={noteIndex} className="flex items-start gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-xl px-3 py-2">
                  <BookOpen size={12} className="text-zinc-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      Nota del {new Date(note.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })}:
                    </span>{' '}
                    {note.text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {(openNotes[exercise.id] || exercise.notes) && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <textarea
                className="w-full bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm resize-none focus:border-brand-500 outline-none text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 transition-all"
                placeholder="Agarre, inclinación del banco, sensaciones… la verás la próxima vez que hagas este ejercicio"
                value={exercise.notes || ''}
                onChange={e => onExerciseFieldChange(exercise.id, 'notes', e.target.value)}
                rows={2}
              />
            </div>
          )}

          <div className="space-y-3">
            {exercise.sets.map((set, setArrayIdx) => {
              const previousSet = previousSessionByExercise[exercise.exerciseId]?.[set.order - 1];
              const previousWeight = previousSet?.weight || '';
              const previousReps = previousSet?.reps || '';
              const exerciseName = getExerciseById(exercise.exerciseId)?.name || 'Ejercicio';

              // Current set RM estimation
              const currentRm = estimateRM(set.weight, set.reps);
              // Previous session best RM for comparison
              const prevBestRm = prevRmByExercise[exercise.exerciseId];

              // Set type
              const setTypeId = set.setType || 'normal';
              const pickerKey = `${exercise.id}:${set.id}`;
              const isPickerOpen = openTypePicker === pickerKey;

              return (
                <div
                  key={set.id}
                  className={`flex flex-col gap-3 p-3.5 rounded-xl border transition-all ${
                    set.completed
                      ? 'bg-emerald-50 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-800/60'
                      : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800/80'
                  }`}
                >
                  {/* Set header: number + type badge + complete toggle */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
                        {exerciseName}
                        <span className="text-zinc-400 dark:text-zinc-500 font-normal text-xs ml-1.5">
                          #{set.order}{exercise.targetReps ? ` · obj. ${exercise.targetReps} reps` : ''}
                        </span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Quitar esta serie (las restantes se renumeran) */}
                      {exercise.sets.length > 1 && (
                        <button
                          onClick={() => onRemoveSet?.(exercise.id, set.id)}
                          className="p-1 rounded-md text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Quitar serie"
                          aria-label="Quitar serie"
                        >
                          <X size={14} />
                        </button>
                      )}

                      {/* Set type badge — tap to open inline picker */}
                      <button
                        onClick={() => setOpenTypePicker(isPickerOpen ? null : pickerKey)}
                        className="flex items-center"
                        title="Cambiar tipo de serie"
                      >
                        <SetTypeBadge typeId={setTypeId} />
                      </button>

                      {/* Complete toggle */}
                      <button
                        onClick={() => onSetFieldChange(exercise.id, set.id, 'completed', !set.completed)}
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                          set.completed
                            ? 'bg-emerald-500 border-emerald-500 text-on-accent'
                            : 'border-zinc-300 dark:border-zinc-700 text-transparent hover:border-brand-400'
                        }`}
                        aria-label="Marcar serie como completada"
                      >
                        <Check size={13} strokeWidth={3} />
                      </button>
                    </div>
                  </div>

                  {/* Inline type picker */}
                  {isPickerOpen && (
                    <InlineTypePicker
                      current={setTypeId}
                      onChange={(newType) => {
                        onSetFieldChange(exercise.id, set.id, 'setType', newType);
                        setOpenTypePicker(null);
                      }}
                    />
                  )}

                  {/* Inputs */}
                  <div className={`grid gap-2 ${effortMode === 'off' ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Peso ({unit})
                      </label>
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
                      <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                        Reps
                      </label>
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
                    {effortMode !== 'off' && (
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">
                          {effortMode === 'rpe' ? 'RPE' : 'RIR'}
                        </label>
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
                    )}
                  </div>

                  {/* RM Estimations — opcional (Ajustes → Entrenamiento) */}
                  {showRmEstimates && currentRm && (
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

          {/* Serie extra sobre la marcha */}
          <button
            onClick={() => onAddSet?.(exercise.id)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 text-xs font-bold text-zinc-500 hover:text-brand-600 dark:hover:text-brand-400 hover:border-brand-400 transition-colors"
          >
            <Plus size={14} /> Añadir serie
          </button>
        </Card>
      ))}

      {/* Sesión libre recién creada: invitar a añadir el primer ejercicio */}
      {activeSession.exercises.length === 0 && (
        <Card className="text-center py-10 border-dashed border-2 bg-transparent shadow-none">
          <Dumbbell className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">Sesión libre en marcha</p>
          <p className="text-xs text-zinc-500 mt-1">Añade tu primer ejercicio para empezar a anotar series.</p>
        </Card>
      )}

      {/* Añadir ejercicio a la sesión (Quick Log o extra sobre plantilla) */}
      <Button
        variant="secondary"
        onClick={() => setShowExercisePicker(true)}
        className="h-12 font-bold"
      >
        <Plus size={16} className="mr-1.5 text-brand-500" /> Añadir ejercicio
      </Button>

      <div className="flex flex-col gap-3">
        <Button onClick={onFinishSession} className="h-12">
          <PlayCircle size={18} className="mr-2" />
          Finalizar sesión
        </Button>
        <Button
          variant="ghost"
          onClick={() => setConfirmCancel(true)}
          className="h-12 text-red-500 hover:text-red-600 dark:hover:text-red-400 bg-red-50 dark:bg-red-950/20"
        >
          Cancelar entreno
        </Button>
      </div>

      {confirmRemoveId && (
        <ConfirmDialog
          title="¿Quitar este ejercicio?"
          message="Se perderán las series anotadas de este ejercicio en la sesión actual."
          confirmLabel="Quitar"
          danger
          onConfirm={() => { onRemoveExercise?.(confirmRemoveId); setConfirmRemoveId(null); }}
          onCancel={() => setConfirmRemoveId(null)}
        />
      )}

      {confirmCancel && (
        <ConfirmDialog
          title="¿Cancelar el entrenamiento?"
          message="No se guardará ningún progreso de esta sesión."
          confirmLabel="Cancelar entreno"
          cancelLabel="Seguir entrenando"
          danger
          onConfirm={() => { setConfirmCancel(false); onCancelSession?.(); }}
          onCancel={() => setConfirmCancel(false)}
        />
      )}

      {calcWeight !== null && (
        <PlateCalculator
          unit={unit}
          initialWeight={calcWeight}
          onClose={() => setCalcWeight(null)}
        />
      )}

      {showExercisePicker && (
        <ExercisePickerSheet
          exerciseLibrary={exerciseLibrary}
          onPick={(exerciseId) => {
            onAddExercise?.(exerciseId);
            setShowExercisePicker(false);
          }}
          onClose={() => setShowExercisePicker(false)}
        />
      )}
    </div>
  );
}
