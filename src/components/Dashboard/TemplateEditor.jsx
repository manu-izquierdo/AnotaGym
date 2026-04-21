import React, { useMemo, useState } from 'react';

const MAX_EXERCISES_PER_TEMPLATE = 15;
const MIN_SETS_PER_EXERCISE = 1;
const MAX_SETS_PER_EXERCISE = 10;

const createDraftFromTemplate = (template) => {
  if (!template) {
    return {
      id: crypto.randomUUID(),
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
    })),
  };
};

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

  const groupedExercises = useMemo(() => {
    const filtered = exerciseLibrary.filter((exercise) => {
      const groupOk = selectedGroupFilter === 'all' || exercise.muscleGroup === selectedGroupFilter;
      const equipOk = selectedEquipmentFilter === 'all' || exercise.equipment === selectedEquipmentFilter;
      const searchOk = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      return groupOk && equipOk && searchOk;
    });

    return filtered.reduce((acc, currentExercise) => {
      if (!acc[currentExercise.muscleGroup]) acc[currentExercise.muscleGroup] = [];
      acc[currentExercise.muscleGroup].push(currentExercise);
      return acc;
    }, {});
  }, [exerciseLibrary, searchTerm, selectedGroupFilter, selectedEquipmentFilter]);

  const exerciseIndex = useMemo(() => {
    return exerciseLibrary.reduce((acc, currentExercise) => {
      acc[currentExercise.id] = currentExercise;
      return acc;
    }, {});
  }, [exerciseLibrary]);
  const availableGroups = useMemo(
    () => ['all', ...Array.from(new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup)))],
    [exerciseLibrary]
  );
  const availableEquipment = useMemo(
    () => ['all', ...Array.from(new Set(exerciseLibrary.map((exercise) => exercise.equipment || 'Otro')))],
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
    if (sortedFocus.length === 1) return `Enfasis: ${sortedFocus[0][0]}`;
    return `Enfasis: ${sortedFocus[0][0]} y ${sortedFocus[1][0]}`;
  }, [draft.exercises, exerciseIndex]);

  const handleNameChange = (event) => {
    setDraft((prev) => ({ ...prev, name: event.target.value }));
  };

  const handleAddExercise = (exerciseId) => {
    if (draft.exercises.length >= MAX_EXERCISES_PER_TEMPLATE) {
      alert(`El limite maximo es de ${MAX_EXERCISES_PER_TEMPLATE} ejercicios por rutina.`);
      return;
    }
    if (draft.exercises.some((exercise) => exercise.exerciseId === exerciseId)) {
      alert('El ejercicio ya esta en la plantilla.');
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
        },
      ],
    }));
    setShowSelector(false);
  };

  const submitNewExercise = () => {
    const normalizedName = newExName.trim();

    if (!normalizedName) {
      alert('El nombre del ejercicio no puede estar vacio.');
      return;
    }

    const isDuplicate = exerciseLibrary.some(
      (exercise) => exercise.name.toLowerCase() === normalizedName.toLowerCase()
    );
    if (isDuplicate) {
      alert('Ya existe un ejercicio con este nombre en el catalogo.');
      return;
    }

    const newId = onCreateExercise({
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
      newExercises[index] = { ...newExercises[index], [field]: value };
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

  const validateAndSave = () => {
    if (!draft.name.trim()) {
      alert('El nombre de la rutina es obligatorio.');
      return;
    }
    if (draft.exercises.length === 0) {
      alert('Debes anadir al menos un ejercicio.');
      return;
    }
    if (draft.exercises.length > MAX_EXERCISES_PER_TEMPLATE) {
      alert(`El limite maximo es de ${MAX_EXERCISES_PER_TEMPLATE} ejercicios por rutina.`);
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
      alert(`El numero de series debe estar entre ${MIN_SETS_PER_EXERCISE} y ${MAX_SETS_PER_EXERCISE}.`);
      return;
    }

    onSave({
      ...draft,
      name: draft.name.trim(),
      focus: routineFocus,
    });
  };

  return (
    <div className="fixed inset-0 bg-zinc-950 text-white z-50 p-4 overflow-y-auto">
      <header className="flex justify-between items-center mb-6">
        <button onClick={onCancel} className="text-zinc-400 p-2">
          Cancelar
        </button>
        <h2 className="font-bold">Editar Plantilla</h2>
        <button
          onClick={validateAndSave}
          className="text-blue-500 font-bold p-2 disabled:opacity-40"
          disabled={!draft.name.trim() || draft.exercises.length === 0}
        >
          Guardar
        </button>
      </header>

      <input
        type="text"
        value={draft.name}
        onChange={handleNameChange}
        className="w-full bg-zinc-900 p-4 rounded-lg mb-6 text-xl outline-none"
        placeholder="Nombre de la rutina"
      />
      <p className="text-sm text-zinc-400 mb-6">{routineFocus}</p>

      <div className="space-y-3 mb-6">
        {draft.exercises.map((exercise, index) => {
          const dictExercise = exerciseIndex[exercise.exerciseId];
          return (
            <div
              key={`${exercise.id}-${index}`}
              className="flex flex-col gap-3 bg-zinc-900 p-4 rounded-xl border border-zinc-800"
            >
              <div className="flex items-center justify-between">
                <p className="font-bold text-zinc-100">{dictExercise ? dictExercise.name : 'Desconocido'}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMove(index, 'UP')}
                    disabled={index === 0}
                    className="p-1 disabled:opacity-30 text-zinc-400 hover:text-white transition-colors"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => handleMove(index, 'DOWN')}
                    disabled={index === draft.exercises.length - 1}
                    className="p-1 disabled:opacity-30 text-zinc-400 hover:text-white transition-colors"
                  >
                    ↓
                  </button>
                  <button onClick={() => handleRemoveExercise(index)} className="p-1 text-red-500 hover:text-red-400 transition-colors ml-1">
                    ✕
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">Series</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={exercise.targetSets}
                    onChange={(e) => handleExerciseFieldChange(index, 'targetSets', parseInt(e.target.value) || '')}
                    className="bg-zinc-950 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg px-3 py-2 text-sm text-zinc-100 transition-all"
                  />
                </div>
                <div className="flex-[2] flex flex-col gap-1">
                  <label className="text-xs font-medium text-zinc-500">Rango Reps</label>
                  <input
                    type="text"
                    value={exercise.targetReps}
                    onChange={(e) => handleExerciseFieldChange(index, 'targetReps', e.target.value)}
                    placeholder="ej. 8-12"
                    className="bg-zinc-950 border border-zinc-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none rounded-lg px-3 py-2 text-sm text-zinc-100 transition-all"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!showSelector ? (
        <button
          onClick={() => setShowSelector(true)}
          className="w-full bg-zinc-800 text-blue-400 p-4 rounded-lg font-bold"
        >
          + Anadir Ejercicio
        </button>
      ) : (
        <div className="bg-zinc-900 p-4 rounded-lg">
          {!isCreatingExercise ? (
            <>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm text-zinc-400">Seleccionar Ejercicio</h3>
                <button
                  onClick={() => setIsCreatingExercise(true)}
                  className="text-blue-400 text-sm font-bold"
                >
                  + Nuevo Personalizado
                </button>
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar ejercicio..."
                className="w-full bg-zinc-800 p-3 rounded mb-3 text-white outline-none"
              />
              <div className="grid grid-cols-2 gap-2 mb-3">
                <select
                  value={selectedGroupFilter}
                  onChange={(event) => setSelectedGroupFilter(event.target.value)}
                  className="bg-zinc-800 p-2 rounded text-sm"
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
                  className="bg-zinc-800 p-2 rounded text-sm"
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
                  <p className="font-bold text-zinc-500 mb-2">{group}</p>
                  <div className="grid gap-2">
                    {exercises.map((exercise) => (
                      <button
                        key={exercise.id}
                        onClick={() => handleAddExercise(exercise.id)}
                        className="text-left bg-zinc-800 p-3 rounded active:bg-zinc-700"
                      >
                        <span className="block">{exercise.name}</span>
                        <span className="text-[10px] text-zinc-400">{exercise.equipment || 'Otro'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {Object.keys(groupedExercises).length === 0 && (
                <p className="text-xs text-zinc-500">No hay ejercicios para ese filtro.</p>
              )}
              <button
                onClick={() => setShowSelector(false)}
                className="w-full mt-4 p-2 text-zinc-400 border border-zinc-800 rounded"
              >
                Cancelar Seleccion
              </button>
            </>
          ) : (
            <>
              <h3 className="mb-4 text-sm font-bold text-white">Crear Ejercicio</h3>
              <input
                type="text"
                placeholder="Ej: Elevaciones Y"
                value={newExName}
                onChange={(event) => setNewExName(event.target.value)}
                className="w-full bg-zinc-800 p-3 rounded mb-4 text-white outline-none"
              />
              <select
                value={newExGroup}
                onChange={(event) => setNewExGroup(event.target.value)}
                className="w-full bg-zinc-800 p-3 rounded mb-6 text-white outline-none"
              >
                {Array.from(new Set(exerciseLibrary.map((exercise) => exercise.muscleGroup))).map(
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
                  className="flex-1 p-3 text-zinc-400 bg-zinc-800 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={submitNewExercise}
                  className="flex-1 p-3 text-zinc-900 bg-blue-500 font-bold rounded"
                >
                  Guardar y Anadir
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
