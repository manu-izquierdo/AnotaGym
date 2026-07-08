import React, { useMemo } from 'react';
import { X, Dumbbell, Target, BarChart3 } from 'lucide-react';
import Model from 'react-body-highlighter';
import ExerciseImage from '../UI/ExerciseImage';
import { musclesToModelZones } from '../../data/exerciseUtils';

// Si un ejercicio (p. ej. creado por el usuario) no trae músculos detallados,
// se estiman a partir del grupo muscular para poder pintar el diagrama.
const GROUP_FALLBACK_MUSCLES = {
  Pectoral: ['Pectoral'],
  Espalda: ['Dorsales', 'Espalda media'],
  Hombros: ['Hombros'],
  Brazos: ['Bíceps', 'Tríceps'],
  Piernas: ['Cuádriceps', 'Isquiotibiales', 'Glúteos'],
  Core: ['Abdominales'],
  Cuello: ['Cuello'],
};

function useCssColor(varName, fallback) {
  return useMemo(() => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value ? `rgb(${value})` : fallback;
    // Se resuelve al abrir la ficha; si cambias de paleta la siguiente apertura ya usa la nueva
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [varName]);
}

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-semibold">
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

/**
 * Ficha de un ejercicio: imagen grande animada (2 fotogramas), descripción,
 * nivel y diagrama corporal con los músculos trabajados resaltados.
 */
export default function ExerciseDetailSheet({ exercise, onClose }) {
  const brandColor = useCssColor('--brand-600', 'rgb(217 155 124)');
  const accentColor = useCssColor('--accent-500', 'rgb(183 203 170)');
  const bodyColor = useCssColor('--ui-200', 'rgb(228 222 216)');

  const primaryMuscles = exercise?.primaryMuscles?.length
    ? exercise.primaryMuscles
    : GROUP_FALLBACK_MUSCLES[exercise?.muscleGroup] || [];
  const secondaryMuscles = exercise?.secondaryMuscles || [];

  const { modelData, hasZones } = useMemo(() => {
    const primaryZones = musclesToModelZones(primaryMuscles);
    const secondaryZones = musclesToModelZones(secondaryMuscles).filter((z) => !primaryZones.includes(z));
    return {
      // frequency 1 → color secundario, frequency 2 → color primario
      modelData: [
        { name: 'secundarios', muscles: secondaryZones, frequency: 1 },
        { name: 'primarios', muscles: primaryZones, frequency: 2 },
      ],
      hasZones: primaryZones.length + secondaryZones.length > 0,
    };
  }, [primaryMuscles, secondaryMuscles]);

  if (!exercise) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        {/* Imagen grande animada */}
        <div className="relative">
          <ExerciseImage
            exercise={exercise}
            animate
            className="w-full aspect-[4/3] object-contain bg-white rounded-t-3xl"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/40 text-white backdrop-blur-sm"
            aria-label="Cerrar ficha"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">{exercise.name}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Chip icon={Target}>{exercise.muscleGroup}</Chip>
              {exercise.equipment && <Chip icon={Dumbbell}>{exercise.equipment}</Chip>}
              {exercise.level && <Chip icon={BarChart3}>{exercise.level}</Chip>}
            </div>
          </div>

          {exercise.description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">{exercise.description}</p>
          )}

          {hasZones && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 p-4">
              <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">Músculos trabajados</p>
              <div className="flex justify-center gap-2 [&_svg]:max-h-56">
                <Model type="anterior" data={modelData} bodyColor={bodyColor} highlightedColors={[accentColor, brandColor]} style={{ width: '9rem', padding: 0 }} />
                <Model type="posterior" data={modelData} bodyColor={bodyColor} highlightedColors={[accentColor, brandColor]} style={{ width: '9rem', padding: 0 }} />
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-xs">
                {primaryMuscles.length > 0 && (
                  <span className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-600 inline-block" />
                    {primaryMuscles.join(', ')}
                  </span>
                )}
                {secondaryMuscles.length > 0 && (
                  <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    {secondaryMuscles.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
