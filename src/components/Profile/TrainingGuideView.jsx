import React from 'react';
import { Card } from '../UI/Card';
import { ChevronLeft, Lightbulb } from 'lucide-react';
import { SET_TYPE_MAP } from '../Dashboard/TemplateEditor';

// Guía didáctica de los tipos de serie. El contenido vive aquí (no en SET_TYPES)
// para no engordar el picker con textos largos que solo se leen en la guía.
const SECTIONS = [
  {
    label: 'La base',
    intro: 'Con esto ya puedes entrenar bien. El resto son herramientas para cuando quieras afinar.',
    types: [
      {
        id: 'warmup',
        how: 'Series ligeras antes del trabajo serio: poco peso, pocas repeticiones y muy lejos del fallo. Preparan el músculo, las articulaciones y la técnica del movimiento. En AnotaGym no cuentan para tu volumen total.',
        when: 'En las primeras series de cada ejercicio, sobre todo en los pesados como sentadilla, press banca o peso muerto. Sube el peso escalón a escalón hasta llegar a tu peso de trabajo.',
      },
      {
        id: 'normal',
        how: 'Tu serie de trabajo estándar: un peso que te exige pero que te permite acabar todas las repeticiones con buena técnica, dejando 1–3 repeticiones "en la recámara" (podrías hacer alguna más, pero no la haces).',
        when: 'Siempre. La mayoría de tu entrenamiento deberían ser series normales — la constancia con ellas es lo que más músculo y fuerza construye a largo plazo.',
      },
      {
        id: 'failure',
        how: 'Sigues haciendo repeticiones hasta que ya no puedes completar la siguiente con buena técnica. Genera mucho estímulo, pero también mucha fatiga y más riesgo si la técnica se rompe.',
        when: 'Con moderación: mejor en la última serie de un ejercicio, y en movimientos seguros (máquinas, poleas, mancuernas ligeras). Evítalo en sentadilla o peso muerto pesados.',
      },
    ],
  },
  {
    label: 'Organiza tu intensidad',
    intro: 'Una forma muy popular de estructurar un ejercicio: una serie fuerte para progresar y series algo más ligeras para acumular trabajo.',
    types: [
      {
        id: 'topset',
        how: 'La serie más pesada del día para ese ejercicio: el peso máximo que tenías planificado, llegando muy cerca del fallo (0–1 repeticiones en la recámara). Es tu "examen" de la sesión.',
        when: 'Cuando quieras progresar en fuerza y medir tu avance de semana en semana. Hazla después de calentar bien, y compárala en la gráfica de progresión: si suben el peso o las repeticiones, vas bien.',
      },
      {
        id: 'backoff',
        how: 'Series que van después de la top set con un 10–20% menos de peso. Al bajar el peso puedes hacer más repeticiones con buena técnica y acumular volumen sin tanta fatiga.',
        when: 'Justo después de una top set. Un esquema clásico: 1 top set pesada + 2–3 back-offs. Te llevas lo mejor de los dos mundos: intensidad y volumen.',
      },
    ],
  },
  {
    label: 'Técnicas de intensificación',
    intro: 'Exprimen más una serie alargándola de distintas formas. Son exigentes: úsalas en pocos ejercicios a la vez, no en toda la rutina.',
    types: [
      {
        id: 'dropset',
        how: 'Al terminar la serie, reduces el peso un 20–30% sin descansar y sigues hasta cerca del fallo. Puedes encadenar una o dos bajadas más.',
        when: 'En la última serie de ejercicios de aislamiento o máquinas (curl, elevaciones laterales, extensiones…), donde cambiar el peso es rápido y fallar es seguro. No es buena idea en básicos pesados con barra.',
      },
      {
        id: 'restpause',
        how: 'Llegas cerca del fallo, descansas solo 10–20 segundos sin soltar el ejercicio, y continúas con el mismo peso sacando unas repeticiones más. Se puede repetir 1–3 veces.',
        when: 'Cuando tienes poco tiempo y quieres sacar más trabajo de un mismo peso. Funciona muy bien en máquinas y ejercicios donde fallar no es peligroso.',
      },
      {
        id: 'myo',
        how: 'Una serie de activación de 12–20 repeticiones cerca del fallo, seguida de varias mini-series de 3–5 repeticiones con solo 5–15 segundos de descanso entre ellas, todas con el mismo peso.',
        when: 'Para lograr mucho estímulo en muy poco tiempo con pesos ligeros o moderados. Ideal en aislamiento (hombro lateral, bíceps, gemelo…) como cierre de la sesión.',
      },
    ],
  },
];

export default function TrainingGuideView({ onBack }) {
  return (
    <div className="p-4 pb-10 space-y-5">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Volver a Ajustes"
        >
          <ChevronLeft size={22} />
        </button>
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Guía de entrenamiento</h2>
      </div>

      <Card className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <Lightbulb size={16} className="text-amber-500 shrink-0" />
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Antes de empezar: ¿qué es "dejar reps en la recámara"?</h3>
        </div>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Verás esta idea repetida en toda la guía: si al acabar una serie podrías haber hecho 2 repeticiones
          más, has dejado <strong className="text-zinc-700 dark:text-zinc-300">2 en la recámara</strong> (RIR 2).
          Cuanto más cerca del fallo, más estímulo pero también más fatiga. Entrenar casi siempre con 1–3 en la
          recámara es el punto dulce para progresar sin machacarte.
        </p>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Si lo prefieres, en Ajustes → Entrenamiento puedes anotar el esfuerzo como <strong className="text-zinc-700 dark:text-zinc-300">RPE</strong> (escala
          de 1 a 10, donde 10 es el fallo: RPE 8 ≈ RIR 2) o no anotarlo.
        </p>
      </Card>

      {SECTIONS.map((section) => (
        <div key={section.label} className="space-y-2.5">
          <div className="px-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">{section.label}</p>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{section.intro}</p>
          </div>

          {section.types.map(({ id, how, when }) => {
            const type = SET_TYPE_MAP[id];
            if (!type) return null;
            return (
              <Card key={id} className="p-4 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${type.color}`}>{type.short}</span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{type.label}</h3>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1">Cómo funciona</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{how}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">Cuándo usarla</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{when}</p>
                </div>
              </Card>
            );
          })}
        </div>
      ))}

      <Card className="p-4">
        <p className="text-xs text-zinc-500 leading-relaxed">
          <strong className="text-zinc-700 dark:text-zinc-300">Regla de oro:</strong> las técnicas de
          intensificación son la guinda, no el pastel. Elige 1 o 2 ejercicios por sesión para aplicarlas
          y deja que las series normales hagan el trabajo grueso. Y recuerda: la mejor rutina es la que
          puedes repetir semana tras semana.
        </p>
      </Card>
    </div>
  );
}
