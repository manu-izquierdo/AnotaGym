import React, { useEffect, useState } from 'react';
import MobileAppShell from './components/Layout/MobileAppShell';
import LoginView from './components/Auth/LoginView';
import SplitView from './components/Dashboard/SplitView';
import TemplateEditor from './components/Dashboard/TemplateEditor';
import SetLogger from './components/Tracker/SetLogger';
import HistoryView from './components/History/HistoryView';
import ProfileView from './components/Profile/ProfileView';
import SettingsView from './components/Profile/SettingsView';
import RestTimerPill from './components/Tracker/RestTimerPill';
import SaveRoutineDialog from './components/Tracker/SaveRoutineDialog';
import ConfirmDialog from './components/UI/ConfirmDialog';
import { useAuth } from './contexts/AuthContext';
import useFirestoreData from './hooks/useFirestoreData';
import { generateUUID } from './utils/uuid';
import { primeTimerSound } from './utils/timerSound';
import { PALETTES, resolvePaletteId, buildPaletteCss } from './theme/palettes';

// Valida y limpia una rutina llegada por enlace compartido. El JSON viene de
// una URL que cualquiera puede manipular: solo se aceptan los campos conocidos
// y con tamaños acotados — sin esto, un enlace malicioso o una rutina gigante
// podría inflar el doc principal hacia el límite de 1 MB y romper el guardado.
const sanitizeSharedRoutine = (decoded) => {
  if (!decoded || typeof decoded.name !== 'string' || !Array.isArray(decoded.exercises)) return null;
  const name = decoded.name.trim().slice(0, 60);
  if (!name || decoded.exercises.length === 0 || decoded.exercises.length > 20) return null;

  const exercises = [];
  for (const ex of decoded.exercises) {
    if (!ex || typeof ex.exerciseId !== 'string' || !ex.exerciseId || ex.exerciseId.length > 64) return null;
    const targetSets = Math.min(Math.max(parseInt(ex.targetSets, 10) || 1, 1), 10);
    const setTypes = Array.isArray(ex.setTypes)
      ? ex.setTypes.slice(0, targetSets).map((t) => (typeof t === 'string' ? t.slice(0, 16) : 'normal'))
      : [];
    exercises.push({
      exerciseId: ex.exerciseId,
      targetSets,
      targetReps: typeof ex.targetReps === 'string' ? ex.targetReps.slice(0, 12) : '',
      setTypes,
    });
  }
  return {
    name,
    focus: typeof decoded.focus === 'string' ? decoded.focus.slice(0, 40) : '',
    exercises,
  };
};

const createSessionSets = (templateExercise) =>
  Array.from({ length: templateExercise.targetSets }, (_, index) => ({
    id: `${templateExercise.id}-set-${index + 1}`,
    order: index + 1,
    weight: '',
    reps: '',
    effort: '',
    completed: false,
    // Inherit set type from the template plan (falls back to 'normal')
    setType: templateExercise.setTypes?.[index] || 'normal',
  }));

