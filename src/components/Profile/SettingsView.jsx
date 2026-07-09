import React, { useMemo, useRef, useState, lazy, Suspense } from 'react';
import { Card, Button, Input } from '../UI/Card';
import { PALETTES, resolvePaletteId } from '../../theme/palettes';
import {
  Download, Upload, Dumbbell, Shield, Plus, Search, Eye, EyeOff,
  Palette, Timer, Database, ChevronRight, ChevronLeft, BookOpen,
} from 'lucide-react';
import { getMuscleImage } from '../../data/muscleImages';
import TrainingGuideView from './TrainingGuideView';
import ConfirmDialog from '../UI/ConfirmDialog';

// Solo lo cargan los admins al abrir el panel — fuera del bundle principal
const AdminExercisesView = lazy(() => import('../Admin/AdminExercisesView'));

// ─── Piezas del menú (estilo ajustes de iOS/WhatsApp) ───────────────────────

function MenuRow({ icon: Icon, color, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
    >
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
        <Icon size={16} className="text-white" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</span>
        {subtitle && <span className="block text-xs text-zinc-500 line-clamp-2 mt-0.5">{subtitle}</span>}
      </span>
      <ChevronRight size={17} className="text-zinc-300 dark:text-zinc-600 shrink-0" />
    </button>
  );
}

