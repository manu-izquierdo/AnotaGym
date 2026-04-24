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
import { useAuth } from './contexts/AuthContext';
import useFirestoreData from './hooks/useFirestoreData';

// RGB triplets for each accent palette (no # prefix — needed for Tailwind CSS var opacity)
export const ACCENT_PALETTES = {
  violet: { 50:'238 233 254', 100:'237 233 254', 400:'167 139 250', 500:'139 92 246',  600:'124 58 237',  700:'109 40 217',  900:'76 29 149' },
  blue:   { 50:'239 246 255', 100:'219 234 254', 400:'96 165 250',  500:'59 130 246',  600:'37 99 235',   700:'29 78 216',   900:'30 58 138' },
  emerald:{ 50:'236 253 245', 100:'209 250 229', 400:'52 211 153',  500:'16 185 129',  600:'5 150 105',   700:'4 120 87',    900:'6 78 59' },
  rose:   { 50:'255 241 242', 100:'255 228 230', 400:'251 113 133', 500:'244 63 94',   600:'225 29 72',   700:'190 18 60',   900:'136 19 55' },
  orange: { 50:'255 247 237', 100:'255 237 213', 400:'251 146 60',  500:'249 115 22',  600:'234 88 12',   700:'194 65 12',   900:'124 45 18' },
  cyan:   { 50:'236 254 255', 100:'207 250 254', 400:'34 211 238',  500:'6 182 212',   600:'8 145 178',   700:'14 116 144',  900:'22 78 99' },
  amber:  { 50:'255 251 235', 100:'254 243 199', 400:'251 191 36',  500:'245 158 11',  600:'217 119 6',   700:'180 83 9',    900:'120 53 15' },
  pink:   { 50:'253 242 248', 100:'252 231 243', 400:'240 114 163', 500:'236 72 153',  600:'219 39 119',  700:'190 24 93',   900:'131 24 67' },
};

export const ACCENT_NAMES = {
  violet: 'Violeta',
  blue:   'Azul',
  emerald:'Verde',
  rose:   'Rojo',
  orange: 'Naranja',
  cyan:   'Cian',
  amber:  'Ámbar',
  pink:   'Rosa',
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
    exercises,
    loading,
    addExercise,
    deleteExercise,
    restoreDefaultExercises,
    exportData,
    importData,
  } = useFirestoreData(currentUser?.uid, isAdmin);

  const [activeTab, setActiveTab] = useState('routine');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [restTimerEnd, setRestTimerEnd] = useState(null);

  // ---- Hooks siempre ANTES de cualquier return condicional ----

  useEffect(() => {
    const isLight = workoutState.preferences?.theme === 'light';
    document.documentElement.classList.toggle('dark', !isLight);
  }, [workoutState.preferences?.theme]);

  useEffect(() => {
    const accentKey = workoutState.preferences?.accentColor || 'violet';
    const palette = ACCENT_PALETTES[accentKey] || ACCENT_PALETTES.violet;
    Object.entries(palette).forEach(([shade, rgb]) => {
      document.documentElement.style.setProperty(`--brand-${shade}`, rgb);
    });
  }, [workoutState.preferences?.accentColor]);

  useEffect(() => {
    if (workoutState.activeSession) {
      setActiveTab('tracker');
    }
  }, []); // Solo al montar

  useEffect(() => {
    // Interceptar enlaces compartidos
    const params = new URLSearchParams(window.location.search);
    const importData = params.get('importRoutine');
    
    if (importData && currentUser && !loading) {
      try {
        const decoded = JSON.parse(decodeURIComponent(atob(importData)));
        if (decoded && decoded.name && decoded.exercises) {
          if (window.confirm(`¿Alguien ha compartido contigo la rutina "${decoded.name}". ¿Quieres importarla a tu catálogo?`)) {
            const newRoutine = {
              ...decoded,
              id: `template-${Date.now()}`,
              exercises: decoded.exercises.map(ex => ({ ...ex, id: `${ex.exerciseId}-${crypto.randomUUID()}` }))
            };
            handleSaveTemplate(newRoutine);
            alert('¡Rutina importada con éxito!');
          }
        }
      } catch (e) {
        console.error('Error importando rutina compartida', e);
        alert('El enlace de la rutina es inválido o está corrupto.');
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

  const handleSetFieldChange = (exerciseId, setId, field, value) => {
    // Si marcamos una serie como completada, iniciar el timer
    if (field === 'completed' && value === true) {
      const duration = workoutState.preferences?.defaultRestTimer ?? 90;
      if (duration > 0) {
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
                  sets: exercise.sets.map((set) =>
                    set.id === setId ? { ...set, [field]: value } : set
                  ),
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
    setWorkoutState((prev) => {
      if (!prev.activeSession) return prev;

      const cleanedExercises = prev.activeSession.exercises
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
        return { ...prev, activeSession: null };
      }

      const completedSession = {
        ...prev.activeSession,
        id: crypto.randomUUID(),
        finishedAt: new Date().toISOString(),
        exercises: cleanedExercises,
      };

      return {
        ...prev,
        completedSessions: [...prev.completedSessions, completedSession],
        activeSession: null,
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
    setWorkoutState((prev) => ({
      ...prev,
      completedSessions: prev.completedSessions.filter((s) => s.id !== sessionId),
    }));
  };

  const handleDeleteBodyMetric = (date) => {
    setWorkoutState((prev) => ({
      ...prev,
      bodyMetrics: prev.bodyMetrics.filter((m) => m.date !== date),
    }));
  };

  // Objeto de usuario unificado para los componentes UI
  const uiUser = {
    uid: currentUser.uid,
    email: currentUser.email,
    displayName: userProfile?.displayName || currentUser.displayName || currentUser.email,
    photoURL: workoutState.preferences?.profilePicture || currentUser.photoURL || null,
    role: userProfile?.role || 'user',
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
            onCreateTemplate={() => setEditingTemplate('NEW')}
            onEditTemplate={(template) => setEditingTemplate(template)}
            onDeleteTemplate={handleDeleteTemplate}
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
            />
          ) : (
            <HistoryView
              completedSessions={workoutState.completedSessions}
              exerciseLibrary={exercises}
              bodyMetrics={workoutState.bodyMetrics}
              unit={workoutState.preferences?.unit || 'kg'}
              onDeleteSession={handleDeleteSession}
            />
          )
        )}

        {activeTab === 'profile' && (
          <ProfileView
            completedSessions={workoutState.completedSessions}
            preferences={workoutState.preferences}
            bodyMetrics={workoutState.bodyMetrics}
            onSavePreferences={handleSavePreferences}
            onAddBodyMetric={handleAddBodyMetric}
            onDeleteBodyMetric={handleDeleteBodyMetric}
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
          onAdd={(secs) => setRestTimerEnd((prev) => prev + secs * 1000)}
          onStop={() => setRestTimerEnd(null)}
        />
      )}
    </>
  );
}

export default App;
