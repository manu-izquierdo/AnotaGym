import React, { useRef, useState, lazy, Suspense } from 'react';
import { Card, Button, Input } from '../UI/Card';
import { ACCENT_PALETTES, ACCENT_NAMES } from '../../App';
import { Download, Upload, Dumbbell, Shield } from 'lucide-react';
import { getMuscleImage } from '../../data/muscleImages';

// Solo lo cargan los admins al abrir el panel — fuera del bundle principal
const AdminExercisesView = lazy(() => import('../Admin/AdminExercisesView'));

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

  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');
  const [importMsg, setImportMsg] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const fileInputRef = useRef(null);

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
    setImportMsg('');
    try {
      const text = await file.text();
      const result = await onImportData(text);
      setImportMsg(result.ok ? '✅ Datos importados correctamente' : `❌ ${result.message}`);
    } catch {
      setImportMsg('❌ Error al leer el archivo');
    }
    setImportLoading(false);
    e.target.value = '';
  };

  return (
    <div className="p-4 space-y-8 pb-10">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 px-2">Ajustes</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm px-2">Configura la aplicación y tu catálogo</p>

        {/* Cuenta */}
        <Card className="space-y-3">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Mi cuenta</h3>
          <div className="flex items-center gap-3">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-600/20 flex items-center justify-center">
                <span className="text-brand-500 font-bold text-sm">
                  {(user?.displayName || user?.email || 'U').slice(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {user?.displayName || 'Usuario'}
              </p>
              <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
            </div>
            {isAdmin && (
              <span className="ml-auto shrink-0 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/30 px-2 py-1 rounded-full border border-brand-200 dark:border-brand-800">
                <Shield size={10} /> Admin
              </span>
            )}
          </div>
        </Card>

        {/* Apariencia */}
        <Card className="space-y-4">
          <div>
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-2">Apariencia</h3>
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
            </div>
          </div>

          <div className="pt-2">
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-3">Color de acento</h3>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(ACCENT_NAMES).map(([key, name]) => {
                const palette = ACCENT_PALETTES[key];
                const rgb = palette[500].split(' ').map(Number);
                const hex = `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`;
                const isActive = (safePreferences.accentColor || 'violet') === key;
                return (
                  <button
                    key={key}
                    onClick={() => onSavePreferences({ accentColor: key })}
                    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all
                      ${isActive
                        ? 'bg-zinc-100 dark:bg-zinc-800 ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/60'}`}
                    style={isActive ? { '--tw-ring-color': hex } : {}}
                  >
                    <span className="w-7 h-7 rounded-full shadow-sm" style={{ backgroundColor: hex }} />
                    <span className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
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
        </Card>

        {/* Entrenamiento */}
        <Card className="space-y-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Entrenamiento</h3>
          
          <div>
            <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 mb-2">Descanso automático</h4>
            <div className="flex gap-2">
              {[0, 60, 90, 120, 180].map(secs => {
                const currentVal = safePreferences.defaultRestTimer ?? 90;
                const isSelected = currentVal === secs;
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
            <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
              El temporizador se activará automáticamente al marcar una serie como completada. Al llegar a 0, tu móvil vibrará.
            </p>
          </div>
        </Card>

        {/* Panel de administración (solo admin) */}
        {isAdmin && (
          <Card className="space-y-3 border-brand-500/30 dark:border-brand-500/20">
            <div className="flex items-center gap-2">
              <Shield size={15} className="text-brand-500" />
              <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">Administración</h3>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Gestiona el catálogo global de ejercicios de forma visual: edita nombres, grupos y fotos,
              oculta ejercicios o añade nuevos. Los cambios los ven todos los usuarios.
            </p>
            <Button onClick={() => setShowAdminPanel(true)} className="h-11 text-sm">
              <Dumbbell size={15} className="mr-2" /> Abrir panel de ejercicios
            </Button>
          </Card>
        )}

        {/* Catálogo de ejercicios */}
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Dumbbell size={15} className="text-brand-500" />
                Catálogo de Ejercicios
              </h3>
              {isAdmin && (
                <p className="text-[11px] text-brand-500 dark:text-brand-400 mt-0.5">
                  Los ejercicios que añadas serán visibles para todos los usuarios
                </p>
              )}
              {!isAdmin && (
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Tus ejercicios personalizados solo los ves tú
                </p>
              )}
            </div>
            <button
              className="text-[10px] uppercase font-bold tracking-wider text-brand-600 dark:text-brand-400 hover:text-brand-500"
              onClick={onRestoreExercises}
            >
              Restablecer
            </button>
          </div>

          <div className="flex flex-col gap-2 p-3 bg-zinc-50 dark:bg-zinc-950/50 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
            <div className="flex gap-2">
              <div className="flex-[2]">
                <Input placeholder="Nombre (Ej. Curl Bíceps)" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} />
              </div>
              <div className="flex-1">
                <Input placeholder="Grupo (Ej. Brazos)" value={newExerciseMuscle} onChange={(e) => setNewExerciseMuscle(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleCreateExerciseSubmit} className="h-9 text-xs">
              {isAdmin ? '➕ Añadir ejercicio (global)' : '➕ Añadir ejercicio (personal)'}
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
            {safeExercises.filter((exercise) => !exercise.hidden).map((exercise) => (
              <div key={exercise.id} className="flex items-center gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-2 last:border-0">
                <img
                  src={exercise.imageUrl || getMuscleImage(exercise.muscleGroup)}
                  alt={exercise.muscleGroup}
                  loading="lazy"
                  className="w-10 h-10 rounded-md object-cover bg-zinc-900 border border-zinc-700/50 flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = getMuscleImage(exercise.muscleGroup);
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200 truncate">{exercise.name}</p>
                    {exercise._source === 'global' && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-brand-500 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded-full flex-shrink-0">Global</span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">{exercise.muscleGroup}</p>
                </div>
                {/* Solo admin puede borrar los globales; cualquiera puede borrar los suyos */}
                {(exercise._source !== 'global' || isAdmin) && (
                  <button
                    className="text-xs font-semibold text-red-500 hover:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded transition-colors"
                    onClick={() => onDeleteExercise(exercise.id)}
                  >
                    Eliminar
                  </button>
                )}
              </div>
            ))}
          </div>
        </Card>

        {/* Backup de datos */}
        <Card className="space-y-4">
          <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Mis datos</h3>
          <p className="text-xs text-zinc-500">Exporta una copia de seguridad de todos tus entrenamientos, métricas y rutinas.</p>

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
            <p className="text-xs font-medium text-center text-zinc-500">{importMsg}</p>
          )}
        </Card>
      </section>

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
