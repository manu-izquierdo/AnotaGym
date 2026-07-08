import React, { useEffect, useMemo, useState } from 'react';
import { getExerciseFrames } from '../../data/exerciseUtils';
import { getMuscleImage } from '../../data/muscleImages';

/**
 * Imagen de un ejercicio. Si el ejercicio tiene 2 fotogramas (posición
 * inicial/final de free-exercise-db) y animate=true, los alterna para que se
 * vea el movimiento. Si la imagen falla o no existe, cae al dibujo del grupo
 * muscular. Respeta prefers-reduced-motion.
 */
export default function ExerciseImage({ exercise, animate = false, interval = 1000, className = '', ...imgProps }) {
  const frames = useMemo(() => getExerciseFrames(exercise), [exercise]);
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  const frameKey = frames.join('|');
  useEffect(() => {
    setFrame(0);
    setFailed(false);
  }, [frameKey]);

  useEffect(() => {
    if (!animate || failed || frames.length < 2) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    // Precarga el segundo fotograma para que el primer cambio no parpadee
    const preload = new Image();
    preload.src = frames[1];
    const timer = setInterval(() => setFrame((f) => (f + 1) % frames.length), interval);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animate, failed, frameKey, interval]);

  const src = !failed && frames.length > 0 ? frames[frame] : getMuscleImage(exercise?.muscleGroup);

  return (
    <img
      src={src}
      alt={exercise?.name || exercise?.muscleGroup || 'Ejercicio'}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
      {...imgProps}
    />
  );
}
