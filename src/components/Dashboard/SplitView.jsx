import React from 'react';
import { Card, CardTitle, Button } from '../UI/Card';

export default function SplitView({
  templates,
  onStartTraining,
  onCreateTemplate,
  onEditTemplate,
  onDeleteTemplate,
}) {
  return (
    <div className="p-4 space-y-6">
      <div className="mb-2">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Plantillas de Rutina</h2>
        <p className="text-zinc-400 text-sm mt-1">Selecciona una plantilla para iniciar la sesión</p>
      </div>

      <Button variant="secondary" onClick={onCreateTemplate}>
        + Crear plantilla
      </Button>

      <div className="space-y-3">
        {templates.length === 0 && (
          <Card>
            <p className="text-sm text-zinc-300">No tienes rutinas creadas.</p>
            <p className="text-xs text-zinc-500 mt-1">
              Crea tu primera plantilla para empezar a registrar entrenamientos.
            </p>
          </Card>
        )}
        {templates.map((template) => (
          <Card key={template.id} className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase mb-1 block">
                  {template.focus}
                </span>
                <CardTitle className="mb-1 text-base">{template.name}</CardTitle>
                <p className="text-xs text-zinc-500">
                  {template.exercises.length} ejercicios
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => onEditTemplate(template)}>
                Editar
              </Button>
              <Button onClick={() => onStartTraining(template.id)}>Iniciar entrenamiento</Button>
            </div>
            <Button
              variant="ghost"
              className="text-red-400 hover:text-red-300"
              onClick={() => onDeleteTemplate(template.id)}
            >
              Eliminar rutina
            </Button>
          </Card>
        ))}
      </div>
      
      <div className="pt-6">
        <p className="text-center text-xs text-zinc-600">Usa el editor para reordenar y guardar cambios.</p>
      </div>
    </div>
  );
}
