import React, { useMemo, useState } from 'react';
import { Card } from '../UI/Card';
import ConfirmDialog from '../UI/ConfirmDialog';
import { Trash2, Dumbbell, Scale, BarChart3, ListChecks, LineChart, Trophy } from 'lucide-react';
import { SET_TYPE_MAP } from '../Dashboard/TemplateEditor';
import ProgressChart from '../UI/ProgressChart';
import ExerciseProgress from '../Progress/ExerciseProgress';
import RecordsView from '../Progress/RecordsView';

function isoToDay(isoDate) { return (isoDate || '').slice(0, 10); }
function sessionDate(session) { return session.finishedAt || session.startedAt; }
function calcVolume(exercises) {
  return (exercises || []).reduce((acc, ex) =>
    acc + (ex.sets || []).reduce((s, set) => s + (parseFloat(set.weight) || 0) * (parseInt(set.reps, 10) || 0), 0), 0);
}
function maxWeightForExercise(exercise) {
  return Math.max(0, ...(exercise.sets || []).map(s => parseFloat(s.weight) || 0));
}

const SECTIONS = [
  { key: 'summary', label: 'Resumen', icon: BarChart3 },
  { key: 'exercises', label: 'Ejercicios', icon: LineChart },
  { key: 'records', label: 'Récords', icon: Trophy },
  { key: 'history', label: 'Historial', icon: ListChecks },
];

// ─── Sub-components ─────────────────────────────────────────────────────────

function MonthCalendar({ workoutDays }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const offset = (firstDayOfWeek + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
  const cells = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const dayLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 capitalize">{monthName}</h3>
        <span className="text-xs font-medium text-zinc-500">{workoutDays.size} sesiones</span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {dayLabels.map(l => <div key={l} className="text-[9px] font-bold text-zinc-400 pb-1">{l}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />;
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const hasWorkout = workoutDays.has(dateKey);
          const isToday = day === today;
          return (
            <div key={dateKey} className="flex flex-col items-center gap-0.5 py-1">
              <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full
                ${isToday ? 'bg-brand-600 dark:bg-brand-500 text-white font-bold' : 'text-zinc-600 dark:text-zinc-400'}`}>
                {day}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full ${hasWorkout ? 'bg-emerald-500' : ''}`} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function KpiCard({ label, value, sub, subColor }) {
  const cls = subColor === 'green' ? 'text-emerald-600 dark:text-emerald-400'
    : subColor === 'red' ? 'text-red-500 dark:text-red-400' : 'text-zinc-500';
  return (
    <div className="flex flex-col gap-0.5 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-3">
      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</p>
      <p className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
      {sub && <p className={`text-xs font-semibold ${cls}`}>{sub}</p>}
    </div>
  );
}

function VolumeChart({ sessions, unit }) {
  const points = useMemo(() => {
    const byDay = {};
    sessions.forEach(s => {
      const k = isoToDay(sessionDate(s));
      if (!byDay[k]) byDay[k] = { vol: 0, names: [] };
      byDay[k].vol += calcVolume(s.exercises);
      if (s.templateName) byDay[k].names.push(s.templateName);
    });
    return Object.entries(byDay)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, d]) => ({ date, value: Math.round(d.vol), detail: d.names.join(' · ') }));
  }, [sessions]);

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Volumen por día</h3>
        <span className="text-[11px] text-zinc-500">{unit}</span>
      </div>
      <ProgressChart
        points={points}
        unit={unit}
        emptyMessage="Completa al menos 2 entrenamientos para ver la evolución de tu volumen."
      />
      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed">
        Volumen = suma de peso × repeticiones de todas las series del día. Toca un punto para ver el detalle.
      </p>
    </Card>
  );
}

