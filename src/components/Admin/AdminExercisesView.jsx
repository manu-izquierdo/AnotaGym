import React, { useMemo, useRef, useState } from 'react';
import {
  X, Search, Plus, Pencil, Eye, EyeOff, Trash2, ImageOff, Globe, RotateCcw, Info, Sparkles, Loader2,
} from 'lucide-react';
import ConfirmDialog from '../UI/ConfirmDialog';
import ExerciseImage from '../UI/ExerciseImage';
import ExerciseDetailSheet from '../Exercises/ExerciseDetailSheet';
import {
  matchesSearch, MUSCLE_EN_TO_ES, MUSCLE_OPTIONS, LEVEL_OPTIONS, normalizeText,
} from '../../data/exerciseUtils';

const MUSCLE_GROUPS = ['Pectoral', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cardio', 'Cuello'];
const EQUIPMENT_OPTIONS = [
  'Barra', 'Mancuernas', 'Máquina', 'Polea', 'Peso corporal', 'Smith machine',
  'Kettlebell', 'Bandas elásticas', 'Balón medicinal', 'Fitball', 'Foam roller', 'Barra EZ', 'Otro',
];
const PAGE_SIZE = 60;
const FEDB_INDEX_URL = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';
const FEDB_CDN = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises';

// Índice de free-exercise-db: se descarga UNA vez por sesión de admin y solo si se usa el buscador de fotos
let fedbCache = null;
async function loadFedbIndex() {
  if (!fedbCache) {
    const res = await fetch(FEDB_INDEX_URL);
    if (!res.ok) throw new Error('No se pudo descargar el índice de fotos');
    fedbCache = await res.json();
  }
  return fedbCache;
}

/** Selector de músculos como chips con toques. */
function MuscleChips({ label, selected, onToggle, accent }) {
  return (
    <div>
      <label className="text-xs font-medium text-zinc-500 block mb-1.5">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {MUSCLE_OPTIONS.map((m) => {
          const on = selected.includes(m);
          return (
            <button
              key={m}
              type="button"
              onClick={() => onToggle(m)}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors border
                ${on
                  ? accent
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'bg-brand-500/15 border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400'}`}
            >
              {m}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Buscador visual de fotos en free-exercise-db (dominio público): busca por
 * nombre en inglés, muestra miniaturas y al elegir una rellena la URL y,
 * opcionalmente, los músculos y el nivel del ejercicio original.
 */
function PhotoFinder({ onPick, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timer = useRef(null);

  const runSearch = (term) => {
    clearTimeout(timer.current);
    setQuery(term);
    if (term.trim().length < 2) { setResults(null); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const index = await loadFedbIndex();
        const q = normalizeText(term);
        setResults(index.filter((e) => normalizeText(e.name).includes(q)).slice(0, 24));
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }, 350);
  };

  return (
    <div className="fixed inset-0 z-[75] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
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
              onChange={(e) => runSearch(e.target.value)}
              placeholder="Busca en inglés: bench press, squat…"
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-brand-500 text-zinc-900 dark:text-zinc-100 transition-all"
            />
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" aria-label="Cerrar buscador">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          {loading && (
            <p className="flex items-center justify-center gap-2 text-xs text-zinc-500 py-8">
              <Loader2 size={14} className="animate-spin" /> Buscando en free-exercise-db…
            </p>
          )}
          {error && <p className="text-xs font-semibold text-red-500 text-center py-6">{error}</p>}
          {!loading && results && results.length === 0 && (
            <p className="text-xs text-zinc-500 text-center py-8">Nada con ese nombre. Prueba en inglés y sin abreviar.</p>
          )}
          {!loading && !results && !error && (
            <p className="text-xs text-zinc-500 text-center py-8">
              873 ejercicios con 2 fotos cada uno, dominio público.<br />Escribe al menos 2 letras.
            </p>
          )}
          {!loading && results && results.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {results.map((e) => (
                <button
                  key={e.id}
                  onClick={() => onPick(e)}
                  className="text-left rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-zinc-50 dark:bg-zinc-950/40 hover:border-brand-500 transition-colors"
                >
                  <img
                    src={`${FEDB_CDN}/${e.id}/0.jpg`}
                    alt={e.name}
                    loading="lazy"
                    className="w-full aspect-[4/3] object-cover bg-white"
                  />
                  <p className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 p-2 leading-tight">{e.name}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Modal de creación/edición de un ejercicio global con preview animada. */
function ExerciseFormModal({ initial, onSave, onClose }) {
  const [draft, setDraft] = useState({
    name: initial?.name || '',
    muscleGroup: initial?.muscleGroup || 'Pectoral',
    equipment: initial?.equipment || 'Barra',
    imageUrl: initial?.imageUrl || '',
    description: initial?.description || '',
    level: initial?.level || 'Principiante',
    primaryMuscles: initial?.primaryMuscles || [],
    secondaryMuscles: initial?.secondaryMuscles || [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showFinder, setShowFinder] = useState(false);

  const set = (field) => (e) => setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  const toggleMuscle = (field) => (muscle) =>
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field].includes(muscle)
        ? prev[field].filter((m) => m !== muscle)
        : [...prev[field], muscle],
    }));

  const handlePickPhoto = (fedbExercise) => {
    setDraft((prev) => ({
      ...prev,
      imageUrl: `${FEDB_CDN}/${fedbExercise.id}/0.jpg`,
      // Solo autorrellenamos lo que esté vacío para no pisar el trabajo del admin
      primaryMuscles: prev.primaryMuscles.length
        ? prev.primaryMuscles
        : (fedbExercise.primaryMuscles || []).map((m) => MUSCLE_EN_TO_ES[m]).filter(Boolean),
      secondaryMuscles: prev.secondaryMuscles.length
        ? prev.secondaryMuscles
        : (fedbExercise.secondaryMuscles || []).map((m) => MUSCLE_EN_TO_ES[m]).filter(Boolean),
    }));
    setShowFinder(false);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        ...(initial?.id ? { id: initial.id } : {}),
        name: draft.name.trim(),
        muscleGroup: draft.muscleGroup,
        equipment: draft.equipment,
        imageUrl: draft.imageUrl.trim(),
        description: draft.description.trim(),
        level: draft.level,
        primaryMuscles: draft.primaryMuscles,
        secondaryMuscles: draft.secondaryMuscles,
      });
      onClose();
    } catch (err) {
      setError(`Error guardando: ${err.message}`);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/70 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-t-2xl sm:rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
            {initial?.id ? 'Editar ejercicio' : 'Nuevo ejercicio global'}
          </h3>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        {/* Preview animada en vivo (2 fotogramas si la URL es de free-exercise-db) */}
        <div className="flex justify-center">
          {draft.imageUrl ? (
            <ExerciseImage
              exercise={{ ...draft }}
              animate
              className="w-44 h-36 rounded-xl object-contain border border-zinc-200 dark:border-zinc-700 bg-white"
            />
          ) : (
            <div className="w-44 h-36 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center gap-1 text-zinc-400 dark:text-zinc-600">
              <ImageOff size={22} />
              <span className="text-[10px]">Sin imagen</span>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowFinder(true)}
          className="w-full p-2.5 rounded-xl text-sm font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/40 flex items-center justify-center gap-2"
        >
          <Sparkles size={15} /> Buscar foto en free-exercise-db
        </button>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Nombre</label>
            <input
              type="text"
              value={draft.name}
              onChange={set('name')}
              placeholder="Ej: Press de banca plano con barra"
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-zinc-900 dark:text-white text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-brand-500 transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Descripción corta</label>
            <textarea
              value={draft.description}
              onChange={set('description')}
              rows={3}
              placeholder="Qué es y un consejo de técnica. Se muestra al tocar el ejercicio."
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-zinc-900 dark:text-white text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-brand-500 transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Grupo</label>
              <select
                value={draft.muscleGroup}
                onChange={set('muscleGroup')}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg text-zinc-900 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700"
              >
                {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Material</label>
              <select
                value={draft.equipment}
                onChange={set('equipment')}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg text-zinc-900 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700"
              >
                {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                {!EQUIPMENT_OPTIONS.includes(draft.equipment) && (
                  <option value={draft.equipment}>{draft.equipment}</option>
                )}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Nivel</label>
              <select
                value={draft.level}
                onChange={set('level')}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-2.5 rounded-lg text-zinc-900 dark:text-white text-sm border border-zinc-200 dark:border-zinc-700"
              >
                {LEVEL_OPTIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>

          <MuscleChips
            label="Músculos principales"
            selected={draft.primaryMuscles}
            onToggle={toggleMuscle('primaryMuscles')}
          />
          <MuscleChips
            label="Músculos secundarios"
            selected={draft.secondaryMuscles}
            onToggle={toggleMuscle('secondaryMuscles')}
            accent
          />

          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">URL de la imagen</label>
            <input
              type="url"
              value={draft.imageUrl}
              onChange={(e) => setDraft((prev) => ({ ...prev, imageUrl: e.target.value }))}
              placeholder="Usa el buscador de arriba o pega una URL"
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-3 rounded-lg text-zinc-900 dark:text-white text-xs outline-none border border-zinc-200 dark:border-zinc-700 focus:border-brand-500 transition-all"
            />
          </div>
        </div>

        {error && <p className="text-xs font-semibold text-red-500 text-center">{error}</p>}

        <div className="flex gap-2 pt-1">
          <button
            onClick={onClose}
            className="flex-1 p-3 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 p-3 bg-brand-600 text-on-brand font-bold rounded-xl text-sm disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar para todos'}
          </button>
        </div>
      </div>

      {showFinder && <PhotoFinder onPick={handlePickPhoto} onClose={() => setShowFinder(false)} />}
    </div>
  );
}

/**
 * Panel de administración del catálogo global de ejercicios.
 * Solo visible para admins (y las reglas de Firestore validan cada escritura).
 *
 * - Editar cualquier ejercicio (incl. los del bundle: crea un override en /globalExercises)
 * - Ocultar/mostrar ejercicios del bundle (tombstone {hidden:true})
 * - Eliminar documentos globales (si es override, vuelve a la versión del bundle)
 * - Filtros: búsqueda, grupo, equipamiento, sin foto, sin descripción, ocultos
 */
export default function AdminExercisesView({ exercises, onSaveGlobal, onDeleteGlobal, onRestoreAll, onClose }) {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [equipFilter, setEquipFilter] = useState('all');
  const [onlyNoImage, setOnlyNoImage] = useState(false);
  const [onlyNoDesc, setOnlyNoDesc] = useState(false);
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'NEW' | exercise
  const [detail, setDetail] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const stats = useMemo(() => ({
    total: exercises.filter((e) => e._source !== 'private' && !e.hidden).length,
    sinFoto: exercises.filter((e) => e._source !== 'private' && !e.imageUrl).length,
    sinDesc: exercises.filter((e) => e._source !== 'private' && !e.description).length,
    ocultos: exercises.filter((e) => e.hidden).length,
  }), [exercises]);

  const availableEquipment = useMemo(
    () => ['all', ...new Set(exercises.map((e) => e.equipment || 'Otro'))],
    [exercises]
  );

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      if (ex._source === 'private') return false; // los privados de otros usuarios no se gestionan aquí
      if (onlyNoImage && ex.imageUrl) return false;
      if (onlyNoDesc && ex.description) return false;
      if (onlyHidden && !ex.hidden) return false;
      if (groupFilter !== 'all' && ex.muscleGroup !== groupFilter) return false;
      if (equipFilter !== 'all' && (ex.equipment || 'Otro') !== equipFilter) return false;
      if (!matchesSearch(ex, search)) return false;
      return true;
    });
  }, [exercises, search, groupFilter, equipFilter, onlyNoImage, onlyNoDesc, onlyHidden]);

  const shown = filtered.slice(0, visibleCount);

  const toggleHidden = async (ex) => {
    try {
      await onSaveGlobal({ id: ex.id, hidden: !ex.hidden });
    } catch (err) {
      setActionError(err.message);
    }
  };

  const statFilters = [
    ['Activos', stats.total, null, false],
    ['Sin foto', stats.sinFoto, () => { setOnlyNoImage(!onlyNoImage); setOnlyNoDesc(false); setOnlyHidden(false); setVisibleCount(PAGE_SIZE); }, onlyNoImage],
    ['Sin descr.', stats.sinDesc, () => { setOnlyNoDesc(!onlyNoDesc); setOnlyNoImage(false); setOnlyHidden(false); setVisibleCount(PAGE_SIZE); }, onlyNoDesc],
    ['Ocultos', stats.ocultos, () => { setOnlyHidden(!onlyHidden); setOnlyNoImage(false); setOnlyNoDesc(false); setVisibleCount(PAGE_SIZE); }, onlyHidden],
  ];

  return (
    <div
      className="fixed inset-0 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 z-50 flex flex-col"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <header className="px-4 pb-3 border-b border-zinc-200 dark:border-zinc-800 space-y-3 [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Globe size={18} className="text-brand-500" /> Catálogo global
            </h2>
            <p className="text-[11px] text-zinc-500">Los cambios se aplican a todos los usuarios al instante</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white" aria-label="Cerrar panel">
            <X size={22} />
          </button>
        </div>

        {/* Stats clicables como filtros */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {statFilters.map(([label, value, onClick, active]) => (
            <button
              key={label}
              onClick={onClick || undefined}
              disabled={!onClick}
              className={`rounded-xl border p-2 transition-colors ${
                active
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
              } ${onClick ? 'cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600' : 'cursor-default'}`}
            >
              <p className="text-lg font-black leading-tight">{value}</p>
              <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">{label}</p>
            </button>
          ))}
        </div>

        {/* Búsqueda y filtros */}
        <div className="space-y-2">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setVisibleCount(PAGE_SIZE); }}
              placeholder="Buscar ejercicio…"
              className="w-full bg-white dark:bg-zinc-900 pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none border border-zinc-200 dark:border-zinc-800 focus:border-brand-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={groupFilter}
              onChange={(e) => { setGroupFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800"
            >
              <option value="all">Todos los grupos</option>
              {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={equipFilter}
              onChange={(e) => { setEquipFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="bg-white dark:bg-zinc-900 p-2 rounded-lg text-xs border border-zinc-200 dark:border-zinc-800"
            >
              {availableEquipment.map((eq) => (
                <option key={eq} value={eq}>{eq === 'all' ? 'Todo el material' : eq}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-3xl">
        <p className="text-[11px] text-zinc-500 px-1">{filtered.length} resultados</p>

        {shown.map((ex) => (
          <div
            key={ex.id}
            className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
              ex.hidden
                ? 'border-zinc-200/60 dark:border-zinc-800/60 bg-white/50 dark:bg-zinc-900/40 opacity-50'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
            }`}
          >
            <button onClick={() => setDetail(ex)} className="shrink-0" aria-label={`Ver ficha de ${ex.name}`}>
              <ExerciseImage
                exercise={ex}
                className="w-14 h-14 rounded-lg object-cover bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800"
              />
            </button>
            <button onClick={() => setEditing(ex)} className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate">{ex.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] text-zinc-500">{ex.muscleGroup} · {ex.equipment || 'Otro'}</span>
                {!ex.imageUrl && (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-500 border border-amber-500/40">sin foto</span>
                )}
                {!ex.description && (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/40">sin descr.</span>
                )}
                {ex._source === 'global' && !ex.hidden && (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/40">
                    {ex._bundled ? 'editado' : 'global'}
                  </span>
                )}
                {ex.hidden && (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">oculto</span>
                )}
              </div>
            </button>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => setDetail(ex)} className="p-2 text-zinc-400 hover:text-brand-500 transition-colors" title="Ver ficha">
                <Info size={15} />
              </button>
              <button onClick={() => setEditing(ex)} className="p-2 text-zinc-400 hover:text-brand-500 transition-colors" title="Editar">
                <Pencil size={15} />
              </button>
              <button onClick={() => toggleHidden(ex)} className="p-2 text-zinc-400 hover:text-amber-500 transition-colors" title={ex.hidden ? 'Volver a mostrar' : 'Ocultar para todos'}>
                {ex.hidden ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              {ex._source === 'global' && (
                <button onClick={() => setConfirmDelete(ex)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors" title={ex._bundled ? 'Quitar cambios' : 'Eliminar'}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}

        {shown.length < filtered.length && (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="w-full p-3 text-sm text-brand-600 dark:text-brand-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold"
          >
            Mostrar más ({filtered.length - shown.length} restantes)
          </button>
        )}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-10">Nada que mostrar con esos filtros.</p>
        )}
      </div>

      {/* Footer acciones */}
      <footer className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 justify-center [&>button:last-child]:max-w-2xl">
        <button
          onClick={() => setConfirmRestore(true)}
          className="p-3 text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl"
          title="Mostrar todos los ocultos"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setEditing('NEW')}
          className="flex-1 p-3 bg-brand-600 text-on-brand font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
        >
          <Plus size={16} strokeWidth={3} /> Nuevo ejercicio global
        </button>
      </footer>

      {editing && (
        <ExerciseFormModal
          initial={editing === 'NEW' ? null : editing}
          onSave={onSaveGlobal}
          onClose={() => setEditing(null)}
        />
      )}

      {detail && <ExerciseDetailSheet exercise={detail} onClose={() => setDetail(null)} />}

      {confirmDelete && (
        <ConfirmDialog
          title={confirmDelete._bundled ? 'Quitar cambios' : 'Eliminar ejercicio'}
          message={confirmDelete._bundled
            ? `"${confirmDelete.name}" es del catálogo base: se eliminarán tus cambios y volverá a su versión original.`
            : `¿Eliminar "${confirmDelete.name}" del catálogo global para TODOS los usuarios? Esta acción no se puede deshacer.`}
          confirmLabel={confirmDelete._bundled ? 'Quitar cambios' : 'Eliminar'}
          danger
          onConfirm={async () => {
            const ex = confirmDelete;
            setConfirmDelete(null);
            try {
              await onDeleteGlobal(ex.id);
            } catch (err) {
              setActionError(err.message);
            }
          }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {confirmRestore && (
        <ConfirmDialog
          title="Restaurar catálogo"
          message="Se volverán a mostrar todos los ejercicios ocultos para todos los usuarios."
          confirmLabel="Restaurar"
          onConfirm={() => { setConfirmRestore(false); onRestoreAll(); }}
          onCancel={() => setConfirmRestore(false)}
        />
      )}

      {actionError && (
        <ConfirmDialog
          title="Error"
          message={actionError}
          confirmLabel="Entendido"
          cancelLabel={null}
          onConfirm={() => setActionError(null)}
          onCancel={() => setActionError(null)}
        />
      )}
    </div>
  );
}
