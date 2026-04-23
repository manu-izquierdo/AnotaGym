import React, { useMemo, useState } from 'react';
import { Card, Button, Input, Label } from '../UI/Card';

export default function ProfileView({
  completedSessions,
  preferences,
  bodyMetrics,
  onSavePreferences,
  onAddBodyMetric,
  onDeleteBodyMetric,
  onLogout,
  user,
}) {
  const safePreferences = preferences || { theme: 'dark', unit: 'kg' };
  const safeBodyMetrics = [...(bodyMetrics || [])].sort((a, b) => new Date(b.date) - new Date(a.date));

  const [measurementDate, setMeasurementDate] = useState(new Date().toISOString().slice(0, 10));
  const [bodyWeight, setBodyWeight] = useState('');

  const stats = useMemo(() => {
    const safe = completedSessions || [];
    const sessions = safe.length;
    const sets = safe.reduce((acc, s) => acc + s.exercises.reduce((a, ex) => a + ex.sets.length, 0), 0);
    const volume = safe.reduce((acc, s) => acc + s.exercises.reduce(
      (a, ex) => a + ex.sets.reduce((sv, set) => sv + (parseFloat(set.weight) || 0) * (parseInt(set.reps, 10) || 0), 0), 0
    ), 0);
    return { sessions, sets, volume: Math.round(volume) };
  }, [completedSessions]);

  const handleAddMeasurement = () => {
    if (!bodyWeight) return;
    onAddBodyMetric({ date: measurementDate, bodyWeight: parseFloat(bodyWeight) });
    setBodyWeight('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen válido.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      // Comprimir la imagen antes de guardarla para no saturar Firestore (Límite 1MB)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 300; // 300px es más que suficiente para un avatar
        let width = img.width;
        let height = img.height;

        // Mantener proporción
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a JPEG comprimido (aprox 10-30KB)
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        onSavePreferences({ profilePicture: compressedBase64 });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 space-y-6 pb-10">
      <div className="flex flex-col items-center justify-center text-center space-y-2 pt-2">
        <label className="relative cursor-pointer group">
          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center group-hover:opacity-80 transition-opacity">
            {(safePreferences.profilePicture || user?.photoURL) ? (
              <img src={safePreferences.profilePicture || user?.photoURL} alt="Perfil" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-zinc-400">
                {(user?.displayName || user?.email || 'ME').slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-semibold">Cambiar foto</span>
          </div>
        </label>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {user?.displayName || user?.email?.split('@')[0] || (user?.isAnonymous ? 'Atleta Invitado' : 'Atleta')}
          </h2>
          <p className="text-brand-600 dark:text-brand-400 text-sm font-medium">AnotaGym</p>
          {user?.email && (
            <p className="text-xs text-zinc-500 mt-0.5">{user.email}</p>
          )}
        </div>
      </div>

      {/* Guest Warning */}
      {user?.isAnonymous && (
        <Card className="bg-orange-500/10 border-orange-500/20 p-4">
          <p className="text-orange-600 dark:text-orange-400 text-sm font-medium">Estás usando el Modo Invitado</p>
          <p className="text-xs text-orange-600/80 dark:text-orange-400/80 mt-1 leading-relaxed">
            Si cierras sesión en este navegador, perderás tus entrenamientos. En el futuro añadiremos la opción de guardar tu cuenta con Google o Email.
          </p>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="col-span-1 p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Sesiones</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.sessions}</p>
        </Card>
        <Card className="col-span-1 p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Series</p>
          <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{stats.sets}</p>
        </Card>
        <Card className="col-span-2 p-4">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1">Volumen Movido</p>
          <p className="text-2xl font-bold text-brand-600 dark:text-brand-400">{stats.volume.toLocaleString()} {safePreferences.unit}</p>
        </Card>
      </div>

      {/* Medidas corporales */}
      <Card className="space-y-4">
        <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Medidas corporales</h3>

        <div className="flex gap-2">
          <div className="flex-1">
            <Label>Fecha</Label>
            <Input type="date" value={measurementDate} onChange={e => setMeasurementDate(e.target.value)} />
          </div>
          <div className="flex-1">
            <Label>Peso ({safePreferences.unit})</Label>
            <Input type="number" step="0.1" value={bodyWeight} onChange={e => setBodyWeight(e.target.value)} placeholder="75.5" />
          </div>
        </div>
        <Button onClick={handleAddMeasurement}>Guardar medida</Button>

        {safeBodyMetrics.length > 0 && (
          <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-1">
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Historial ({safeBodyMetrics.length})</p>
            <div className="max-h-52 overflow-y-auto pr-1 space-y-0">
              {safeBodyMetrics.map((metric, i) => {
                const prev = safeBodyMetrics[i + 1];
                const delta = prev ? (metric.bodyWeight - prev.bodyWeight) : null;
                const isUp = delta !== null && delta > 0;
                return (
                  <div key={metric.date} className="flex items-center justify-between py-2.5 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-zinc-500 w-24 shrink-0">
                        {new Date(metric.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{metric.bodyWeight} {safePreferences.unit}</span>
                      {delta !== null && delta !== 0 && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                          ${isUp
                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                          }`}>
                          {isUp ? `▲ +${delta.toFixed(1)}` : `▼ ${delta.toFixed(1)}`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm('¿Borrar esta medida?')) onDeleteBodyMetric?.(metric.date);
                      }}
                      className="text-zinc-300 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      <Button
        variant="ghost"
        className="w-full text-red-500 hover:text-red-600 dark:hover:text-red-400 mt-6"
        onClick={onLogout}
      >
        Cerrar Sesión
      </Button>
    </div>
  );
}
