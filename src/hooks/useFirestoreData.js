import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  addDoc,
  deleteDoc,
  query,
  getDocs,
} from 'firebase/firestore';
import { db } from '../firebase';
import { defaultExerciseLibrary } from '../data/exerciseLibrary';
import { extendedExerciseLibrary } from '../data/extendedLibrary';
import { generateUUID } from '../utils/uuid';

const DEFAULT_WORKOUT_STATE = {
  routineTemplates: [],
  activeSession: null,
  completedSessions: [],
  bodyMetrics: [],
  preferences: { theme: 'dark', unit: 'kg', accentColor: 'violet' },
};

/**
 * Hook que sincroniza el estado de entrenamiento con Firestore.
 *
 * Estructura en Firestore:
 *   /users/{uid}/workoutData/main          — rutinas, sesiones, métricas, preferencias
 *   /users/{uid}/privateExercises/{id}     — ejercicios privados del usuario
 *   /globalExercises/{id}                  — ejercicios globales (solo admin escribe)
 *
 * La propiedad `exercises` que expone este hook es la fusión de globales + privados.
 */
export default function useFirestoreData(uid, isAdmin) {
  const [workoutState, setWorkoutStateLocal] = useState(DEFAULT_WORKOUT_STATE);
  const [globalExercises, setGlobalExercises] = useState([]);
  const [privateExercises, setPrivateExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  // Ref para evitar escrituras a Firestore de cambios que vienen de Firestore
  const isRemoteUpdate = useRef(false);

  // ---- Listeners de Firestore ----

  // 1. Datos principales (rutinas, sesiones, métricas, prefs)
  useEffect(() => {
    if (!uid) return;
    const mainRef = doc(db, 'users', uid, 'workoutData', 'main');

    const unsub = onSnapshot(mainRef, (snap) => {
      isRemoteUpdate.current = true;
      if (snap.exists()) {
        setWorkoutStateLocal((prev) => ({ ...DEFAULT_WORKOUT_STATE, ...snap.data() }));
      } else {
        // Primera vez — inicializar documento
        setDoc(mainRef, DEFAULT_WORKOUT_STATE);
      }
      setLoading(false);
      // Permitir escrituras locales de nuevo en el próximo tick
      setTimeout(() => { isRemoteUpdate.current = false; }, 0);
    }, (err) => {
      console.error('Firestore main listener error:', err);
      setLoading(false);
    });

    return unsub;
  }, [uid]);

  // 2. Ejercicios globales (todos los usuarios los ven)
  useEffect(() => {
    if (!uid) return;
    const globalRef = collection(db, 'globalExercises');

    const unsub = onSnapshot(globalRef, (snap) => {
      const exercises = snap.docs.map((d) => ({ ...d.data(), id: d.id, _source: 'global' }));
      setGlobalExercises(exercises);
    });

    return unsub;
  }, [uid]);

  // 3. Ejercicios privados del usuario
  useEffect(() => {
    if (!uid) return;
    const privateRef = collection(db, 'users', uid, 'privateExercises');

    const unsub = onSnapshot(privateRef, (snap) => {
      const exercises = snap.docs.map((d) => ({ ...d.data(), id: d.id, _source: 'private' }));
      setPrivateExercises(exercises);
    });

    return unsub;
  }, [uid]);

  // ---- Escritura a Firestore (debounced) ----

  const saveTimeout = useRef(null);

  const setWorkoutState = useCallback((updater) => {
    setWorkoutStateLocal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      if (isRemoteUpdate.current) return next;

      // Guardar en Firestore con debounce de 800ms para no escribir en cada tecla
      clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        const mainRef = doc(db, 'users', uid, 'workoutData', 'main');
        setDoc(mainRef, next, { merge: true }).catch((err) =>
          console.error('Error saving to Firestore:', err)
        );
      }, 800);

      return next;
    });
  }, [uid]);

  // ---- Gestión de ejercicios ----

  /**
   * Añade un ejercicio.
   * Si el usuario es admin → va a /globalExercises (visible para todos)
   * Si es usuario normal → va a /users/{uid}/privateExercises (solo para él)
   */
  const addExercise = useCallback(async (exerciseData) => {
    const exercise = {
      id: generateUUID(),
      name: exerciseData.name.trim(),
      muscleGroup: exerciseData.muscleGroup.trim(),
      equipment: exerciseData.equipment || 'Custom',
    };

    if (isAdmin) {
      const globalRef = doc(db, 'globalExercises', exercise.id);
      await setDoc(globalRef, { ...exercise, createdByAdmin: true });
    } else {
      const privateRef = doc(db, 'users', uid, 'privateExercises', exercise.id);
      await setDoc(privateRef, exercise);
    }

    return exercise.id;
  }, [uid, isAdmin]);

  /**
   * Elimina un ejercicio. Si es global y admin, lo borra de /globalExercises.
   * Si es privado, lo borra de /users/{uid}/privateExercises.
   * También limpia referencias en rutinas y sesiones completadas.
   */
  const deleteExercise = useCallback(async (exerciseId) => {
    const isGlobal = globalExercises.some((e) => e.id === exerciseId);

    if (isGlobal && isAdmin) {
      await deleteDoc(doc(db, 'globalExercises', exerciseId));
    } else {
      await deleteDoc(doc(db, 'users', uid, 'privateExercises', exerciseId));
    }

    // Limpiar referencias en el estado de entrenamiento
    setWorkoutState((prev) => ({
      ...prev,
      routineTemplates: prev.routineTemplates.map((t) => ({
        ...t,
        exercises: t.exercises.filter((e) => e.exerciseId !== exerciseId),
      })),
      activeSession: prev.activeSession
        ? {
            ...prev.activeSession,
            exercises: prev.activeSession.exercises.filter((e) => e.exerciseId !== exerciseId),
          }
        : null,
      completedSessions: prev.completedSessions.map((s) => ({
        ...s,
        exercises: s.exercises.filter((e) => e.exerciseId !== exerciseId),
      })),
    }));
  }, [uid, isAdmin, globalExercises, setWorkoutState]);

  /**
   * Restaura los ejercicios por defecto (solo los que faltan).
   */
  const restoreDefaultExercises = useCallback(async () => {
    const allIds = new Set([
      ...globalExercises.map((e) => e.id),
      ...privateExercises.map((e) => e.id),
    ]);
    const missing = [...defaultExerciseLibrary, ...extendedExerciseLibrary].filter((e) => !allIds.has(e.id));

    await Promise.all(
      missing.map((exercise) => {
        if (isAdmin) {
          return setDoc(doc(db, 'globalExercises', exercise.id), exercise);
        } else {
          return setDoc(doc(db, 'users', uid, 'privateExercises', exercise.id), exercise);
        }
      })
    );
  }, [uid, isAdmin, globalExercises, privateExercises]);

  // Fusión de ejercicios: globales primero, luego privados (sin duplicados)
  const allExercisesRaw = [
    ...defaultExerciseLibrary,
    ...extendedExerciseLibrary,
    ...globalExercises,
    ...privateExercises,
  ];

  // Eliminar duplicados por ID (prevalecen los que tengan imagen o los últimos de la lista)
  const exercisesMap = new Map();
  allExercisesRaw.forEach(ex => {
    const existing = exercisesMap.get(ex.id);
    // Si no existe, lo añadimos. 
    // Si ya existe, solo lo sobreescribimos si el nuevo tiene imagen y el viejo no, o si el nuevo es de una fuente más "fresca" (Firestore)
    if (!existing || (!existing.imageUrl && ex.imageUrl) || ex._source === 'global' || ex._source === 'private') {
      // Combinar propiedades para no perder la imageUrl si la tenemos localmente
      exercisesMap.set(ex.id, { ...existing, ...ex, imageUrl: ex.imageUrl || existing?.imageUrl });
    }
  });
  const exercises = Array.from(exercisesMap.values()).sort((a, b) => 
    (a.name || '').localeCompare(b.name || '')
  );

  // ---- Export / Import ----

  const exportData = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: 1,
      workoutState,
      privateExercises,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workoutState, privateExercises]);

  const importData = useCallback(async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.workoutState) throw new Error('Formato inválido');

      const mainRef = doc(db, 'users', uid, 'workoutData', 'main');
      await setDoc(mainRef, parsed.workoutState);

      // Restaurar ejercicios privados si los hay
      if (Array.isArray(parsed.privateExercises)) {
        await Promise.all(
          parsed.privateExercises.map((ex) =>
            setDoc(doc(db, 'users', uid, 'privateExercises', ex.id), ex)
          )
        );
      }

      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }, [uid]);

  return {
    workoutState,
    setWorkoutState,
    exercises,
    globalExercises,
    privateExercises,
    loading,
    addExercise,
    deleteExercise,
    restoreDefaultExercises,
    exportData,
    importData,
  };
}
