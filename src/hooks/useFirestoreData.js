import { useState, useEffect, useCallback, useRef } from 'react';
import {
  doc,
  onSnapshot,
  setDoc,
  collection,
  deleteDoc,
  getDocs,
  writeBatch,
  deleteField,
} from 'firebase/firestore';
import { db } from '../firebase';
import { defaultExerciseLibrary } from '../data/exerciseLibrary';
import { generateUUID } from '../utils/uuid';

const DEFAULT_WORKOUT_STATE = {
  routineTemplates: [],
  activeSession: null,
  bodyMetrics: [],
  preferences: { theme: 'dark', unit: 'kg', accentColor: 'terracota' },
};

// Firestore limita los batches a 500 operaciones
const BATCH_LIMIT = 400;

/**
 * Hook que sincroniza el estado de entrenamiento con Firestore.
 *
 * Estructura en Firestore:
 *   /users/{uid}/workoutData/main          — rutinas, sesión activa, métricas, preferencias
 *   /users/{uid}/sessions/{sessionId}      — UNA sesión completada por documento
 *   /users/{uid}/privateExercises/{id}     — ejercicios privados del usuario
 *   /globalExercises/{id}                  — ejercicios globales (solo admin escribe)
 *
 * Las sesiones completadas vivían antes como array dentro de workoutData/main
 * (límite de 1 MB por documento → ~450 sesiones y la cuenta dejaba de guardar).
 * Ahora cada sesión es su propio documento y este hook migra el formato viejo
 * de forma perezosa e idempotente: si el doc principal trae un array
 * `completedSessions` no vacío, se copia a la subcolección y se elimina del doc.
 *
 * Hacia fuera NADA cambia: el hook expone `workoutState.completedSessions`
 * (ensamblado desde la subcolección, orden cronológico) igual que siempre.
 */
