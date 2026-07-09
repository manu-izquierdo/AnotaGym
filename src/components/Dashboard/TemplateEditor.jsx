import React, { useEffect, useMemo, useRef, useState } from 'react';
import { GripVertical, Info } from 'lucide-react';
import { generateUUID } from '../../utils/uuid';
import { getMuscleImage } from '../../data/muscleImages';
import { matchesSearch, orderByList, GROUP_ORDER, EQUIPMENT_ORDER } from '../../data/exerciseUtils';
import ExerciseImage from '../UI/ExerciseImage';
import ExerciseDetailSheet from '../Exercises/ExerciseDetailSheet';

const MAX_EXERCISES_PER_TEMPLATE = 15;
const MIN_SETS_PER_EXERCISE = 1;
const MAX_SETS_PER_EXERCISE = 10;

// ─── Set Types Definition ────────────────────────────────────────────────────

// Orden pensado para la cronología real de un entreno: primero se calienta,
// luego vienen las series efectivas
export const SET_TYPES = [
  { id: 'warmup',    label: 'Calentamiento',  short: 'CAL', color: 'bg-zinc-600 text-zinc-300',               desc: 'No computa en el volumen total'         },
  { id: 'normal',    label: 'Normal',        short: 'NRM', color: 'bg-zinc-700 text-zinc-200',               desc: 'Serie estándar'                         },
  { id: 'topset',    label: 'Top Set',        short: 'TOP', color: 'bg-amber-600 text-amber-50',              desc: 'Serie al máximo esfuerzo de la sesión'  },
  { id: 'backoff',   label: 'Back-off',       short: 'BOF', color: 'bg-sky-700 text-sky-50',                  desc: 'Serie ligera post top set'              },
  { id: 'dropset',   label: 'Drop Set',       short: 'DRP', color: 'bg-orange-600 text-orange-50',            desc: 'Reducir peso sin descanso'              },
  { id: 'restpause', label: 'Rest-Pause',     short: 'R+P', color: 'bg-violet-700 text-violet-50',            desc: 'Pausa breve dentro de la serie'         },
  { id: 'myo',       label: 'Myo-Rep',        short: 'MYO', color: 'bg-pink-700 text-pink-50',                desc: 'Alta acumulación de reps con mini-sets' },
  { id: 'failure',   label: 'Al Fallo',       short: 'ATF', color: 'bg-red-700 text-red-50',                  desc: 'Hasta el fallo muscular completo'       },
];

export const SET_TYPE_MAP = Object.fromEntries(SET_TYPES.map((t) => [t.id, t]));
const DEFAULT_SET_TYPE = 'normal';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const createDraftFromTemplate = (template) => {
  if (!template) {
    return {
      id: generateUUID(),
      name: 'Nueva Rutina',
      focus: 'Upper',
      exercises: [],
    };
  }

  return {
    id: template.id,
    name: template.name,
    focus: template.focus || 'Upper',
    exercises: template.exercises.map((exercise) => ({
      id: exercise.id,
      exerciseId: exercise.exerciseId,
      targetSets: exercise.targetSets,
      targetReps: exercise.targetReps,
      // setTypes: array with one type per planned set. Older data may not have it.
      setTypes: exercise.setTypes
        ? [...exercise.setTypes]
        : Array(exercise.targetSets).fill(DEFAULT_SET_TYPE),
    })),
  };
};

/** Ensures setTypes array length always matches targetSets */
const syncSetTypes = (setTypes = [], targetSets) => {
  const current = [...setTypes];
  const last = current[current.length - 1] || DEFAULT_SET_TYPE;
  while (current.length < targetSets) current.push(last);
  return current.slice(0, targetSets);
};

// ─── SetTypePicker (small modal/popover) ─────────────────────────────────────