function App() {
  const { currentUser, userProfile, isAdmin, logout } = useAuth();

  const {
    workoutState,
    setWorkoutState,
    saveSession,
    deleteSession,
    exercises,
    loading,
    addExercise,
    saveGlobalExercise,
    deleteExercise,
    restoreDefaultExercises,
    exportData,
    importData,
  } = useFirestoreData(currentUser?.uid, isAdmin);

  const [activeTab, setActiveTab] = useState('routine');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [restTimerEnd, setRestTimerEnd] = useState(null);
  // Sesión libre recién terminada, pendiente de ofrecer "guardar como rutina"
  const [saveRoutinePrompt, setSaveRoutinePrompt] = useState(null);
  // Rutina llegada por enlace compartido: { routine } o { error: true }
  const [importPrompt, setImportPrompt] = useState(null);

  // ---- Hooks siempre ANTES de cualquier return condicional ----

  // La barra de estado del móvil (meta theme-color) acompaña al fondo actual
  const syncThemeColorMeta = () => {
    const paletteId = resolvePaletteId(workoutState.preferences?.accentColor);
    const isDark = document.documentElement.classList.contains('dark');
    const bg = PALETTES[paletteId][isDark ? 'dark' : 'light'].bg;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
  };

  useEffect(() => {
    const theme = workoutState.preferences?.theme || 'dark';
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark = theme === 'system' ? media.matches : theme !== 'light';
      document.documentElement.classList.toggle('dark', isDark);
      syncThemeColorMeta();
    };
    applyTheme();
    if (theme === 'system') {
      // Seguir los cambios del SO en vivo (p. ej. modo oscuro automático al anochecer)
      media.addEventListener('change', applyTheme);
      return () => media.removeEventListener('change', applyTheme);
    }
  }, [workoutState.preferences?.theme, workoutState.preferences?.accentColor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // La paleta define variables para claro Y oscuro a la vez (:root / :root.dark),
    // así el cambio de tema —incluido el modo Sistema— no necesita recalcular nada.
    const paletteId = resolvePaletteId(workoutState.preferences?.accentColor);
    const palette = PALETTES[paletteId];
    let styleEl = document.getElementById('palette-vars');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'palette-vars';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = buildPaletteCss(palette);
    syncThemeColorMeta();
  }, [workoutState.preferences?.accentColor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Al terminar de cargar los datos remotos: si había una sesión a medias,
    // llevar al usuario directamente al tracker (al montar aún no hay datos)
    if (!loading && workoutState.activeSession) {
      setActiveTab('tracker');
    }
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Interceptar enlaces compartidos
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('importRoutine');
    
    if (importData && currentUser && !loading) {
      try {
        // Cota de tamaño antes siquiera de decodificar (una rutina real ocupa ~1-3 KB)
        if (importData.length > 20000) throw new Error('enlace demasiado grande');
        const decoded = JSON.parse(decodeURIComponent(atob(importData)));
        const routine = sanitizeSharedRoutine(decoded);
        if (routine) {
          setImportPrompt({ routine });
        } else {
          setImportPrompt({ error: true });
        }
      } catch (e) {
        console.error('Error importando rutina compartida', e);
        setImportPrompt({ error: true });
      }

      // Limpiar URL para no importar infinitamente
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [currentUser, loading]); // Esperar a que el usuario cargue para tener workoutState disponible

  // ---- Returns condicionales DESPUÉS de todos los hooks ----

  if (!currentUser) {
    return <LoginView />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <svg className="animate-spin w-8 h-8 text-brand-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-zinc-500 text-sm">Cargando tu información…</p>
      </div>
    );
  }

  // ---- Session handlers ----

  const handleStartTraining = (templateId) => {
    const template = workoutState.routineTemplates.find((item) => item.id === templateId);
    if (!template) return;

    const activeSession = {
      id: `session-${Date.now()}`,
      templateId: template.id,
      templateName: template.name,
      startedAt: new Date().toISOString(),
      exercises: template.exercises.map((exercise) => ({
        id: exercise.id,
        exerciseId: exercise.exerciseId,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        setTypes: exercise.setTypes || [],
        sets: createSessionSets(exercise),
      })),
    };

    setWorkoutState((prev) => ({ ...prev, activeSession }));
    setActiveTab('tracker');
  };

  // Una serie se autocompleta cuando todos sus campos de datos están rellenos
  // (peso + reps, y también esfuerzo si RIR/RPE está activo); si se borra
  // alguno, se desmarca sola. El usuario siempre puede togglearla a mano.
  const isSetFilled = (set) => {
    const filled = (v) => String(v ?? '').trim() !== '';
    const effortMode = workoutState.preferences?.effortMode || 'off';
    return filled(set.weight) && filled(set.reps) && (effortMode === 'off' || filled(set.effort));
  };

  const handleSetFieldChange = (exerciseId, setId, field, value) => {
    const isDataField = field === 'weight' || field === 'reps' || field === 'effort';

    // ¿Va a pasar de incompleta a completada? (check manual o auto-check)
    let startsTimer = field === 'completed' && value === true;
    if (isDataField) {
      const currentSet = workoutState.activeSession?.exercises
        .find((exercise) => exercise.id === exerciseId)
        ?.sets.find((set) => set.id === setId);
      if (currentSet && !currentSet.completed) {
        startsTimer = isSetFilled({ ...currentSet, [field]: value });
      }
    }
    if (startsTimer) {
      const duration = workoutState.preferences?.defaultRestTimer ?? 90;
      if (duration > 0) {
        // Estamos dentro de un gesto del usuario: desbloquear el audio ahora
        // para que el aviso pueda sonar solo cuando el timer llegue a 0 (iOS).
        if (workoutState.preferences?.restTimerSound !== false) {
          primeTimerSound();
        }
        setRestTimerEnd(Date.now() + duration * 1000);
      }
    }

    setWorkoutState((prev) => {
      if (!prev.activeSession) return prev;
      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          exercises: prev.activeSession.exercises.map((exercise) =>
            exercise.id === exerciseId
              ? {
                  ...exercise,
                  sets: exercise.sets.map((set) => {
                    if (set.id !== setId) return set;
                    const next = { ...set, [field]: value };
                    if (isDataField) {
                      if (isSetFilled(next)) next.completed = true;
                      else if (String(value).trim() === '') next.completed = false;
                    }
                    return next;
                  }),
                }
              : exercise
          ),
        },
      };
    });
  };

  const handleExerciseFieldChange = (exerciseId, field, value) => {
    setWorkoutState((prev) => {
      if (!prev.activeSession) return prev;
      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          exercises: prev.activeSession.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, [field]: value } : ex
          ),
        },
      };
    });
  };

  const handleCancelSession = () => {
    setWorkoutState((prev) => ({ ...prev, activeSession: null }));
    setActiveTab('routine');
  };

  const handleFinishSession = () => {
    const session = workoutState.activeSession;
    if (!session) return;

    const cleanedExercises = session.exercises
      .map((exercise) => {
        const completedSets = exercise.sets.filter((set) => {
          const hasWeight = String(set.weight).trim() !== '';
          const hasReps = String(set.reps).trim() !== '';
          return hasWeight || hasReps;
        });
        return { ...exercise, sets: completedSets };
      })
      .filter((exercise) => exercise.sets.length > 0);

    if (cleanedExercises.length === 0) {
      setWorkoutState((prev) => ({ ...prev, activeSession: null }));
      return;
    }

    const completedSession = {
      ...session,
      id: generateUUID(),
      finishedAt: new Date().toISOString(),
      exercises: cleanedExercises,
    };

    // La sesión va a su propio documento; el doc principal solo suelta la activa.
    // Sin await: con la caché offline la promesa solo resuelve cuando el
    // servidor confirma, y en el gym sin cobertura no debe bloquear la UI.
    saveSession(completedSession).catch((err) =>
      console.error('Error guardando la sesión completada:', err)
    );
    setWorkoutState((prev) => ({ ...prev, activeSession: null }));

    // Entreno libre con contenido → ofrecer convertirlo en rutina
    if (!session.templateId) {
      setSaveRoutinePrompt(completedSession);
    }
  };

  // Convierte la sesión libre recién guardada en una plantilla de rutina
  const handleSaveSessionAsRoutine = (name) => {
    const session = saveRoutinePrompt;
    if (!session) return;

    const repsRange = (sets) => {
      const reps = sets.map((s) => parseInt(s.reps, 10)).filter((n) => Number.isFinite(n) && n > 0);
      if (reps.length === 0) return '';
      const min = Math.min(...reps);
      const max = Math.max(...reps);
      return min === max ? String(min) : `${min}-${max}`;
    };

    const template = {
      id: `template-${Date.now()}`,
      name,
      focus: '',
      exercises: session.exercises.map((ex) => ({
        id: `${ex.exerciseId}-${generateUUID()}`,
        exerciseId: ex.exerciseId,
        targetSets: ex.sets.length,
        targetReps: repsRange(ex.sets),
        setTypes: ex.sets.map((s) => s.setType || 'normal'),
      })),
    };

    setWorkoutState((prev) => ({
      ...prev,
      routineTemplates: [...prev.routineTemplates, template],
    }));
    setSaveRoutinePrompt(null);
    setActiveTab('routine');
  };

  // ---- Quick Log: sesión libre sin plantilla ----

  const handleStartQuickLog = () => {
    // Si ya hay una sesión en marcha, no la pisamos: llevamos al usuario a ella
    if (workoutState.activeSession) {
      setActiveTab('tracker');
      return;
    }
    const activeSession = {
      id: `session-${Date.now()}`,
      templateId: null,
      templateName: 'Entrenamiento libre',
      startedAt: new Date().toISOString(),
      exercises: [],
    };
    setWorkoutState((prev) => ({ ...prev, activeSession }));
    setActiveTab('tracker');
  };

  const createEmptySet = (exerciseInstanceId, order, setType = 'normal') => ({
    id: `${exerciseInstanceId}-set-${generateUUID()}`,
    order,
    weight: '',
    reps: '',
    effort: '',
    completed: false,
    setType,
  });

  // Añadir un ejercicio a la sesión activa (Quick Log o extra sobre plantilla)
  const handleAddExerciseToSession = (exerciseId) => {
    setWorkoutState((prev) => {
      if (!prev.activeSession) return prev;
      const instanceId = `${exerciseId}-${generateUUID()}`;
      const newExercise = {
        id: instanceId,
        exerciseId,
        targetSets: 3,
        targetReps: '',
        setTypes: [],
        sets: Array.from({ length: 3 }, (_, i) => createEmptySet(instanceId, i + 1)),
      };
      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          exercises: [...prev.activeSession.exercises, newExercise],
        },
      };
    });
  };

  // Añadir una serie extra a un ejercicio de la sesión (hereda el tipo de la última)
  const handleAddSetToExercise = (sessionExerciseId) => {
    setWorkoutState((prev) => {
      if (!prev.activeSession) return prev;
      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          exercises: prev.activeSession.exercises.map((ex) => {
            if (ex.id !== sessionExerciseId) return ex;
            const lastType = ex.sets[ex.sets.length - 1]?.setType || 'normal';
            return {
              ...ex,
              targetSets: ex.sets.length + 1,
              sets: [...ex.sets, createEmptySet(ex.id, ex.sets.length + 1, lastType)],
            };
          }),
        },
      };
    });
  };

  // Quitar una serie concreta (renumera las restantes)
  const handleRemoveSetFromExercise = (sessionExerciseId, setId) => {
    setWorkoutState((prev) => {
      if (!prev.activeSession) return prev;
      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          exercises: prev.activeSession.exercises.map((ex) => {
            if (ex.id !== sessionExerciseId) return ex;
            const sets = ex.sets
              .filter((s) => s.id !== setId)
              .map((s, i) => ({ ...s, order: i + 1 }));
            return { ...ex, targetSets: Math.max(sets.length, 1), sets };
          }),
        },
      };
    });
  };

  const handleRemoveExerciseFromSession = (sessionExerciseId) => {
    setWorkoutState((prev) => {
      if (!prev.activeSession) return prev;
      return {
        ...prev,
        activeSession: {
          ...prev.activeSession,
          exercises: prev.activeSession.exercises.filter((ex) => ex.id !== sessionExerciseId),
        },
      };
    });
  };

  // ---- Template handlers ----

  const handleSaveTemplate = (updatedTemplate) => {
    setWorkoutState((prev) => {
      const exists = prev.routineTemplates.some((t) => t.id === updatedTemplate.id);
      const routineTemplates = exists
        ? prev.routineTemplates.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t))
        : [...prev.routineTemplates, updatedTemplate];
      return { ...prev, routineTemplates };
    });
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = (templateId) => {
    setWorkoutState((prev) => ({
      ...prev,
      routineTemplates: prev.routineTemplates.filter((t) => t.id !== templateId),
    }));
  };

  const handleDuplicateTemplate = (templateId) => {
    const template = workoutState.routineTemplates.find((t) => t.id === templateId);
    if (!template) return;
    const copy = {
      ...template,
      id: `template-${Date.now()}`,
      name: `${template.name} (copia)`,
      // Nuevos ids de instancia para que ambas rutinas sean independientes
      exercises: template.exercises.map((ex) => ({ ...ex, id: `${ex.exerciseId}-${generateUUID()}` })),
    };
    setWorkoutState((prev) => ({
      ...prev,
      routineTemplates: [...prev.routineTemplates, copy],
    }));
  };

  // ---- Exercise handlers ----

  const handleCreateCustomExercise = async (newExerciseData) => {
    return await addExercise(newExerciseData);
  };

  const handleDeleteExercise = async (exerciseId) => {
    await deleteExercise(exerciseId);
  };

  const handleRestoreDefaultExercises = async () => {
    await restoreDefaultExercises();
  };

  // ---- Preferences ----

  const handleSavePreferences = (patch) => {
    setWorkoutState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, ...patch },
    }));
  };

  // ---- Body metrics ----

  const handleAddBodyMetric = (metric) => {
    setWorkoutState((prev) => {
      const rest = prev.bodyMetrics.filter((item) => item.date !== metric.date);
      return {
        ...prev,
        bodyMetrics: [...rest, metric].sort((a, b) => new Date(a.date) - new Date(b.date)),
      };
    });
  };

  const handleDeleteSession = (sessionId) => {
    deleteSession(sessionId);
  };

  // Corregir un entrenamiento ya guardado (peso/reps mal apuntados un día)
  const handleUpdateSession = (updatedSession) => {
    saveSession(updatedSession);
  };

  const handleDeleteBodyMetric = (date) => {
    setWorkoutState((prev) => ({
      ...prev,
      bodyMetrics: prev.bodyMetrics.filter((m) => m.date !== date),
    }));
  };

  // Objeto de usuario unificado para los componentes UI.
  // El nickname (elegido en Perfil) manda sobre el nombre de la cuenta.
  const uiUser = {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName:
      workoutState.preferences?.nickname ||
      userProfile?.displayName ||
      currentUser.displayName ||
      currentUser.email,
    photoURL: workoutState.preferences?.profilePicture || currentUser.photoURL || null,
    role: userProfile?.role || 'user',
    isAnonymous: currentUser.isAnonymous,
  };

  return (
    <>
      <MobileAppShell
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onProfileClick={() => setActiveTab('profile')}
        user={uiUser}
      >
        {activeTab === 'routine' && (
          <SplitView
            templates={workoutState.routineTemplates}
            onStartTraining={handleStartTraining}
            onStartQuickLog={handleStartQuickLog}
            onCreateTemplate={() => setEditingTemplate('NEW')}
            onEditTemplate={(template) => setEditingTemplate(template)}
            onDeleteTemplate={handleDeleteTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            user={uiUser}
            completedSessions={workoutState.completedSessions}
            hasActiveSession={Boolean(workoutState.activeSession)}
            exerciseLibrary={exercises}
          />
        )}

        {activeTab === 'tracker' && (
          workoutState.activeSession ? (
            <SetLogger
              activeSession={workoutState.activeSession}
              completedSessions={workoutState.completedSessions}
              exerciseLibrary={exercises}
              unit={workoutState.preferences?.unit || 'kg'}
              onSetFieldChange={handleSetFieldChange}
              onExerciseFieldChange={handleExerciseFieldChange}
              onFinishSession={handleFinishSession}
              onCancelSession={handleCancelSession}
              onAddExercise={handleAddExerciseToSession}
              onAddSet={handleAddSetToExercise}
              onRemoveSet={handleRemoveSetFromExercise}
              onRemoveExercise={handleRemoveExerciseFromSession}
              showRmEstimates={workoutState.preferences?.showRmEstimates === true}
              plateCalcEnabled={workoutState.preferences?.plateCalculator === true}
              effortMode={workoutState.preferences?.effortMode || 'off'}
            />
          ) : (
            <HistoryView
              completedSessions={workoutState.completedSessions}
              exerciseLibrary={exercises}
              bodyMetrics={workoutState.bodyMetrics}
              unit={workoutState.preferences?.unit || 'kg'}
              onDeleteSession={handleDeleteSession}
              onUpdateSession={handleUpdateSession}
              onAddBodyMetric={handleAddBodyMetric}
              onDeleteBodyMetric={handleDeleteBodyMetric}
            />
          )
        )}

        {activeTab === 'profile' && (
          <ProfileView
            completedSessions={workoutState.completedSessions}
            preferences={workoutState.preferences}
            onSavePreferences={handleSavePreferences}
            onLogout={logout}
            user={uiUser}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            exercises={exercises}
            preferences={workoutState.preferences}
            onSavePreferences={handleSavePreferences}
            onDeleteExercise={handleDeleteExercise}
            onCreateExercise={handleCreateCustomExercise}
            onSaveGlobalExercise={saveGlobalExercise}
            onRestoreExercises={handleRestoreDefaultExercises}
            onExportData={exportData}
            onImportData={importData}
            user={uiUser}
            isAdmin={isAdmin}
          />
        )}
      </MobileAppShell>

      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate === 'NEW' ? null : editingTemplate}
          exerciseLibrary={exercises}
          onSave={handleSaveTemplate}
          onCancel={() => setEditingTemplate(null)}
          onCreateExercise={handleCreateCustomExercise}
        />
      )}

      {restTimerEnd && (
        <RestTimerPill
          endTime={restTimerEnd}
          soundEnabled={workoutState.preferences?.restTimerSound !== false}
          onAdd={(secs) => setRestTimerEnd((prev) => prev + secs * 1000)}
          onStop={() => setRestTimerEnd(null)}
        />
      )}

      {saveRoutinePrompt && (
        <SaveRoutineDialog
          defaultName={`Entreno ${new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
          exerciseCount={saveRoutinePrompt.exercises.length}
          onSave={handleSaveSessionAsRoutine}
          onClose={() => setSaveRoutinePrompt(null)}
        />
      )}

      {importPrompt?.routine && (
        <ConfirmDialog
          title="Rutina compartida contigo"
          message={`¿Quieres importar "${importPrompt.routine.name}" (${importPrompt.routine.exercises.length} ejercicios) a tus rutinas?`}
          confirmLabel="Importar"
          cancelLabel="Ahora no"
          onConfirm={() => {
            const decoded = importPrompt.routine;
            handleSaveTemplate({
              ...decoded,
              id: `template-${Date.now()}`,
              exercises: decoded.exercises.map((ex) => ({ ...ex, id: `${ex.exerciseId}-${generateUUID()}` })),
            });
            setImportPrompt(null);
            setActiveTab('routine');
          }}
          onCancel={() => setImportPrompt(null)}
        />
      )}

      {importPrompt?.error && (
        <ConfirmDialog
          title="Enlace no válido"
          message="El enlace de la rutina es inválido o está corrupto. Pide a tu compañero que lo vuelva a compartir."
          confirmLabel="Entendido"
          cancelLabel={null}
          onConfirm={() => setImportPrompt(null)}
          onCancel={() => setImportPrompt(null)}
        />
      )}
    </>
  );
}

export default App;
