import React, { useState } from 'react';
import { Card, CardTitle, Button } from '../UI/Card';
import { Share2, Play, Edit3, Trash2, Dumbbell, Plus } from 'lucide-react';

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

export default function SplitView({
  templates,
  onStartTraining,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
  user,
  completedSessions,
}) {
  const [shareMsg, setShareMsg] = useState('');

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
      setShareMsg(`¡Enlace copiado! Se la puedes pasar a quien quieras.`);
      setTimeout(() => setShareMsg(''), 4000);
    } catch (e) {
      alert('Error copiando el enlace al portapapeles');
    }
  };

  return (
    <div className="p-4 space-y-6 pb-12">
      <div className="mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 capitalize">{dateLabel}</p>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
          {greeting}{firstName ? `, ${firstName}` : ''}
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">{weekMsg}</p>
      </div>

      <Button onClick={onCreateTemplate} className="w-full font-bold h-12">
        <Plus size={17} className="mr-1.5" /> Nueva rutina
      </Button>

      {shareMsg && (
        <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold p-3 rounded-lg text-center animate-in fade-in zoom-in-95">
          {shareMsg}
        </div>
      )}

      <div className="space-y-4">
        {templates.length === 0 && (
          <Card className="text-center py-10 border-dashed border-2 bg-transparent shadow-none">
            <Dumbbell className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-3" />
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-300">No tienes rutinas creadas.</p>
            <p className="text-xs text-zinc-500 mt-1">Crea tu primera plantilla para empezar.</p>
          </Card>
        )}
        
        {templates.map((template) => {
          const mainFocus = Object.keys(FOCUS_COLORS).find(k => template.focus?.includes(k)) || 'default';
          const chipColor = FOCUS_COLORS[mainFocus];

          return (
            <div key={template.id} className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-sm transition-all">
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 rounded-full ${chipColor}`}>
                      {template.focus || 'Rutina'}
                    </span>
                    <h3 className="mt-3 text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                      {template.name}
                    </h3>
                    <p className="text-xs text-zinc-500 font-medium flex items-center gap-1 mt-1.5">
                      <Dumbbell size={12} /> {template.exercises.length} ejercicios
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => handleShare(template)}
                    className="p-2.5 text-zinc-400 hover:text-brand-500 bg-white dark:bg-zinc-800 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700 transition-colors"
                    title="Compartir rutina"
                  >
                    <Share2 size={16} />
                  </button>
                </div>

                <div className="flex gap-2 mt-5">
                  <Button 
                    onClick={() => onStartTraining(template.id)} 
                    className="flex-1 flex items-center justify-center gap-1.5 shadow-md font-bold h-11 text-sm"
                  >
                    <Play size={14} fill="currentColor" /> Iniciar
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => onEditTemplate(template)}
                    className="flex items-center justify-center p-0 w-12 h-11 bg-white dark:bg-zinc-800"
                    title="Editar"
                  >
                    <Edit3 size={16} />
                  </Button>
                  
                  <Button 
                    variant="secondary" 
                    onClick={() => {
                      if(window.confirm('¿Borrar esta rutina?')) onDeleteTemplate(template.id);
                    }}
                    className="flex items-center justify-center p-0 w-12 h-11 bg-red-50 dark:bg-red-950/20 text-red-500 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40"
                    title="Borrar"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