function SetTypePicker({ current, onChange, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-2xl p-4 space-y-2 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Tipo de serie</p>
        {SET_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => { onChange(type.id); onClose(); }}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
              current === type.id
                ? 'border-brand-500 bg-brand-500/10'
                : 'border-zinc-800 hover:border-zinc-600'
            }`}
          >
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${type.color}`}>
              {type.short}
            </span>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-zinc-100">{type.label}</p>
              <p className="text-[11px] text-zinc-500">{type.desc}</p>
            </div>
            {current === type.id && <span className="text-brand-400 text-sm">✓</span>}
          </button>
        ))}
        <button
          onClick={onClose}
          className="w-full mt-2 p-2.5 text-zinc-400 bg-zinc-800 rounded-xl text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TemplateEditor({
  template,
  exerciseLibrary,
  onSave,
  onCancel,
  onCreateExercise,
}) {
  const [draft, setDraft] = useState(() => createDraftFromTemplate(template));
  const [showSelector, setShowSelector] = useState(false);
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExGroup, setNewExGroup] = useState('Pectoral');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [selectedEquipmentFilter, setSelectedEquipmentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [detailExercise, setDetailExercise] = useState(null); // ficha de ejercicio abierta

  // { exerciseIndex, setIndex } — which set index is being edited in the picker
  const [pickerTarget, setPickerTarget] = useState(null);

  const groupedExercises = useMemo(() => {
    const filtered = exerciseLibrary.filter((exercise) => {
      if (exercise.hidden) return false; // ocultados por admin o por el usuario
      const groupOk = selectedGroupFilter === 'all' || exercise.muscleGroup === selectedGroupFilter;
      const equipOk = selectedEquipmentFilter === 'all' || exercise.equipment === selectedEquipmentFilter;
      const searchOk = matchesSearch(exercise, searchTerm);
      return groupOk && equipOk && searchOk;
    });

    const byGroup = filtered.reduce((acc, currentExercise) => {
      const group = currentExercise.muscleGroup || 'Otro';
      if (!acc[group]) acc[group] = [];
      acc[group].push(currentExercise);
      return acc;
    }, {});
    // Grupos en orden fijo: hipertrofia primero, funcional/cardio/movilidad después
    return Object.fromEntries(
      orderByList(Object.keys(byGroup), GROUP_ORDER).map((g) => [g, byGroup[g]])
    );
  }, [exerciseLibrary, searchTerm, selectedGroupFilter, selectedEquipmentFilter]);

  const exerciseIndex = useMemo(() => {
    return exerciseLibrary.reduce((acc, currentExercise) => {
      acc[currentExercise.id] = currentExercise;
      return acc;
    }, {});
  }, [exerciseLibrary]);

  const availableGroups = useMemo(
    () => ['all', ...orderByList([...new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup))], GROUP_ORDER)],
    [exerciseLibrary]
  );
  const availableEquipment = useMemo(
    () => ['all', ...orderByList([...new Set(exerciseLibrary.map((exercise) => exercise.equipment || 'Otro'))], EQUIPMENT_ORDER)],
    [exerciseLibrary]
  );

  const routineFocus = useMemo(() => {
    if (draft.exercises.length === 0) return 'Sin foco definido';

    const focusMap = {};
    draft.exercises.forEach((exercise) => {
      const group = exerciseIndex[exercise.exerciseId]?.muscleGroup;
      if (group) focusMap[group] = (focusMap[group] || 0) + 1;
    });

    const sortedFocus = Object.entries(focusMap).sort((a, b) => b[1] - a[1]);
    if (sortedFocus.length === 0) return 'Mixto';
    if (sortedFocus.length === 1) return `Énfasis: ${sortedFocus[0][0]}`;
    return `Énfasis: ${sortedFocus[0][0]} y ${sortedFocus[1][0]}`;
  }, [draft.exercises, exerciseIndex]);

  // ── Handlers ──

  const handleNameChange = (event) => {
    setDraft((prev) => ({ ...prev, name: event.target.value }));
  };

  const handleAddExercise = (exerciseId) => {
    if (draft.exercises.length >= MAX_EXERCISES_PER_TEMPLATE) {
      alert(`El límite máximo es de ${MAX_EXERCISES_PER_TEMPLATE} ejercicios por rutina.`);
      return;
    }
    if (draft.exercises.some((exercise) => exercise.exerciseId === exerciseId)) {
      alert('El ejercicio ya está en la plantilla.');
      return;
    }

    setDraft((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          id: `${exerciseId}-${Date.now()}`,
          exerciseId,
          targetSets: 3,
          targetReps: '8-12',
          setTypes: Array(3).fill(DEFAULT_SET_TYPE),
        },
      ],
    }));
    setShowSelector(false);
  };

  const submitNewExercise = async () => {
    const normalizedName = newExName.trim();

    if (!normalizedName) {
      alert('El nombre del ejercicio no puede estar vacío.');
      return;
    }

    const isDuplicate = exerciseLibrary.some(
      (exercise) => exercise.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (isDuplicate) {
      alert('Ya existe un ejercicio con este nombre en el catálogo.');
      return;
    }

    // onCreateExercise escribe en Firestore y devuelve el id — hay que esperarlo,
    // si no, la rutina guarda una Promise como exerciseId y sale "Desconocido"
    const newId = await onCreateExercise({
      name: normalizedName,
      muscleGroup: newExGroup,
      equipment: 'Custom',
    });
    handleAddExercise(newId);

    setNewExName('');
    setIsCreatingExercise(false);
  };

  const handleRemoveExercise = (indexToRemove) => {
    setDraft((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleExerciseFieldChange = (index, field, value) => {
    setDraft((prev) => {
      const newExercises = [...prev.exercises];
      const updated = { ...newExercises[index], [field]: value };

      // When targetSets changes, sync the setTypes array length
      if (field === 'targetSets') {
        const numSets = parseInt(value) || 1;
        updated.setTypes = syncSetTypes(updated.setTypes, numSets);
      }

      newExercises[index] = updated;
      return { ...prev, exercises: newExercises };
    });
  };

  const handleSetTypeChange = (exerciseIdx, setIdx, newType) => {
    setDraft((prev) => {
      const newExercises = [...prev.exercises];
      const exercise = { ...newExercises[exerciseIdx] };
      const newSetTypes = [...exercise.setTypes];
      newSetTypes[setIdx] = newType;
      exercise.setTypes = newSetTypes;
      newExercises[exerciseIdx] = exercise;
      return { ...prev, exercises: newExercises };
    });
  };

  const handleApplyTypeToAll = (exerciseIdx, type) => {
    setDraft((prev) => {
      const newExercises = [...prev.exercises];
      const exercise = { ...newExercises[exerciseIdx] };
      exercise.setTypes = exercise.setTypes.map(() => type);
      newExercises[exerciseIdx] = exercise;
      return { ...prev, exercises: newExercises };
    });
  };

  const handleMove = (index, direction) => {
    setDraft((prev) => {
      const newExercises = [...prev.exercises];
      if (direction === 'UP' && index > 0) {
        [newExercises[index - 1], newExercises[index]] = [newExercises[index], newExercises[index - 1]];
      } else if (direction === 'DOWN' && index < newExercises.length - 1) {
        [newExercises[index + 1], newExercises[index]] = [newExercises[index], newExercises[index + 1]];
      }
      return { ...prev, exercises: newExercises };
    });
  };

  // ── Reordenar arrastrando (táctil y ratón; las flechas siguen disponibles) ──
  // Se arrastra desde el asa (GripVertical): touch-none en el asa evita que
  // el gesto haga scroll. Los listeners van en window para no depender de
  // pointer capture, que se pierde al remontar nodos en cada reordenación.
  const [dragIdx, setDragIdx] = useState(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    if (dragIdx === null) return;

    const handlePointerMove = (e) => {
      const y = e.clientY;
      const items = itemRefs.current.slice(0, draft.exercises.length);
      let to = dragIdx;
      for (let i = 0; i < items.length; i++) {
        const el = items[i];
        if (!el || i === dragIdx) continue;
        const mid = el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2;
        if (i < dragIdx && y < mid) to = Math.min(to, i);
        if (i > dragIdx && y > mid) to = Math.max(to, i);
      }
      if (to !== dragIdx) {
        setDraft((prev) => {
          const list = [...prev.exercises];
          const [item] = list.splice(dragIdx, 1);
          list.splice(to, 0, item);
          return { ...prev, exercises: list };
        });
        setDragIdx(to);
      }
    };

    const stopDrag = () => setDragIdx(null);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDrag);
    window.addEventListener('pointercancel', stopDrag);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDrag);
      window.removeEventListener('pointercancel', stopDrag);
    };
  }, [dragIdx, draft.exercises.length]);

  const validateAndSave = () => {
    if (!draft.name.trim()) {
      alert('El nombre de la rutina es obligatorio.');
      return;
    }
    if (draft.exercises.length === 0) {
      alert('Debes añadir al menos un ejercicio.');
      return;
    }
    if (draft.exercises.length > MAX_EXERCISES_PER_TEMPLATE) {
      alert(`El límite máximo es de ${MAX_EXERCISES_PER_TEMPLATE} ejercicios por rutina.`);
      return;
    }

    const exerciseIds = draft.exercises.map((exercise) => exercise.exerciseId);
    const uniqueIds = new Set(exerciseIds);
    if (uniqueIds.size !== exerciseIds.length) {
      alert('No se permiten ejercicios duplicados en la misma rutina.');
      return;
    }

    const hasInvalidSets = draft.exercises.some(
      (exercise) =>
        exercise.targetSets < MIN_SETS_PER_EXERCISE || exercise.targetSets > MAX_SETS_PER_EXERCISE
    );
    if (hasInvalidSets) {
      alert(`El número de series debe estar entre ${MIN_SETS_PER_EXERCISE} y ${MAX_SETS_PER_EXERCISE}.`);
      return;
    }

    onSave({
      ...draft,
      name: draft.name.trim(),
      focus: routineFocus,
    });
  };

  // ── Render ──

  return (
    <div
      className="fixed inset-0 bg-zinc-950 text-white z-50 p-4 overflow-y-auto overflow-x-hidden"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
    >
      {/* Ancho limitado para que el editor no se estire en escritorio */}
      <div className="mx-auto w-full max-w-2xl">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="text-zinc-400 p-2">
          Cancelar
        </button>
        <h2 className="font-bold">{template ? 'Editar Rutina' : 'Nueva Rutina'}</h2>
        <button
          onClick={validateAndSave}
          className="text-brand-400 font-bold p-2 disabled:opacity-40"
          disabled={!draft.name.trim() || draft.exercises.length === 0}
        >
          Guardar
        </button>
      </header>

      <input
        type="text"
        value={draft.name}
        onChange={handleNameChange}
        className="w-full bg-zinc-900 p-4 rounded-lg mb-2 text-xl outline-none border border-zinc-800 focus:border-brand-500 transition-all"
        placeholder="Nombre de la rutina"
      />
      <p className="text-sm text-zinc-500 mb-6">{routineFocus}</p>

      <div className="space-y-4 mb-6">
        {draft.exercises.map((exercise, exIdx) => {
          const dictExercise = exerciseIndex[exercise.exerciseId];
          const setTypes = exercise.setTypes || Array(exercise.targetSets).fill(DEFAULT_SET_TYPE);

          return (
            <div
              key={exercise.id || exIdx}
              ref={(el) => { itemRefs.current[exIdx] = el; }}
              className={`flex flex-col gap-3 bg-zinc-900 p-4 rounded-2xl border transition-shadow ${
                dragIdx === exIdx
                  ? 'border-brand-500 ring-1 ring-brand-500 shadow-2xl relative z-10'
                  : 'border-zinc-800'
              }`}
            >
              {/* Exercise header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <button
                    onPointerDown={(e) => { e.preventDefault(); setDragIdx(exIdx); }}
                    className="p-1.5 -ml-1.5 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing touch-none shrink-0 transition-colors"
                    aria-label="Arrastrar para reordenar"
                    title="Arrastrar para reordenar"
                  >
                    <GripVertical size={16} />
                  </button>
                  <div className="min-w-0">
                    <p className="font-bold text-zinc-100 truncate">
                      {dictExercise ? dictExercise.name : 'Desconocido'}
                    </p>
                    {dictExercise?.muscleGroup && (
                      <p className="text-[10px] text-zinc-500 mt-0.5">{dictExercise.muscleGroup}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={() => handleMove(exIdx, 'UP')}
                    disabled={exIdx === 0}
                    className="p-1.5 disabled:opacity-20 text-zinc-400 hover:text-white transition-colors"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMove(exIdx, 'DOWN')}
                    disabled={exIdx === draft.exercises.length - 1}
                    className="p-1.5 disabled:opacity-20 text-zinc-400 hover:text-white transition-colors"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => handleRemoveExercise(exIdx)}
                    className="p-1.5 text-red-500 hover:text-red-400 transition-colors ml-1"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Sets & Reps inputs */}
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">Series</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={exercise.targetSets}
                    onChange={(e) =>
                      handleExerciseFieldChange(exIdx, 'targetSets', parseInt(e.target.value) || '')
                    }
                    className="bg-zinc-950 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg px-3 py-2 text-sm text-zinc-100 transition-all"
                  />
                </div>
                <div className="flex-[2] flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">Rango de repeticiones</label>
                  <input
                    type="text"
                    value={exercise.targetReps}
                    onChange={(e) => handleExerciseFieldChange(exIdx, 'targetReps', e.target.value)}
                    placeholder="ej. 8-12"
                    className="bg-zinc-950 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg px-3 py-2 text-sm text-zinc-100 transition-all"
                  />
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {['4-6', '6-10', '8-12', '12-15', '15-20'].map((range) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => handleExerciseFieldChange(exIdx, 'targetReps', range)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${
                          exercise.targetReps === range
                            ? 'bg-brand-600 text-on-brand'
                            : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Set Type row — one chip per planned set */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-500">Tipo por serie</label>
                  {/* Quick: apply same type to all */}
                  <div className="flex gap-1">
                    {['normal', 'topset', 'dropset'].map((tid) => {
                      const t = SET_TYPE_MAP[tid];
                      return (
                        <button
                          key={tid}
                          onClick={() => handleApplyTypeToAll(exIdx, tid)}
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${t.color} opacity-70 hover:opacity-100 transition-opacity`}
                          title={`Aplicar "${t.label}" a todas`}
                        >
                          {t.short}×{exercise.targetSets}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from({ length: exercise.targetSets }).map((_, setIdx) => {
                    const typeId = setTypes[setIdx] || DEFAULT_SET_TYPE;
                    const typeInfo = SET_TYPE_MAP[typeId] || SET_TYPE_MAP.normal;
                    return (
                      <button
                        key={setIdx}
                        onClick={() => setPickerTarget({ exerciseIdx: exIdx, setIdx })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold border-2 transition-all ${typeInfo.color} border-transparent hover:scale-105 active:scale-95`}
                        title={`Serie ${setIdx + 1}: ${typeInfo.label} — toca para cambiar`}
                      >
                        <span className="text-[9px] opacity-60">#{setIdx + 1}</span>
                        {typeInfo.short}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showSelector ? (
        <button
          onClick={() => setShowSelector(true)}
          className="w-full bg-zinc-900 text-brand-400 border border-zinc-800 p-4 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
        >
          + Añadir Ejercicio
        </button>
      ) : (
        <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800">
          {!isCreatingExercise ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm text-zinc-400">Seleccionar Ejercicio</h3>
                <button
                  onClick={() => setIsCreatingExercise(true)}
                  className="text-brand-400 text-sm font-bold"
                >
                  + Nuevo Personalizado
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar ejercicio..."
                className="w-full bg-zinc-800 p-3 rounded-lg mb-3 text-white outline-none border border-zinc-700 focus:border-brand-500 transition-all"
              />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select
                  value={selectedGroupFilter}
                  onChange={(event) => setSelectedGroupFilter(event.target.value)}
                  className="w-full min-w-0 bg-zinc-800 p-2 rounded-lg text-sm border border-zinc-700"
                >
                  {availableGroups.map((group) => (
                    <option key={group} value={group}>
                      {group === 'all' ? 'Todos los grupos' : group}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedEquipmentFilter}
                  onChange={(event) => setSelectedEquipmentFilter(event.target.value)}
                  className="w-full min-w-0 bg-zinc-800 p-2 rounded-lg text-sm border border-zinc-700"
                >
                  {availableEquipment.map((equipment) => (
                    <option key={equipment} value={equipment}>
                      {equipment === 'all' ? 'Todo el material' : equipment}
                    </option>
                  ))}
                </select>
              </div>

              {Object.entries(groupedExercises).map(([group, exercises]) => (
                <div key={group} className="mb-4">
                  <p className="font-bold text-zinc-500 text-xs uppercase tracking-wider mb-2">{group}</p>
                  {/* flex-col y no grid: los nombres largos (nowrap) ensanchaban la
                      pista del grid más allá del contenedor y las tarjetas se cortaban */}
                  <div className="flex flex-col gap-1.5">
                    {exercises.map((exercise) => (
                      <div
                        key={exercise.id}
                        className="w-full min-w-0 bg-zinc-800 rounded-xl border border-zinc-700 hover:border-brand-600 transition-all flex items-center"
                      >
                        <button
                          onClick={() => handleAddExercise(exercise.id)}
                          className="flex-1 min-w-0 text-left p-2.5 flex items-center gap-3"
                        >
                          <ExerciseImage
                            exercise={exercise}
                            className="w-12 h-12 rounded-lg object-cover bg-zinc-900 border border-zinc-700/50 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="block text-sm text-zinc-100 font-semibold truncate">{exercise.name}</span>
                            <span className="text-[10px] text-zinc-400">{exercise.equipment || 'Otro'}</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setDetailExercise(exercise)}
                          className="p-2.5 text-zinc-500 hover:text-brand-400 transition-colors shrink-0"
                          aria-label={`Ver ficha de ${exercise.name}`}
                        >
                          <Info size={17} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedExercises).length === 0 && (
                <p className="text-xs text-zinc-500">No hay ejercicios para ese filtro.</p>
              )}
              <button
                onClick={() => setShowSelector(false)}
                className="w-full mt-4 p-2.5 text-zinc-400 border border-zinc-800 rounded-xl"
              >
                Cancelar Selección
              </button>
            </>
          ) : (
            <>
              <h3 className="mb-4 text-sm font-bold text-white">Crear Ejercicio Personalizado</h3>
              <input
                type="text"
                placeholder="Ej: Elevaciones Y"
                value={newExName}
                onChange={(event) => setNewExName(event.target.value)}
                className="w-full bg-zinc-800 p-3 rounded-lg mb-4 text-white outline-none border border-zinc-700 focus:border-brand-500 transition-all"
              />
              <select
                value={newExGroup}
                onChange={(event) => setNewExGroup(event.target.value)}
                className="w-full bg-zinc-800 p-3 rounded-lg mb-6 text-white outline-none border border-zinc-700"
              >
                {orderByList([...new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup))], GROUP_ORDER).map(
                  (group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  )
                )}
              </select>

              <div className="flex gap-2">
                <button
                  onClick={() => setIsCreatingExercise(false)}
                  className="flex-1 p-3 text-zinc-400 bg-zinc-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitNewExercise}
                  className="flex-1 p-3 text-zinc-900 bg-brand-500 font-bold rounded-xl"
                >
                  Guardar y Añadir
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Set Type Picker overlay */}
      {pickerTarget !== null && (
        <SetTypePicker
          current={
            draft.exercises[pickerTarget.exerciseIdx]?.setTypes?.[pickerTarget.setIdx] || DEFAULT_SET_TYPE
          }
          onChange={(newType) =>
            handleSetTypeChange(pickerTarget.exerciseIdx, pickerTarget.setIdx, newType)
          }
          onClose={() => setPickerTarget(null)}
        />
      )}

      {detailExercise && (
        <ExerciseDetailSheet exercise={detailExercise} onClose={() => setDetailExercise(null)} />
      )}
      </div>
    </div>
  );
}