function BodyWeightChart({ bodyMetrics, unit }) {
  const sorted = useMemo(
    () => [...(bodyMetrics || [])].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [bodyMetrics]
  );
  const points = useMemo(
    () => sorted.map(m => ({ date: m.date, value: m.bodyWeight })),
    [sorted]
  );

  if (sorted.length === 0) {
    return (
      <Card className="space-y-2">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Peso corporal</h3>
        <p className="text-xs text-zinc-500">Registra tu peso en la pestaña Perfil para ver tu evolución.</p>
      </Card>
    );
  }

  const latest = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const delta = prev ? (latest.bodyWeight - prev.bodyWeight).toFixed(1) : null;
  const isUp = delta !== null && parseFloat(delta) > 0;
  const isFlat = delta !== null && parseFloat(delta) === 0;
  const trendLabel = delta === null ? null : isFlat ? 'Sin cambio' : isUp ? `+${delta} ${unit}` : `${delta} ${unit}`;
  const trendCls = isFlat ? 'text-zinc-500' : isUp ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';

  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Peso corporal</h3>
          <p className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mt-0.5">
            {latest.bodyWeight} <span className="text-sm font-normal text-zinc-500">{unit}</span>
          </p>
        </div>
        {trendLabel && (
          <span className={`text-xs font-bold px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 ${trendCls}`}>
            {trendLabel}
          </span>
        )}
      </div>
      <ProgressChart
        points={points}
        unit={unit}
        emptyMessage="Registra tu peso al menos 2 días para ver la gráfica."
      />
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HistoryView({ completedSessions, exerciseLibrary, bodyMetrics, unit, onDeleteSession }) {
  const safeSessions = completedSessions || [];
  const safeMetrics = bodyMetrics || [];
  const safeLibrary = exerciseLibrary || [];

  const [section, setSection] = useState('summary');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const exerciseIndex = useMemo(() =>
    safeLibrary.reduce((acc, ex) => { acc[ex.id] = ex; return acc; }, {}), [safeLibrary]);

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const allWorkoutDays = useMemo(() => {
    const days = new Set();
    safeSessions.forEach(s => days.add(isoToDay(sessionDate(s))));
    return days;
  }, [safeSessions]);

  const workoutDaysThisMonth = useMemo(() => {
    const days = new Set();
    allWorkoutDays.forEach(d => { if (d.startsWith(thisMonthKey)) days.add(d); });
    return days;
  }, [allWorkoutDays, thisMonthKey]);

  const kpis = useMemo(() => {
    const sessionsThisMonth = safeSessions.filter(s => isoToDay(sessionDate(s)).startsWith(thisMonthKey)).length;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const volThis = safeSessions.filter(s => isoToDay(sessionDate(s)).startsWith(thisMonthKey)).reduce((a, s) => a + calcVolume(s.exercises), 0);
    const volPrev = safeSessions.filter(s => isoToDay(sessionDate(s)).startsWith(prevKey)).reduce((a, s) => a + calcVolume(s.exercises), 0);
    const volDelta = volPrev > 0 ? Math.round(((volThis - volPrev) / volPrev) * 100) : null;
    const sortedDays = [...allWorkoutDays].sort().reverse();
    let streak = 0;
    let cursor = new Date(); cursor.setHours(0, 0, 0, 0);
    for (const d of sortedDays) {
      const day = new Date(d); day.setHours(0, 0, 0, 0);
      const diff = Math.round((cursor - day) / 86400000);
      if (diff <= 1) { streak++; cursor = day; } else break;
    }
    return { sessionsThisMonth, volThis: Math.round(volThis), volDelta, streak };
  }, [safeSessions, allWorkoutDays, thisMonthKey]);

  // Para cada ejercicio, sus apariciones en orden cronológico (id de sesión +
  // peso máximo de ese día). Permite comparar cada sesión con la APARICIÓN
  // anterior del mismo ejercicio, aunque haya sesiones intermedias sin él.
  const occurrencesByExercise = useMemo(() => {
    const map = {};
    [...safeSessions]
      .sort((a, b) => new Date(sessionDate(a)) - new Date(sessionDate(b)))
      .forEach(session => {
        (session.exercises || []).forEach(ex => {
          const maxW = maxWeightForExercise(ex);
          if (maxW <= 0) return;
          if (!map[ex.exerciseId]) map[ex.exerciseId] = [];
          map[ex.exerciseId].push({ sessionId: session.id, maxW });
        });
      });
    return map;
  }, [safeSessions]);

  const sortedSessions = useMemo(() =>
    [...safeSessions].sort((a, b) => new Date(sessionDate(b)) - new Date(sessionDate(a))), [safeSessions]);

  const bodyWeightByDate = useMemo(() =>
    safeMetrics.reduce((acc, m) => { acc[m.date] = m.bodyWeight; return acc; }, {}), [safeMetrics]);

  if (safeSessions.length === 0 && safeMetrics.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[60vh] text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center">
          <Dumbbell className="w-8 h-8 text-brand-500" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Aún no hay datos</h2>
        <p className="text-sm text-zinc-500 max-w-xs">Registra tu primer entrenamiento desde la pestaña de Rutinas para ver tu progreso aquí.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 pb-10">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Progreso</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-0.5">Tu actividad y evolución en el tiempo</p>
      </div>

      {/* Selector de sección */}
      <div className="flex bg-zinc-100 dark:bg-zinc-800 rounded-xl p-1">
        {SECTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setSection(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-colors
              ${section === key
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {section === 'summary' && (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-2">
            <KpiCard label="Sesiones" value={kpis.sessionsThisMonth} sub="este mes" />
            <KpiCard
              label="Volumen"
              value={kpis.volThis > 0 ? `${(kpis.volThis / 1000).toFixed(1)}t` : '—'}
              sub={kpis.volDelta !== null ? (kpis.volDelta >= 0 ? `▲ +${kpis.volDelta}%` : `▼ ${kpis.volDelta}%`) : 'primer mes'}
              subColor={kpis.volDelta === null ? null : kpis.volDelta >= 0 ? 'green' : 'red'}
            />
            <KpiCard label="Racha" value={kpis.streak} sub={kpis.streak === 1 ? 'día' : 'días'} subColor={kpis.streak >= 3 ? 'green' : null} />
          </div>

          <MonthCalendar workoutDays={workoutDaysThisMonth} />
          <VolumeChart sessions={safeSessions} unit={unit} />
          <BodyWeightChart bodyMetrics={safeMetrics} unit={unit} />
        </div>
      )}

      {section === 'exercises' && (
        <ExerciseProgress
          completedSessions={safeSessions}
          exerciseLibrary={safeLibrary}
          unit={unit}
        />
      )}

      {section === 'records' && (
        <RecordsView
          completedSessions={safeSessions}
          exerciseLibrary={safeLibrary}
          unit={unit}
        />
      )}

      {section === 'history' && (
        sortedSessions.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-zinc-500">Todavía no has completado ningún entrenamiento.</p>
          </Card>
        ) : (
          <div className="space-y-1">
            {sortedSessions.map((session, sessionIndex) => {
              const dateObj = new Date(sessionDate(session));
              const day = dateObj.toLocaleDateString('es-ES', { day: '2-digit' });
              const month = dateObj.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
              const dayWeight = bodyWeightByDate[isoToDay(sessionDate(session))];
              const isLast = sessionIndex === sortedSessions.length - 1;

              return (
                <div key={session.id} className="flex gap-3 items-stretch">
                  <div className="flex flex-col items-center w-12 shrink-0">
                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-400 leading-none">{month}</span>
                    <span className="text-2xl font-black tracking-tighter leading-tight text-zinc-900 dark:text-zinc-100">{day}</span>
                    {!isLast && <div className="flex-1 w-px bg-zinc-200 dark:bg-zinc-800 mt-1 min-h-[1.5rem]" />}
                  </div>

                  <div className="flex-1 mb-4 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 p-4 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">{session.templateName}</p>
                      <button
                        onClick={() => setConfirmDeleteId(session.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        aria-label="Borrar sesión"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="space-y-2">
                      {session.exercises.map((exercise) => {
                        const name = exerciseIndex[exercise.exerciseId]?.name || 'Ejercicio';
                        const maxW = maxWeightForExercise(exercise);
                        // Comparar con la aparición anterior de ESTE ejercicio
                        const occurrences = occurrencesByExercise[exercise.exerciseId] || [];
                        const occIdx = occurrences.findIndex(o => o.sessionId === session.id);
                        const prevW = occIdx > 0 ? occurrences[occIdx - 1].maxW : null;
                        const delta = prevW !== null && maxW > 0 ? (maxW - prevW) : null;
                        const improved = delta !== null && delta > 0;

                        return (
                          <div key={exercise.id} className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{name}</p>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 flex flex-wrap gap-1">
                                {exercise.sets.map((s, si) => {
                                  const typeInfo = SET_TYPE_MAP[s.setType] || SET_TYPE_MAP.normal;
                                  return (
                                    <span key={si} className="inline-flex items-center gap-0.5">
                                      <span className={`text-[8px] font-black px-1 py-0.5 rounded ${typeInfo.color}`}>
                                        {typeInfo.short}
                                      </span>
                                      <span>{s.reps || '-'}×{s.weight || '-'}</span>
                                    </span>
                                  );
                                })}
                              </p>
                            </div>
                            <div className="flex flex-col items-end shrink-0">
                              {maxW > 0 && <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{maxW}{unit}</span>}
                              {delta !== null && delta !== 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5
                                  ${improved ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                  {improved ? `▲ +${delta.toFixed(1)}` : `▼ ${delta.toFixed(1)}`}
                                </span>
                              )}
                              {delta === 0 && <span className="text-[10px] text-zinc-400 mt-0.5">= igual</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {dayWeight && (
                      <div className="text-[10px] font-medium bg-zinc-50 dark:bg-zinc-950/60 rounded-lg px-3 py-2 text-zinc-500 flex items-center gap-1.5">
                        <Scale size={12} />
                        <span>Peso: <span className="text-zinc-900 dark:text-zinc-300 font-semibold">{dayWeight} {unit}</span></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="¿Borrar este entrenamiento?"
          message="Esta acción no se puede deshacer."
          confirmLabel="Borrar"
          danger
          onConfirm={() => { onDeleteSession?.(confirmDeleteId); setConfirmDeleteId(null); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
