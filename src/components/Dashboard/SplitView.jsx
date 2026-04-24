import React, { useState } from 'react';
import { Card, CardTitle, Button } from '../UI/Card';
import { Share2, Play, Edit3, Trash2, Dumbbell, ClipboardList } from 'lucide-react';

const FOCUS_COLORS = {
  'Upper': 'from-blue-500/20 to-blue-900/5 border-blue-500/20',
  'Lower': 'from-red-500/20 to-red-900/5 border-red-500/20',
  'Full Body': 'from-purple-500/20 to-purple-900/5 border-purple-500/20',
  'Push': 'from-amber-500/20 to-amber-900/5 border-amber-500/20',
  'Pull': 'from-emerald-500/20 to-emerald-900/5 border-emerald-500/20',
  'Pierna': 'from-red-500/20 to-red-900/5 border-red-500/20',
  'Brazos': 'from-cyan-500/20 to-cyan-900/5 border-cyan-500/20',
  'default': 'from-zinc-500/10 to-zinc-900/5 border-zinc-500/20'
};

export default function SplitView({
  templates,
  onStartTraining,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
}) {
  const [shareMsg, setShareMsg] = useState('');

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
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
          <ClipboardList className="text-brand-500" />
          Tus Rutinas
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Crea plantillas o comparte tus rutinas con amigos.
        </p>
      </div>

      <Button onClick={onCreateTemplate} className="w-full font-bold shadow-lg shadow-brand-500/20 h-12">
        + Nueva Rutina
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
          // Identify the main focus to apply a gradient color
          const mainFocus = Object.keys(FOCUS_COLORS).find(k => template.focus?.includes(k)) || 'default';
          const bgGradient = FOCUS_COLORS[mainFocus];

          return (
            <div key={template.id} className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br bg-white dark:bg-zinc-900 ${bgGradient} transition-all`}>
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded-full border border-zinc-200 dark:border-zinc-700/50 shadow-sm">
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
