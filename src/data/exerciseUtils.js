// Utilidades compartidas del catálogo de ejercicios.

/**
 * Fotogramas de un ejercicio. free-exercise-db publica 2 fotos por ejercicio
 * (…/0.jpg posición inicial y …/1.jpg final): si la URL sigue ese patrón se
 * devuelven ambas y la UI puede animarlas. Un doc de Firestore puede traer su
 * propio array `images` (p. ej. una foto única subida por el admin).
 */
export function getExerciseFrames(exercise) {
  if (!exercise) return [];
  if (Array.isArray(exercise.images) && exercise.images.length > 0) return exercise.images;
  const url = exercise.imageUrl;
  if (!url) return [];
  const match = url.match(/^(.*\/)0(\.(?:jpg|jpeg|png|webp))$/i);
  return match ? [url, `${match[1]}1${match[2]}`] : [url];
}

/** Búsqueda insensible a acentos: "jalon" encuentra "Jalón". */
export function normalizeText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function matchesSearch(exercise, term) {
  if (!term) return true;
  return normalizeText(exercise?.name).includes(normalizeText(term));
}

/**
 * Músculos del catálogo (español) → zonas del modelo corporal de
 * react-body-highlighter. Algunos músculos cubren varias zonas del dibujo.
 */
export const MUSCLE_TO_MODEL = {
  Pectoral: ['chest'],
  Hombros: ['front-deltoids', 'back-deltoids'],
  Tríceps: ['triceps'],
  Bíceps: ['biceps'],
  Antebrazos: ['forearm'],
  Dorsales: ['upper-back'],
  'Espalda media': ['upper-back'],
  Lumbares: ['lower-back'],
  Trapecios: ['trapezius'],
  Cuello: ['neck'],
  Cuádriceps: ['quadriceps'],
  Isquiotibiales: ['hamstring'],
  Glúteos: ['gluteal'],
  Gemelos: ['calves', 'left-soleus', 'right-soleus'],
  Abductores: ['abductors'],
  Aductores: ['adductor'],
  Abdominales: ['abs', 'obliques'],
};

/** Músculos de free-exercise-db (inglés) → nombres del catálogo en español. */
export const MUSCLE_EN_TO_ES = {
  abdominals: 'Abdominales', hamstrings: 'Isquiotibiales', adductors: 'Aductores',
  quadriceps: 'Cuádriceps', biceps: 'Bíceps', shoulders: 'Hombros', chest: 'Pectoral',
  'middle back': 'Espalda media', calves: 'Gemelos', glutes: 'Glúteos',
  'lower back': 'Lumbares', lats: 'Dorsales', triceps: 'Tríceps', traps: 'Trapecios',
  forearms: 'Antebrazos', neck: 'Cuello', abductors: 'Abductores',
};

export const MUSCLE_OPTIONS = Object.keys(MUSCLE_TO_MODEL);

export const LEVEL_OPTIONS = ['Principiante', 'Intermedio', 'Avanzado'];

export function musclesToModelZones(muscles = []) {
  const zones = new Set();
  muscles.forEach((m) => (MUSCLE_TO_MODEL[m] || []).forEach((z) => zones.add(z)));
  return Array.from(zones);
}
