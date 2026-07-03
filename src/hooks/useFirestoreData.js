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
      ...(exerciseData.imageUrl ? { imageUrl: exerciseData.imageUrl.trim() } : {}),
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
   * (Solo admin) Crea o edita un ejercicio en /globalExercises.
   * Si el id coincide con uno del catálogo local (JS), el documento actúa de
   * override: el merge de abajo da prioridad a Firestore, así el admin puede
   * corregir nombre/grupo/equipo/foto de cualquier ejercicio para todos.
   */
  const saveGlobalExercise = useCallback(async (exercise) => {
    if (!isAdmin) throw new Error('Solo un admin puede editar el catálogo global');
    // Quitar campos internos del cliente (_source, _bundled) antes de escribir
    const { _source, _bundled, ...data } = exercise;
    const id = data.id || generateUUID();
    await setDoc(doc(db, 'globalExercises', id), { ...data, id }, { merge: true });
    return id;
  }, [isAdmin]);

  /**
   * Elimina un ejercicio. Si es global y admin, lo borra de /globalExercises.
   * Si es privado, lo borra de /users/{uid}/privateExercises.
   * También limpia referencias en rutinas y sesiones completadas.
   */
  const deleteExercise = useCallback(async (exerciseId) => {
    const isGlobal = globalExercises.some((e) => e.id === exerciseId);
    const isPrivate = privateExercises.some((e) => e.id === exerciseId);

    if (isGlobal && isAdmin) {
      await deleteDoc(doc(db, 'globalExercises', exerciseId));
    } else if (isPrivate) {
      await deleteDoc(doc(db, 'users', uid, 'privateExercises', exerciseId));
    } else if (isAdmin) {
      // Ejercicio del catálogo local (JS): no se puede borrar del bundle,
      // se marca oculto en Firestore y las listas lo filtran para todos.
      // No se limpian referencias: el historial de los usuarios sigue intacto.
      await setDoc(doc(db, 'globalExercises', exerciseId), { id: exerciseId, hidden: true }, { merge: true });
      return;
    } else {
      // Usuario normal ocultando un ejercicio del catálogo: lista personal
      setWorkoutState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          hiddenExercises: [...new Set([...(prev.preferences?.hiddenExercises || []), exerciseId])],
        },
      }));
      return;
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
  }, [uid, isAdmin, globalExercises, privateExercises, setWorkoutState]);

  /**
   * Restaura el catálogo por defecto: quita los ocultados.
   * Admin → borra los tombstones {hidden:true} de /globalExercises (para todos).
   * Usuario → vacía su lista personal de ocultos.
   * (El catálogo base vive en el bundle JS, no hace falta copiarlo a Firestore.)
   */
  const restoreDefaultExercises = useCallback(async () => {
    if (isAdmin) {
      const tombstones = globalExercises.filter((e) => e.hidden);
      await Promise.all(tombstones.map((e) => deleteDoc(doc(db, 'globalExercises', e.id))));
    }
    setWorkoutState((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, hiddenExercises: [] },
    }));
  }, [isAdmin, globalExercises, setWorkoutState]);

  // ---- Fusión de catálogos ----
  // Catálogo local (JS) + globales (Firestore, prevalecen: el admin puede
  // corregir cualquier entrada con un doc del mismo id) + privados del usuario.
  const hiddenByUser = new Set(workoutState.preferences?.hiddenExercises || []);
  const bundledIds = new Set();
  const exercisesMap = new Map();

  [...defaultExerciseLibrary, ...extendedExerciseLibrary].forEach((ex) => {
    bundledIds.add(ex.id);
    exercisesMap.set(ex.id, { ...ex, _bundled: true });
  });
  [...globalExercises, ...privateExercises].forEach((ex) => {
    const existing = exercisesMap.get(ex.id);
    // Firestore pisa al bundle, pero conservamos la imageUrl local si el doc no trae una
    exercisesMap.set(ex.id, {
      ...existing,
      ...ex,
      imageUrl: ex.imageUrl || existing?.imageUrl,
      _bundled: bundledIds.has(ex.id),
    });
  });

  // `hidden` unifica el tombstone global y la lista personal del usuario.
  // OJO: los ocultos NO se eliminan de la lista — siguen resolviendo nombre e
  // imagen en historial y sesiones; los selectores/listas filtran !ex.hidden.
  const exercises = Array.from(exercisesMap.values())
    .map((ex) => (hiddenByUser.has(ex.id) ? { ...ex, hidden: true } : ex))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

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
    saveGlobalExercise,
    deleteExercise,
    restoreDefaultExercises,
    exportData,
    importData,
  };
}
