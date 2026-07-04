import React, { useMemo, useState } from 'react';
import { X, Search, Plus, Pencil, Eye, EyeOff, Trash2, ImageOff, Globe, RotateCcw } from 'lucide-react';
import { getMuscleImage } from '../../data/muscleImages';

const MUSCLE_GROUPS = ['Pectoral', 'Espalda', 'Piernas', 'Hombros', 'Brazos', 'Core', 'Cuello'];
const EQUIPMENT_OPTIONS = [
  'Barra', 'Mancuernas', 'Máquina', 'Polea', 'Peso corporal', 'Smith machine',
  'Kettlebell', 'Bandas elásticas', 'Balón medicinal', 'Fitball', 'Foam roller', 'Barra EZ', 'Otro',
];
const PAGE_SIZE = 60;

/**
 * Modal de creación/edición de un ejercicio global con preview de imagen.
 * Guarda en /globalExercises: si el id ya existe en el catálogo local (JS),
 * el documento actúa de override para todos los usuarios.
 */
function ExerciseFormModal({ initial, onSave, onClose }) {
  const [draft, setDraft] = useState({
    name: initial?.name || '',
    muscleGroup: initial?.muscleGroup || 'Pectoral',
    equipment: initial?.equipment || 'Barra',
    imageUrl: initial?.imageUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [imgError, setImgError] = useState(false);

  const set = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
    if (field === 'imageUrl') setImgError(false);
  };

  const handleSave = async () => {
    if (!draft.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        ...(initial?.id ? { id: initial.id } : {}),
        name: draft.name.trim(),
        muscleGroup: draft.muscleGroup,
        equipment: draft.equipment,
        imageUrl: draft.imageUrl.trim(),
      });
      onClose();
    } catch (err) {
      alert(`Error guardando: ${err.message}`);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-zinc-100">{initial?.id ? 'Editar ejercicio' : 'Nuevo ejercicio global'}</h3>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-white"><X size={18} /></button>
        </div>

        {/* Preview de imagen en vivo */}
        <div className="flex justify-center">
          {draft.imageUrl && !imgError ? (
            <img
              src={draft.imageUrl}
              alt="Preview"
              className="w-32 h-32 rounded-xl object-cover border border-zinc-700 bg-zinc-950"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-32 h-32 rounded-xl border border-dashed border-zinc-700 bg-zinc-950 flex flex-col items-center justify-center gap-1 text-zinc-600">
              <ImageOff size={22} />
              <span className="text-[10px]">{imgError ? 'URL no válida' : 'Sin imagen'}</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">Nombre</label>
            <input
              type="text"
              value={draft.name}
              onChange={set('name')}
              placeholder="Ej: Press de banca plano con barra"
              className="w-full bg-zinc-800 p-3 rounded-lg text-white text-sm outline-none border border-zinc-700 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Grupo muscular</label>
              <select
                value={draft.muscleGroup}
                onChange={set('muscleGroup')}
                className="w-full bg-zinc-800 p-3 rounded-lg text-white text-sm border border-zinc-700"
              >
                {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 block mb-1">Equipamiento</label>
              <select
                value={draft.equipment}
                onChange={set('equipment')}
                className="w-full bg-zinc-800 p-3 rounded-lg text-white text-sm border border-zinc-700"
              >
                {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                {!EQUIPMENT_OPTIONS.includes(draft.equipment) && (
                  <option value={draft.equipment}>{draft.equipment}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1">URL de la imagen</label>
            <input
              type="url"
              value={draft.imageUrl}
              onChange={set('imageUrl')}
              placeholder="https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/…/0.jpg"
              className="w-full bg-zinc-800 p-3 rounded-lg text-white text-xs outline-none border border-zinc-700 focus:border-brand-500 transition-all"
            />
            <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">
              Consejo: busca el ejercicio en{' '}
              <a href="https://github.com/yuhonas/free-exercise-db/tree/main/exercises" target="_blank" rel="noreferrer" className="text-brand-400 underline">
                free-exercise-db
              </a>{' '}
              y usa <code className="text-zinc-400">cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/NOMBRE/0.jpg</code>
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 p-3 text-zinc-400 bg-zinc-800 rounded-xl text-sm">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 p-3 text-zinc-950 bg-brand-500 font-bold rounded-xl text-sm disabled:opacity-50"
          >
            {saving ? 'Guardando…' : 'Guardar para todos'}
          </button>
        </div>
      </div>
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
 * - Filtros: búsqueda, grupo, equipamiento, sin foto, ocultos
 */
export default function AdminExercisesView({ exercises, onSaveGlobal, onDeleteGlobal, onRestoreAll, onClose }) {
  const [search, setSearch] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [equipFilter, setEquipFilter] = useState('all');
  const [onlyNoImage, setOnlyNoImage] = useState(false);
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [editing, setEditing] = useState(null); // null | 'NEW' | exercise
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const stats = useMemo(() => ({
    total: exercises.length,
    sinFoto: exercises.filter((e) => !e.imageUrl).length,
    ocultos: exercises.filter((e) => e.hidden).length,
    globales: exercises.filter((e) => e._source === 'global' && !e.hidden).length,
  }), [exercises]);

  const availableEquipment = useMemo(
    () => ['all', ...new Set(exercises.map((e) => e.equipment || 'Otro'))],
    [exercises]
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return exercises.filter((ex) => {
      if (ex._source === 'private') return false; // los privados de otros usuarios no se gestionan aquí
      if (onlyNoImage && ex.imageUrl) return false;
      if (onlyHidden && !ex.hidden) return false;
      if (groupFilter !== 'all' && ex.muscleGroup !== groupFilter) return false;
      if (equipFilter !== 'all' && (ex.equipment || 'Otro') !== equipFilter) return false;
      if (term && !(ex.name || '').toLowerCase().includes(term)) return false;
      return true;
    });
  }, [exercises, search, groupFilter, equipFilter, onlyNoImage, onlyHidden]);

  const shown = filtered.slice(0, visibleCount);

  const toggleHidden = async (ex) => {
    try {
      await onSaveGlobal({ id: ex.id, hidden: !ex.hidden });
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (ex) => {
    const msg = ex._bundled
      ? `"${ex.name}" es del catálogo base: se eliminarán tus cambios (override) y volverá a su versión original. ¿Continuar?`
      : `¿Eliminar "${ex.name}" del catálogo global para TODOS los usuarios? Esta acción no se puede deshacer.`;
    if (!window.confirm(msg)) return;
    try {
      await onDeleteGlobal(ex.id);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-zinc-950 text-white z-50 flex flex-col"
      style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Header */}
      <header className="px-4 pb-3 border-b border-zinc-800 space-y-3 [&>*]:mx-auto [&>*]:w-full [&>*]:max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Globe size={18} className="text-brand-400" /> Catálogo global
            </h2>
            <p className="text-[11px] text-zinc-500">Los cambios se aplican a todos los usuarios al instante</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white" aria-label="Cerrar panel">
            <X size={22} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ['Total', stats.total, null],
            ['Sin foto', stats.sinFoto, () => { setOnlyNoImage(!onlyNoImage); setOnlyHidden(false); setVisibleCount(PAGE_SIZE); }],
            ['Ocultos', stats.ocultos, () => { setOnlyHidden(!onlyHidden); setOnlyNoImage(false); setVisibleCount(PAGE_SIZE); }],
            ['Globales', stats.globales, null],
          ].map(([label, value, onClick]) => (
            <button
              key={label}
              onClick={onClick || undefined}
              disabled={!onClick}
              className={`rounded-xl border p-2 transition-colors ${
                (label === 'Sin foto' && onlyNoImage) || (label === 'Ocultos' && onlyHidden)
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-zinc-800 bg-zinc-900'
              } ${onClick ? 'cursor-pointer hover:border-zinc-600' : 'cursor-default'}`}
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
              className="w-full bg-zinc-900 pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none border border-zinc-800 focus:border-brand-500 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={groupFilter}
              onChange={(e) => { setGroupFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="bg-zinc-900 p-2 rounded-lg text-xs border border-zinc-800"
            >
              <option value="all">Todos los grupos</option>
              {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <select
              value={equipFilter}
              onChange={(e) => { setEquipFilter(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="bg-zinc-900 p-2 rounded-lg text-xs border border-zinc-800"
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
              ex.hidden ? 'border-zinc-800/60 bg-zinc-900/40 opacity-50' : 'border-zinc-800 bg-zinc-900'
            }`}
          >
            <img
              src={ex.imageUrl || getMuscleImage(ex.muscleGroup)}
              alt={ex.muscleGroup}
              loading="lazy"
              className="w-11 h-11 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
              onError={(e) => { e.target.onerror = null; e.target.src = getMuscleImage(ex.muscleGroup); }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{ex.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-[10px] text-zinc-500">{ex.muscleGroup} · {ex.equipment || 'Otro'}</span>
                {!ex.imageUrl && (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-amber-950/50 text-amber-500 border border-amber-800/50">sin foto</span>
                )}
                {ex._source === 'global' && !ex.hidden && (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-brand-950/50 text-brand-400 border border-brand-800/50">
                    {ex._bundled ? 'editado' : 'global'}
                  </span>
                )}
                {ex.hidden && (
                  <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-400">oculto</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <button onClick={() => setEditing(ex)} className="p-2 text-zinc-400 hover:text-brand-400 transition-colors" title="Editar">
                <Pencil size={15} />
              </button>
              <button onClick={() => toggleHidden(ex)} className="p-2 text-zinc-400 hover:text-amber-400 transition-colors" title={ex.hidden ? 'Volver a mostrar' : 'Ocultar para todos'}>
                {ex.hidden ? <Eye size={15} /> : <EyeOff size={15} />}
              </button>
              {ex._source === 'global' && (
                <button onClick={() => handleDelete(ex)} className="p-2 text-zinc-500 hover:text-red-400 transition-colors" title={ex._bundled ? 'Quitar cambios' : 'Eliminar'}>
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          </div>
        ))}

        {shown.length < filtered.length && (
          <button
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="w-full p-3 text-sm text-brand-400 bg-zinc-900 border border-zinc-800 rounded-xl font-semibold"
          >
            Mostrar más ({filtered.length - shown.length} restantes)
          </button>
        )}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-zinc-500 py-10">Nada que mostrar con esos filtros.</p>
        )}
      </div>

      {/* Footer acciones */}
      <footer className="px-4 py-3 border-t border-zinc-800 flex gap-2 justify-center [&>button:last-child]:max-w-2xl">
        <button
          onClick={() => {
            if (window.confirm('¿Restaurar el catálogo? Se volverán a mostrar todos los ejercicios ocultos.')) onRestoreAll();
          }}
          className="p-3 text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-xl"
          title="Mostrar todos los ocultos"
        >
          <RotateCcw size={16} />
        </button>
        <button
          onClick={() => setEditing('NEW')}
          className="flex-1 p-3 bg-brand-500 text-zinc-950 font-bold rounded-xl flex items-center justify-center gap-2 text-sm"
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
    </div>
  );
}