function MenuGroup({ label, children }) {
  return (
    <div className="space-y-1.5">
      {label && (
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2">{label}</p>
      )}
      <Card className="p-0 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
        {children}
      </Card>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${checked ? 'bg-brand-600' : 'bg-zinc-300 dark:bg-zinc-700'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
    </button>
  );
}

function ToggleRow({ title, desc, checked, onChange }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</p>
        <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function SubviewHeader({ title, onBack }) {
  return (
    <div className="flex items-center gap-1 mb-4">
      <button
        type="button"
        onClick={onBack}
        className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-label="Volver a Ajustes"
      >
        <ChevronLeft size={22} />
      </button>
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{title}</h2>
    </div>
  );
}

// ─── Vista principal ─────────────────────────────────────────────────────────

export default function SettingsView({
  exercises,
  preferences,
  onSavePreferences,
  onDeleteExercise,
  onCreateExercise,
  onSaveGlobalExercise,
  onRestoreExercises,
  onExportData,
  onImportData,
  user,
  isAdmin,
}) {
  const safePreferences = preferences || { theme: 'dark', unit: 'kg' };
  const safeExercises = exercises || [];

  const [subview, setSubview] = useState(null); // null | 'appearance' | 'training' | 'guide' | 'myExercises' | 'catalog' | 'data'
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
  const [importMsg, setImportMsg] = useState(null); // { ok, text }
  const [importLoading, setImportLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [showOnlyHidden, setShowOnlyHidden] = useState(false);
  const [customRest, setCustomRest] = useState('');
  const [confirmDeleteExercise, setConfirmDeleteExercise] = useState(null); // ejercicio propio a borrar
  const [confirmRestoreHidden, setConfirmRestoreHidden] = useState(false);
  const fileInputRef = useRef(null);

  const myExercises = useMemo(
    () => safeExercises.filter((ex) => ex._source === 'private'),
    [safeExercises]
  );

  // Ocultos por ESTE usuario (lista personal, reversible). Los ocultos por el
  // admin (tombstone global) no se muestran en el buscador.
  const hiddenByMe = useMemo(
    () => new Set(safePreferences.hiddenExercises || []),
    [safePreferences.hiddenExercises]
  );

  const catalogResults = useMemo(() => {
    const pool = safeExercises.filter(
      (ex) => ex._source !== 'private' && (!ex.hidden || hiddenByMe.has(ex.id))
    );
    if (showOnlyHidden) return pool.filter((ex) => hiddenByMe.has(ex.id));
    const q = catalogQuery.trim().toLowerCase();
    if (q.length < 2) return null; // aún no se busca
    return pool
      .filter((ex) =>
        (ex.name || '').toLowerCase().includes(q) ||
        (ex.muscleGroup || '').toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [safeExercises, hiddenByMe, catalogQuery, showOnlyHidden]);

  const toggleHidden = (id) => {
    const next = hiddenByMe.has(id)
      ? [...hiddenByMe].filter((x) => x !== id)
      : [...hiddenByMe, id];
    onSavePreferences({ hiddenExercises: next });
  };

  const handleCreateExerciseSubmit = async () => {
    if (!newExerciseName.trim() || !newExerciseMuscle.trim()) return;
    await onCreateExercise({ name: newExerciseName, muscleGroup: newExerciseMuscle });
    setNewExerciseName('');
    setNewExerciseMuscle('');
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportLoading(true);
    setImportMsg(null);
    try {
      const text = await file.text();
      const result = await onImportData(text);
      setImportMsg(result.ok
        ? { ok: true, text: 'Datos importados correctamente' }
        : { ok: false, text: result.message });
    } catch {
      setImportMsg({ ok: false, text: 'Error al leer el archivo' });
    }
    setImportLoading(false);
    e.target.value = '';
  };

  const paletteId = resolvePaletteId(safePreferences.accentColor);
  const accentName = PALETTES[paletteId].name;
  // Las muestras del selector se enseñan en el modo que el usuario está viendo
  const viewingDark = safePreferences.theme === 'system'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : safePreferences.theme !== 'light';
  const themeName = { light: 'Claro', system: 'Sistema' }[safePreferences.theme] || 'Oscuro';
  const restLabel = (safePreferences.defaultRestTimer ?? 90) === 0
    ? 'descanso off'
    : `descanso ${safePreferences.defaultRestTimer ?? 90}s`;

  // Resumen completo para leer los ajustes de un vistazo sin entrar
  const effortLabel = { rir: 'RIR', rpe: 'RPE', off: 'esfuerzo off' }[safePreferences.effortMode || 'off'];
  const trainingSummary = [
    restLabel,
    safePreferences.unit || 'kg',
    effortLabel,
    `RM ${safePreferences.showRmEstimates === true ? 'on' : 'off'}`,
    `discos ${safePreferences.plateCalculator === true ? 'on' : 'off'}`,
  ].join(' · ');

  // ─── Subvistas ────────────────────────────────────────────────────────────

  if (subview === 'appearance') {
    return (
      <div className="p-4 pb-10">
        <SubviewHeader title="Apariencia" onBack={() => setSubview(null)} />
        <Card className="space-y-5">
          <div>
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-2">Tema</h3>
            <div className="flex gap-2">
              <Button
                variant={safePreferences.theme === 'dark' ? 'primary' : 'secondary'}
                className="h-10 text-sm"
                onClick={() => onSavePreferences({ theme: 'dark' })}
              >
                Oscuro
              </Button>
              <Button
                variant={safePreferences.theme === 'light' ? 'primary' : 'secondary'}
                className="h-10 text-sm"
                onClick={() => onSavePreferences({ theme: 'light' })}
              >
                Claro
              </Button>
              <Button
                variant={safePreferences.theme === 'system' ? 'primary' : 'secondary'}
                className="h-10 text-sm"
                onClick={() => onSavePreferences({ theme: 'system' })}
              >
                Sistema
              </Button>
            </div>
            {safePreferences.theme === 'system' && (
              <p className="text-xs text-zinc-500 mt-2">
                La app seguirá el modo claro u oscuro de tu dispositivo, y cambiará sola si el sistema cambia.
              </p>
            )}
          </div>

          <div>
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-1">Paleta de color</h3>
            <p className="text-xs text-zinc-500 mb-3">
              Cada paleta tiene su versión clara y oscura: cambia con el tema que tengas elegido.
            </p>
            <div className="space-y-2">
              {Object.entries(PALETTES).map(([key, palette]) => {
                const spec = viewingDark ? palette.dark : palette.light;
                const isActive = paletteId === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSavePreferences({ accentColor: key })}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl border-2 transition-all text-left
                      ${isActive
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                  >
                    <span className="flex shrink-0 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700">
                      {[spec.bg, spec.primary, spec.accent, spec.text].map((c, i) => (
                        <span key={i} className="w-5 h-8" style={{ backgroundColor: c }} />
                      ))}
                    </span>
                    <span className={`text-xs font-semibold ${isActive ? 'text-brand-700 dark:text-brand-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                      {palette.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (subview === 'training') {
    const currentRest = safePreferences.defaultRestTimer ?? 90;
    const restPresets = [0, 60, 90, 120, 180];
    const isCustomRest = !restPresets.includes(currentRest);
    const customRestValue = parseInt(customRest, 10);
    const customRestValid = Number.isFinite(customRestValue) && customRestValue >= 5 && customRestValue <= 900;

    return (
      <div className="p-4 pb-10 space-y-4">
        <SubviewHeader title="Entrenamiento" onBack={() => setSubview(null)} />
        <Card className="space-y-5">
          <div>
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-2">Descanso automático</h3>
            <div className="flex gap-2">
              {restPresets.map(secs => {
                const isSelected = currentRest === secs;
                return (
                  <Button
                    key={secs}
                    variant={isSelected ? 'primary' : 'secondary'}
                    className={`h-10 text-sm flex-1 font-bold ${secs === 0 ? 'text-xs' : ''}`}
                    onClick={() => onSavePreferences({ defaultRestTimer: secs })}
                  >
                    {secs === 0 ? 'Off' : `${secs}s`}
                  </Button>
                );
              })}
            </div>

            {/* Segundos a mano, para descansos fuera de los presets */}
            <div className="flex gap-2 mt-2">
              <Input
                type="number"
                min="5"
                max="900"
                placeholder="Otro (segundos, ej. 10)"
                value={customRest}
                onChange={(e) => setCustomRest(e.target.value)}
                className="py-2 text-sm flex-1"
              />
              <button
                type="button"
                disabled={!customRestValid}
                onClick={() => { onSavePreferences({ defaultRestTimer: customRestValue }); setCustomRest(''); }}
                className="px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-on-brand text-sm font-bold transition-all active:scale-[0.97] disabled:opacity-40"
              >
                OK
              </button>
            </div>
            {isCustomRest && (
              <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 mt-2">
                Actual: {currentRest}s (personalizado)
              </p>
            )}
            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
              El temporizador se activará automáticamente al marcar una serie como completada.
            </p>
            <div className="mt-3">
              <ToggleRow
                title="Aviso al terminar el descanso"
                desc="Pitido (y vibración donde el móvil lo permita) cuando el timer llegue a 0. Necesitas la app abierta y el sonido del móvil activado."
                checked={safePreferences.restTimerSound !== false}
                onChange={(v) => onSavePreferences({ restTimerSound: v })}
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-2">Unidades de peso</h3>
            <div className="flex gap-2">
              <Button
                variant={safePreferences.unit === 'kg' ? 'primary' : 'secondary'}
                className="h-10 text-sm"
                onClick={() => onSavePreferences({ unit: 'kg' })}
              >
                Kilogramos
              </Button>
              <Button
                variant={safePreferences.unit === 'lb' ? 'primary' : 'secondary'}
                className="h-10 text-sm"
                onClick={() => onSavePreferences({ unit: 'lb' })}
              >
                Libras
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-2">Esfuerzo por serie</h3>
            <div className="flex gap-2">
              {[
                { id: 'rir', label: 'RIR' },
                { id: 'rpe', label: 'RPE' },
                { id: 'off', label: 'No anotar' },
              ].map(({ id, label }) => (
                <Button
                  key={id}
                  variant={(safePreferences.effortMode || 'off') === id ? 'primary' : 'secondary'}
                  className="h-10 text-sm flex-1"
                  onClick={() => onSavePreferences({ effortMode: id })}
                >
                  {label}
                </Button>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
              {safePreferences.effortMode === 'rir' &&
                'RIR: repeticiones que dejas en la recámara (0 = al fallo, 2 = podrías hacer 2 más).'}
              {safePreferences.effortMode === 'rpe' &&
                'RPE: esfuerzo percibido del 1 al 10 (10 = al fallo, 8 = podrías hacer 2 reps más).'}
              {(safePreferences.effortMode || 'off') === 'off' &&
                'La columna de esfuerzo no se mostrará al anotar tus series.'}
            </p>
          </div>
        </Card>

        {/* Herramientas opcionales de la sesión */}
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 px-2">Herramientas opcionales</p>
          <Card className="p-0 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800">
            <ToggleRow
              title="Estimaciones de RM"
              desc="Muestra el 1RM, 5RM y 8RM estimados bajo cada serie al anotar peso y repeticiones."
              checked={safePreferences.showRmEstimates === true}
              onChange={(v) => onSavePreferences({ showRmEstimates: v })}
            />
            <ToggleRow
              title="Calculadora de discos"
              desc="Añade un botón en cada ejercicio de la sesión que calcula qué discos poner por lado de la barra."
              checked={safePreferences.plateCalculator === true}
              onChange={(v) => onSavePreferences({ plateCalculator: v })}
            />
          </Card>
        </div>
      </div>
    );
  }

  if (subview === 'guide') {
    return <TrainingGuideView onBack={() => setSubview(null)} />;
  }

  if (subview === 'myExercises') {
    return (
      <div className="p-4 pb-10 space-y-4">
        <SubviewHeader title="Mis ejercicios" onBack={() => setSubview(null)} />
        <p className="text-xs text-zinc-500 px-1 -mt-2">
          Ejercicios propios que solo ves tú. También puedes crearlos al editar una rutina.
        </p>

        <Card className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-[2]">
              <Input placeholder="Nombre (Ej. Curl Bíceps)" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} />
            </div>
            <div className="flex-1">
              <Input placeholder="Grupo (Ej. Brazos)" value={newExerciseMuscle} onChange={(e) => setNewExerciseMuscle(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreateExerciseSubmit} className="h-10 text-sm">
            <Plus size={15} className="mr-1" /> Crear ejercicio
          </Button>
        </Card>

        {myExercises.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-xs text-zinc-500">Todavía no has creado ejercicios propios.</p>
          </Card>
        ) : (
          <Card className="space-y-2">
            {myExercises.map((exercise) => (
              <div key={exercise.id} className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0 last:pb-0">
                <img
                  src={exercise.imageUrl || getMuscleImage(exercise.muscleGroup)}
                  alt={exercise.muscleGroup}
                  loading="lazy"
                  className="w-10 h-10 rounded-md object-cover bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getMuscleImage(exercise.muscleGroup);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{exercise.name}</p>
                  <p className="text-xs text-zinc-500">{exercise.muscleGroup}</p>
                </div>
                <button
                  className="text-xs font-semibold text-red-500 hover:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded-lg transition-colors"
                  onClick={() => setConfirmDeleteExercise(exercise)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </Card>
        )}

        {confirmDeleteExercise && (
          <ConfirmDialog
            title={`¿Eliminar "${confirmDeleteExercise.name}"?`}
            message="Se quitará también de tus rutinas. Esta acción no se puede deshacer."
            confirmLabel="Eliminar"
            danger
            onConfirm={() => { onDeleteExercise(confirmDeleteExercise.id); setConfirmDeleteExercise(null); }}
            onCancel={() => setConfirmDeleteExercise(null)}
          />
        )}
      </div>
    );
  }

  if (subview === 'catalog') {
    return (
      <div className="p-4 pb-10 space-y-4">
        <SubviewHeader title="Catálogo de ejercicios" onBack={() => setSubview(null)} />
        <p className="text-xs text-zinc-500 px-1 -mt-2 leading-relaxed">
          Oculta los ejercicios que no uses para que no aparezcan al crear rutinas. Solo afecta a tu cuenta y es reversible.
        </p>

        <Card className="space-y-3">
          <Input
            placeholder="Buscar por nombre o grupo muscular…"
            value={catalogQuery}
            onChange={(e) => { setCatalogQuery(e.target.value); setShowOnlyHidden(false); }}
            className="py-2.5 text-sm"
          />

          {hiddenByMe.size > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setShowOnlyHidden((v) => !v); setCatalogQuery(''); }}
                className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-colors
                  ${showOnlyHidden
                    ? 'bg-brand-600 text-on-brand'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}
              >
                Ocultos ({hiddenByMe.size})
              </button>
              <button
                type="button"
                onClick={() => setConfirmRestoreHidden(true)}
                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
              >
                Restaurar todos
              </button>
            </div>
          )}

          {catalogResults === null && !showOnlyHidden ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-2">
              Escribe al menos 2 letras para buscar.
            </p>
          ) : catalogResults.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-2">Sin resultados.</p>
          ) : (
            <div className="space-y-2 max-h-[26rem] overflow-y-auto pr-2">
              {catalogResults.map((exercise) => {
                const isHidden = hiddenByMe.has(exercise.id);
                return (
                  <div key={exercise.id} className={`flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0 ${isHidden ? 'opacity-60' : ''}`}>
                    <img
                      src={exercise.imageUrl || getMuscleImage(exercise.muscleGroup)}
                      alt={exercise.muscleGroup}
                      loading="lazy"
                      className="w-10 h-10 rounded-md object-cover bg-zinc-100 dark:bg-zinc-800 flex-shrink-0"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = getMuscleImage(exercise.muscleGroup);
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{exercise.name}</p>
                      <p className="text-xs text-zinc-500">{exercise.muscleGroup}</p>
                    </div>
                    <button
                      className={`flex items-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors
                        ${isHidden
                          ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30'
                          : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 bg-zinc-100 dark:bg-zinc-800'}`}
                      onClick={() => toggleHidden(exercise.id)}
                    >
                      {isHidden ? <><Eye size={13} /> Mostrar</> : <><EyeOff size={13} /> Ocultar</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {confirmRestoreHidden && (
          <ConfirmDialog
            title="¿Restaurar los ejercicios ocultos?"
            message={`Volverán a mostrarse los ${hiddenByMe.size} ejercicios que tenías ocultos.`}
            confirmLabel="Restaurar"
            onConfirm={() => {
              onSavePreferences({ hiddenExercises: [] });
              setShowOnlyHidden(false);
              setConfirmRestoreHidden(false);
            }}
            onCancel={() => setConfirmRestoreHidden(false)}
          />
        )}
      </div>
    );
  }

  if (subview === 'data') {
    return (
      <div className="p-4 pb-10 space-y-4">
        <SubviewHeader title="Copia de seguridad" onBack={() => setSubview(null)} />
        <Card className="space-y-4">
          <p className="text-xs text-zinc-500">Exporta una copia de seguridad de todos tus entrenamientos, métricas y rutinas, o restaura una anterior.</p>

          <Button
            onClick={onExportData}
            variant="secondary"
            className="w-full flex items-center justify-center gap-2 h-11"
          >
            <Download size={16} />
            Exportar datos (JSON)
          </Button>

          <div className="relative">
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="w-full flex items-center justify-center gap-2 h-11"
              disabled={importLoading}
            >
              <Upload size={16} />
              {importLoading ? 'Importando…' : 'Importar datos (JSON)'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleImportFile}
            />
          </div>

          {importMsg && (
            <p className={`text-xs font-semibold text-center ${importMsg.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {importMsg.text}
            </p>
          )}
        </Card>
      </div>
    );
  }

  // ─── Menú principal ───────────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-5 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Ajustes</h2>
      </div>

      {/* Cuenta */}
      <Card className="flex items-center gap-3">
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-brand-600/20 flex items-center justify-center">
            <span className="text-brand-500 font-bold">
              {(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
            </span>
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {user?.displayName || 'Usuario'}
          </p>
          <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
        </div>
        {isAdmin && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-2 py-1 rounded-full border border-brand-200 dark:border-brand-800">
            <Shield size={10} /> Admin
          </span>
        )}
      </Card>

      <MenuGroup label="Preferencias">
        <MenuRow
          icon={Palette}
          color="bg-violet-500"
          title="Apariencia"
          subtitle={`${themeName} · ${accentName}`}
          onClick={() => setSubview('appearance')}
        />
        <MenuRow
          icon={Timer}
          color="bg-amber-500"
          title="Entrenamiento"
          subtitle={trainingSummary}
          onClick={() => setSubview('training')}
        />
      </MenuGroup>

      <MenuGroup label="Ejercicios">
        <MenuRow
          icon={Dumbbell}
          color="bg-emerald-500"
          title="Mis ejercicios"
          subtitle={myExercises.length === 0 ? 'Crea ejercicios personalizados' : `${myExercises.length} ${myExercises.length === 1 ? 'personalizado' : 'personalizados'}`}
          onClick={() => setSubview('myExercises')}
        />
        <MenuRow
          icon={Search}
          color="bg-blue-500"
          title="Catálogo de ejercicios"
          subtitle={hiddenByMe.size > 0 ? `${hiddenByMe.size} ocultos` : 'Oculta los que no uses'}
          onClick={() => setSubview('catalog')}
        />
      </MenuGroup>

      <MenuGroup label="Aprende">
        <MenuRow
          icon={BookOpen}
          color="bg-rose-500"
          title="Guía de entrenamiento"
          subtitle="Tipos de serie: qué son y cuándo usar cada uno"
          onClick={() => setSubview('guide')}
        />
      </MenuGroup>

      {isAdmin && (
        <MenuGroup label="Administración">
          <MenuRow
            icon={Shield}
            color="bg-brand-600"
            title="Panel de ejercicios"
            subtitle="Catálogo global · los cambios los ven todos"
            onClick={() => setShowAdminPanel(true)}
          />
        </MenuGroup>
      )}

      <MenuGroup label="Datos">
        <MenuRow
          icon={Database}
          color="bg-zinc-500"
          title="Copia de seguridad"
          subtitle="Exportar o importar tus datos (JSON)"
          onClick={() => setSubview('data')}
        />
      </MenuGroup>

      {/* Overlay del panel de administración */}
      {showAdminPanel && isAdmin && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-zinc-950/80 z-50 flex items-center justify-center">
            <p className="text-zinc-400 text-sm">Cargando panel…</p>
          </div>
        }>
          <AdminExercisesView
            exercises={safeExercises}
            onSaveGlobal={onSaveGlobalExercise}
            onDeleteGlobal={onDeleteExercise}
            onRestoreAll={onRestoreExercises}
            onClose={() => setShowAdminPanel(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