export default function useFirestoreData(uid, isAdmin) {
  const [workoutState, setWorkoutStateLocal] = useState(DEFAULT_WORKOUT_STATE);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [globalExercises, setGlobalExercises] = useState([]);
  const [privateExercises, setPrivateExercises] = useState([]);
  const [mainLoaded, setMainLoaded] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  // Ref para evitar escrituras a Firestore de cambios que vienen de Firestore
  const isRemoteUpdate = useRef(false);
  // Copia siempre actual de las sesiones para usarla en callbacks sin re-crearlos
  const sessionsRef = useRef([]);
  sessionsRef.current = completedSessions;
  const migrating = useRef(false);

  // ---- Migración perezosa del formato antiguo ----
  // Copia el array legacy a /users/{uid}/sessions y lo borra del doc principal.
  // Idempotente: los ids se conservan, re-ejecutarla solo sobreescribe iguales.
  const migrateLegacySessions = useCallback(async (legacySessions) => {
    if (migrating.current || !legacySessions?.length) return;
    migrating.current = true;
    try {
      for (let i = 0; i < legacySessions.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        legacySessions.slice(i, i + BATCH_LIMIT).forEach((session) => {
          const id = session.id || generateUUID();
          batch.set(doc(db, 'users', uid, 'sessions', id), { ...session, id });
        });
        await batch.commit();
      }
      // Solo si TODO se copió bien se retira el array del doc principal.
      await setDoc(
        doc(db, 'users', uid, 'workoutData', 'main'),
        { completedSessions: deleteField(), sessionsMigrated: true },
        { merge: true }
      );
      console.info(`Migradas ${legacySessions.length} sesiones a la subcolección.`);
    } catch (err) {
      console.error('Error migrando sesiones al formato nuevo:', err);
    } finally {
      migrating.current = false;
    }
  }, [uid]);

  // ---- Listeners de Firestore ----

  // 1. Datos principales (rutinas, sesión activa, métricas, prefs)
  useEffect(() => {
    if (!uid) return;
    const mainRef = doc(db, 'users', uid, 'workoutData', 'main');

    const unsub = onSnapshot(mainRef, (snap) => {
      isRemoteUpdate.current = true;
      if (snap.exists()) {
        const data = snap.data();
        // Formato antiguo detectado → migrar (también se auto-repara si una
        // versión vieja de la app volviera a escribir el array).
        if (Array.isArray(data.completedSessions) && data.completedSessions.length > 0) {
          migrateLegacySessions(data.completedSessions);
        }
        const { completedSessions: _legacy, ...mainData } = data;
        setWorkoutStateLocal({ ...DEFAULT_WORKOUT_STATE, ...mainData });
      } else {
        // Primera vez — inicializar documento
        setDoc(mainRef, { ...DEFAULT_WORKOUT_STATE, sessionsMigrated: true });
      }
      setMainLoaded(true);
      // Permitir escrituras locales de nuevo en el próximo tick
      setTimeout(() => { isRemoteUpdate.current = false; }, 0);
    }, (err) => {
      console.error('Firestore main listener error:', err);
      setMainLoaded(true);
    });

    return unsub;
  }, [uid, migrateLegacySessions]);

  // 1b. Sesiones completadas (una por documento, orden cronológico)
  useEffect(() => {
    if (!uid) return;
    const sessionsCol = collection(db, 'users', uid, 'sessions');

    const unsub = onSnapshot(sessionsCol, (snap) => {
      const sessions = snap.docs
        .map((d) => ({ ...d.data(), id: d.id }))
        .sort((a, b) => new Date(a.finishedAt || 0) - new Date(b.finishedAt || 0));
      setCompletedSessions(sessions);
      setSessionsLoaded(true);
    }, (err) => {
      console.error('Firestore sessions listener error:', err);
      setSessionsLoaded(true);
    });

    return unsub;
  }, [uid]);

  const loading = !mainLoaded || !sessionsLoaded;

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
        // Las sesiones completadas viven en su subcolección: nunca deben
        // volver a escribirse dentro del doc principal (límite de 1 MB).
        const { completedSessions: _cs, ...mainData } = next;
        setDoc(mainRef, mainData, { merge: true }).catch((err) =>
          console.error('Error saving to Firestore:', err)
        );
      }, 800);

      return next;
    });
  }, [uid]);

  // ---- Sesiones completadas (una por documento) ----

  /** Guarda una sesión completada (nueva o corregida). */
  const saveSession = useCallback(async (session) => {
    const id = session.id || generateUUID();
    await setDoc(doc(db, 'users', uid, 'sessions', id), { ...session, id });
    return id;
  }, [uid]);

  /** Elimina una sesión completada. */
  const deleteSession = useCallback(async (sessionId) => {
    await deleteDoc(doc(db, 'users', uid, 'sessions', sessionId));
  }, [uid]);

  // ---- Gestión de ejercicios ----

  /**
   * Añade un ejercicio PERSONAL a /users/{uid}/privateExercises (solo lo ve
   * el usuario, admin incluido). Los ejercicios globales se crean únicamente
   * desde el panel de administración con saveGlobalExercise — así crear un
   * ejercicio rápido desde una rutina nunca toca el catálogo de todos.
   */
  const addExercise = useCallback(async (exerciseData) => {
    const exercise = {
      id: generateUUID(),
      name: exerciseData.name.trim(),
      muscleGroup: exerciseData.muscleGroup.trim(),
      equipment: exerciseData.equipment || 'Custom',
      ...(exerciseData.imageUrl ? { imageUrl: exerciseData.imageUrl.trim() } : {}),
    };

    const privateRef = doc(db, 'users', uid, 'privateExercises', exercise.id);
    await setDoc(privateRef, exercise);

    return exercise.id;
  }, [uid]);

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

    // Limpiar referencias en rutinas y sesión activa
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
    }));

    // Limpiar referencias en las sesiones completadas afectadas (subcolección)
    const affected = sessionsRef.current.filter((s) =>
      s.exercises?.some((e) => e.exerciseId === exerciseId)
    );
    for (let i = 0; i < affected.length; i += BATCH_LIMIT) {
      const batch = writeBatch(db);
      affected.slice(i, i + BATCH_LIMIT).forEach((s) => {
        batch.set(doc(db, 'users', uid, 'sessions', s.id), {
          ...s,
          exercises: s.exercises.filter((e) => e.exerciseId !== exerciseId),
        });
      });
      await batch.commit();
    }
  }, [uid, isAdmin, globalExercises, privateExercises, setWorkoutState]);

  /**
   * Restaura el catálogo de fábrica (el del bundle JS).
   * Admin → borra TODOS los docs de /globalExercises: tombstones {hidden:true},
   * overrides de ejercicios del bundle y altas globales del admin.
   * Usuario → vacía su lista personal de ocultos.
   */
  const restoreDefaultExercises = useCallback(async () => {
    if (isAdmin) {
      await Promise.all(globalExercises.map((e) => deleteDoc(doc(db, 'globalExercises', e.id))));
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

  defaultExerciseLibrary.forEach((ex) => {
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
  // El formato del archivo NO cambia: workoutState.completedSessions sigue
  // siendo un array en el JSON. Los backups viejos importan sin problema.

  const exportData = useCallback(() => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: 1,
      workoutState: { ...workoutState, completedSessions },
      privateExercises,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [workoutState, completedSessions, privateExercises]);

  const importData = useCallback(async (jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (!parsed.workoutState) throw new Error('Formato inválido');

      const { completedSessions: importedSessions, ...mainState } = parsed.workoutState;

      // Importar reemplaza TODO (comportamiento de siempre): también las
      // sesiones actuales de la subcolección se sustituyen por las del archivo.
      const existing = await getDocs(collection(db, 'users', uid, 'sessions'));
      const toDelete = existing.docs.map((d) => d.ref);
      for (let i = 0; i < toDelete.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        toDelete.slice(i, i + BATCH_LIMIT).forEach((ref) => batch.delete(ref));
        await batch.commit();
      }

      const sessions = Array.isArray(importedSessions) ? importedSessions : [];
      for (let i = 0; i < sessions.length; i += BATCH_LIMIT) {
        const batch = writeBatch(db);
        sessions.slice(i, i + BATCH_LIMIT).forEach((session) => {
          const id = session.id || generateUUID();
          batch.set(doc(db, 'users', uid, 'sessions', id), { ...session, id });
        });
        await batch.commit();
      }

      const mainRef = doc(db, 'users', uid, 'workoutData', 'main');
      await setDoc(mainRef, { ...mainState, sessionsMigrated: true });

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
    // Hacia los componentes el estado luce como siempre: con completedSessions
    workoutState: { ...workoutState, completedSessions },
    setWorkoutState,
    saveSession,
    deleteSession,
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
