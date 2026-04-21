import React, { useState } from 'react';
import { Card, Button, Input } from '../UI/Card';
import { ACCENT_PALETTES, ACCENT_NAMES } from '../../App';

export default function SettingsView({
  exercises,
  preferences,
  onSavePreferences,
  onDeleteExercise,
  onCreateExercise,
  onRestoreExercises,
  onLogout,
  user,
  users,
  onCreateUser,
}) {
  const safePreferences = preferences || { theme: 'dark', unit: 'kg' };
  const safeUsers = users || [];
  const safeExercises = exercises || [];

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [adminMessage, setAdminMessage] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [newExerciseMuscle, setNewExerciseMuscle] = useState('');

  const handleCreateExerciseSubmit = () => {
    if (!newExerciseName.trim() || !newExerciseMuscle.trim()) return;
    onCreateExercise({ name: newExerciseName, muscleGroup: newExerciseMuscle });
    setNewExerciseName('');
    setNewExerciseMuscle('');
  };

  const handleCreateUser = () => {
    const result = onCreateUser({
      username: newUsername,
      password: newPassword,
      role: newRole,
    });
    setAdminMessage(result.message || (result.ok ? 'Usuario creado correctamente' : 'Error'));
    if (result.ok) {
      setNewUsername('');
      setNewPassword('');
      setNewRole('user');
    }
  };

  return (
    <div className="p-4 space-y-8 pb-10">
      <section className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 px-2">Ajustes</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm px-2">Configura la aplicación y tu catálogo</p>
        
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
                // RGB string to hex approximation for the swatch circle
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
                    <span
                      className="w-7 h-7 rounded-full shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
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

        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">Catálogo de Ejercicios</h3>
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
              Añadir ejercicio
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-2">
            {safeExercises.map((exercise) => (
              <div key={exercise.id} className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-200">{exercise.name}</p>
                  <p className="text-xs text-zinc-500">{exercise.muscleGroup}</p>
                </div>
                <button
                  className="text-xs font-semibold text-red-500 hover:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-1 rounded transition-colors"
                  onClick={() => onDeleteExercise(exercise.id)}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </Card>

        {user?.role === 'admin' && (
          <Card className="space-y-3 border-brand-500/30">
            <h3 className="font-semibold text-brand-600 dark:text-brand-400">Panel Admin</h3>
            <p className="text-xs text-zinc-500">Gestión de usuarios locales.</p>
            <div className="space-y-2">
              <Input placeholder="Usuario" value={newUsername} onChange={(event) => setNewUsername(event.target.value)} />
              <Input
                type="password"
                placeholder="Contraseña"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
              />
              <select
                value={newRole}
                onChange={(event) => setNewRole(event.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-zinc-900 dark:text-zinc-100"
              >
                <option value="user">Usuario normal</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <Button onClick={handleCreateUser}>Crear usuario</Button>
            {adminMessage && <p className="text-xs font-medium text-center text-zinc-500">{adminMessage}</p>}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-3 space-y-2">
              {safeUsers.map((item) => (
                <div key={item.id} className="text-xs font-medium text-zinc-500 flex justify-between">
                  <span>{item.username}</span>
                  <span className="uppercase tracking-wider">{item.role}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        <Button variant="ghost" className="w-full text-red-500 hover:text-red-600 dark:hover:text-red-400 mt-6" onClick={onLogout}>
          Cerrar Sesión
        </Button>
      </section>
    </div>
  );
}
