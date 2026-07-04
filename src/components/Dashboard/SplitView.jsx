import React, { useMemo, useState } from 'react';
import { Card, Button } from '../UI/Card';
import ConfirmDialog from '../UI/ConfirmDialog';
import {
  Share2, Play, Edit3, Trash2, Dumbbell, Plus, Copy, Zap,
  MoreVertical, ChevronRight,
} from 'lucide-react';

// Color del chip de enfoque de cada rutina
const FOCUS_COLORS = {
  'Upper': 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
  'Lower': 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  'Full Body': 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
  'Push': 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400',
  'Pull': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
  'Pierna': 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400',
  'Brazos': 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400',
  'default': 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
};

function MenuItem({ icon: Icon, label, danger, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left transition-colors
        ${danger
          ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
          : 'text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'}`}
    >
      <Icon size={15} />
      {label}
    </button>
  );
}

export default function SplitView({
  templates,
  onStartTraining,
  onStartQuickLog,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onDuplicateTemplate,
  user,
  completedSessions,
  hasActiveSession,
  exerciseLibrary,
}) {
  const [shareMsg, setShareMsg] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const exerciseIndex = useMemo(
    () => (exerciseLibrary || []).reduce((acc, ex) => { acc[ex.id] = ex; return acc; }, {}),
    [exerciseLibrary]
  );

  // Saludo dinámico según la hora + resumen de la semana
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 7 ? 'A por todas' : hour < 14 ? 'Buenos días' : hour < 21 ? 'Buenas tardes' : 'Buenas noches';
  const firstName = (user?.displayName || '').trim().split(' ')[0];
  const dateLabel = now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const weekCount = (completedSessions || []).filter((s) => {
    const t = new Date(s.finishedAt || s.startedAt).getTime();
    return Number.isFinite(t) && Date.now() - t < 7 * 86400000;
  }).length;
  const weekMsg = weekCount === 0
    ? 'Esta semana aún no has entrenado. ¿Empezamos?'
    : weekCount === 1
      ? '1 sesión en los últimos 7 días. ¡Sigue así!'
      : `${weekCount} sesiones en los últimos 7 días. ¡Buen ritmo!`;

  const handleShare = async (template) => {
    try {
      const data = btoa(encodeURIComponent(JSON.stringify(template)));
      const url = `${window.location.origin}/?importRoutine=${data}`;
      await navigator.clipboard.writeText(url);
      setShareMsg('¡Enlace copiado! Se la puedes pasar a quien quieras.');
      setTimeout(() => setShareMsg(''), 4000);
    } catch (e) {
      setShareMsg('No se pudo copiar el enlace al portapapeles.');
      setTimeout(() => setShareMsg(''), 4000);
    }
  };

  const templateToDelete = templates.find((t) => t.id === confirmDeleteId);

  return (
    <div className="p-4 space-y-6 pb-12">
      {/* Saludo */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 capitalize">{dateLabel}</p>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{weekMsg}</p>
      </div>

      {/* Empezar ya: entreno libre / continuar sesión */}
      <button
        type="button"
        onClick={onStartQuickLog}
        className="w-full flex items-center gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md md:hover:-translate-y-0.5 transition-all text-left group"
      >
        <span className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${hasActiveSession ? 'bg-emerald-600' : 'bg-brand-600'}`}>
          {hasActiveSession ? <Play size={20} className="text-white" fill="currentColor" /> : <Zap size={20} className="text-white" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {hasActiveSession ? 'Continuar sesión' : 'Entreno libre'}
          </span>
          <span className="block text-xs text-zinc-500 mt-0.5">
            {hasActiveSession
              ? 'Tienes un entrenamiento en marcha'
              : 'Entrena sin plantilla, añadiendo ejercicios sobre la marcha'}
          </span>
        </span>
        <ChevronRight size={18} className="text-zinc-300 dark:text-zinc-600 group-hover:text-brand-500 transition-colors shrink-0" />
      </button>

      {shareMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold p-3 rounded-lg text-center">
          {shareMsg}
        </div>
      )}

      {/* Mis rutinas */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            Mis rutinas{templates.length > 0 && <span className="text-zinc-400 font-medium ml-1.5">{templates.length}</span>}
          </h3>
          <button
            type="button"
            onClick={onCreateTemplate}
            className="flex items-center gap-1 text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 dark:hover:bg-brand-950/70 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} /> Nueva
          </button>
        </div>

        {templates.length === 0 && (
          <Card className="text-center py-10 border-dashed border-2 bg-transparent shadow-none">
            <Dumbbell className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">No tienes rutinas creadas.</p>
            <p className="text-xs text-zinc-500 mt-1">Crea tu primera plantilla para empezar.</p>
          </Card>
        )}

        <div className="space-y-3">
          {templates.map((template) => {
            const mainFocus = Object.keys(FOCUS_COLORS).find(k => template.focus?.includes(k)) || 'default';
            const chipColor = FOCUS_COLORS[mainFocus];
            const previewNames = template.exercises
              .slice(0, 3)
              .map((e) => exerciseIndex[e.exerciseId]?.name)
              .filter(Boolean);
            const menuOpen = menuOpenId === template.id;

            return (
              <div key={template.id} className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm p-4 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className={`inline-block text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full ${chipColor}`}>
                      {template.focus || 'Rutina'}
                    </span>
                    <h3 className="mt-2.5 text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                      {template.name}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 truncate">
                      {template.exercises.length} {template.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                      {previewNames.length > 0 && ` · ${previewNames.join(', ')}`}
                      {template.exercises.length > 3 && '…'}
                    </p>
                  </div>

                  {/* Menú de acciones (⋯) */}
                  <button
                    type="button"
                    onClick={() => setMenuOpenId(menuOpen ? null : template.id)}
                    className="p-2 -mr-2 -mt-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
                    aria-label="Opciones de la rutina"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>

                <Button
                  onClick={() => onStartTraining(template.id)}
                  className="mt-4 h-11 text-sm font-bold flex items-center justify-center gap-1.5"
                >
                  <Play size={14} fill="currentColor" /> Empezar
                </Button>

                {menuOpen && (
                  <>
                    {/* Capa para cerrar al pulsar fuera */}
                    <div className="fixed inset-0 z-20" onClick={() => setMenuOpenId(null)} />
                    <div className="absolute right-3 top-12 z-30 w-44 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl py-1 animate-view-in">
                      <MenuItem icon={Edit3} label="Editar" onClick={() => { setMenuOpenId(null); onEditTemplate(template); }} />
                      <MenuItem icon={Copy} label="Duplicar" onClick={() => { setMenuOpenId(null); onDuplicateTemplate(template.id); }} />
                      <MenuItem icon={Share2} label="Compartir" onClick={() => { setMenuOpenId(null); handleShare(template); }} />
                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                      <MenuItem icon={Trash2} label="Eliminar" danger onClick={() => { setMenuOpenId(null); setConfirmDeleteId(template.id); }} />
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {confirmDeleteId && (
        <ConfirmDialog
          title="¿Eliminar esta rutina?"
          message={`"${templateToDelete?.name || 'La rutina'}" se borrará. Tus entrenamientos ya guardados no se tocan.`}
          confirmLabel="Eliminar"
          danger
          onConfirm={() => { onDeleteTemplate(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
