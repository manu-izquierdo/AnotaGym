import React, { useMemo, useState } from 'react';
import { Card } from '../UI/Card';
import { Trash2 } from 'lucide-react';

function isoToDay(isoDate) { return (isoDate || '').slice(0, 10); }
function sessionDate(session) { return session.finishedAt || session.startedAt; }
function calcVolume(exercises) {
  return exercises.reduce((acc, ex) =>
    acc + ex.sets.reduce((s, set) => s + (parseFloat(set.weight) || 0) * (parseInt(set.reps, 10) || 0), 0), 0);
}
function maxWeightForExercise(exercise) {
  return Math.max(0, ...exercise.sets.map(s => parseFloat(s.weight) || 0));
}

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
      byDay[k] = (byDay[k] || 0) + calcVolume(s.exercises);
    });
    return Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).map(([date, vol]) => ({ date, vol }));
  }, [sessions]);

  if (points.length < 2) return null;

  const maxVol = Math.max(...points.map(p => p.vol), 1);
  const w = 100, h = 100;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map(p => h - (p.vol / maxVol) * 80 - 10);
  const linePath = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  const areaPath = linePath + ` L ${xs[xs.length - 1]} ${h} L ${xs[0]} ${h} Z`;

  return (
    <Card className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Volumen por sesión</h3>
        <span className="text-xs text-zinc-500">{unit}</span>
      </div>
      <div className="h-24 w-full">
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="w-full h-full">
          <defs>
            <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#volGrad)" />
          <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r="2.5" fill="#6366f1" />)}
        </svg>
      </div>
      <div className="flex justify-between text-[9px] text-zinc-400 font-medium">
        <span>{new Date(points[0].date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
        <span>{new Date(points[points.length - 1].date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
      </div>
    </Card>
  );
}

function BodyWeightChart({ bodyMetrics, unit }) {
  if (!bodyMetrics || bodyMetrics.length === 0) {
    return (
      <Card className="space-y-2">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Peso corporal</h3>
        <p className="text-xs text-zinc-500">Registra tu peso en la pestaña Perfil para ver tu evolución.</p>
      </Card>
    );
  }
  const sorted = [...bodyMetrics].sort((a, b) => new Date(a.date) - new Date(b.date));
  const latest = sorted[sorted.length - 1];
  const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;
  const delta = prev ? (latest.bodyWeight - prev.bodyWeight).toFixed(1) : null;
  const isUp = delta !== null && parseFloat(delta) > 0;
  const isFlat = delta !== null && parseFloat(delta) === 0;
  const trendColor = isFlat ? '#a1a1aa' : isUp ? '#ef4444' : '#10b981';
  const trendLabel = delta === null ? null : isFlat ? '— Sin cambio' : isUp ? `▲ +${delta} ${unit}` : `▼ ${delta} ${unit}`;
  const trendCls = isFlat ? 'text-zinc-500' : isUp ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';

  let path = '', areaPath = '';
  if (sorted.length >= 2) {
    const maxW = Math.max(...sorted.map(m => m.bodyWeight));
    const minW = Math.min(...sorted.map(m => m.bodyWeight));
    const range = maxW - minW || 1;
    const pts = sorted.map((m, i) => ({
      x: (i / (sorted.length - 1)) * 100,
      y: 100 - ((m.bodyWeight - minW) / range) * 80 - 10,
    }));
    path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    areaPath = path + ` L ${pts[pts.length - 1].x} 100 L ${pts[0].x} 100 Z`;
  }

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
      {sorted.length >= 2 && (
        <div className="h-20 w-full">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
            <defs>
              <linearGradient id="wGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#wGrad)" />
            <path d={path} fill="none" stroke={trendColor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      <p className="text-[10px] text-zinc-500">{sorted.length} medidas · última el {new Date(latest.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function HistoryView({ completedSessions, exerciseLibrary, bodyMetrics, unit, onDeleteSession }) {
  const safeSessions = completedSessions || [];
  const safeMetrics = bodyMetrics || [];
  const safeLibrary = exerciseLibrary || [];

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

  const lastWeightByExercise = useMemo(() => {
    const map = {};
    [...safeSessions].sort((a, b) => new Date(sessionDate(a)) - new Date(sessionDate(b))).forEach(session => {
      session.exercises.forEach(ex => {
        const maxW = maxWeightForExercise(ex);
        if (maxW > 0) map[ex.exerciseId] = (map[ex.exerciseId] || []).concat(maxW);
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
        <div className="text-5xl">🏋️</div>
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

      {/* KPIs */}
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

      {/* Calendario */}
      <MonthCalendar workoutDays={workoutDaysThisMonth} />

      {/* Gráfico de volumen */}
      <VolumeChart sessions={safeSessions} unit={unit} />

      {/* Gráfico de peso corporal */}
      <BodyWeightChart bodyMetrics={safeMetrics} unit={unit} />

      {/* Timeline de sesiones */}
      {sortedSessions.length > 0 && (
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 px-1 mb-3">Historial de sesiones</h3>
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
                      onClick={() => {
                        if (window.confirm('¿Borrar este entrenamiento? Esta acción no se puede deshacer.')) {
                          onDeleteSession?.(session.id);
                        }
                      }}
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
                      const history = lastWeightByExercise[exercise.exerciseId] || [];
                      const globalSorted = [...safeSessions].sort((a, b) => new Date(sessionDate(a)) - new Date(sessionDate(b)));
                      const globalIdx = globalSorted.findIndex(s => s.id === session.id);
                      const prevWeightIdx = globalIdx;
                      const prevW = prevWeightIdx > 0 && history.length >= prevWeightIdx ? history[prevWeightIdx - 1] : null;
                      const delta = prevW !== null ? (maxW - prevW) : null;
                      const improved = delta !== null && delta > 0;
                      const declined = delta !== null && delta < 0;

                      return (
                        <div key={exercise.id} className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{name}</p>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                              {exercise.sets.map(s => `${s.reps || '-'}×${s.weight || '-'}`).join(' · ')}
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
                      <span>⚖️</span>
                      <span>Peso: <span className="text-zinc-900 dark:text-zinc-300 font-semibold">{dayWeight} {unit}</span></span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
