import React, { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Gráfica de línea interactiva y legible:
 *  - Eje Y con 3 valores de referencia y líneas de guía
 *  - Eje X con fechas (3 o 5 según el ancho disponible)
 *  - Puntos tocables: al pulsar uno se muestra su detalle debajo
 *    (por defecto queda seleccionado el último punto)
 *  - El mejor valor (isBest) se resalta con un anillo
 *
 * Responsive: mide su contenedor con ResizeObserver y dibuja a escala 1:1
 * (1 unidad SVG = 1px), así el texto y los puntos tienen el mismo tamaño
 * en un móvil de 360px que en un portátil.
 *
 * Tolerante a fallos: descarta valores no numéricos y si quedan menos de
 * 2 puntos muestra un mensaje en lugar de romper.
 *
 * points: [{ date: 'YYYY-MM-DD'|ISO, value: number, detail?: string, isBest?: boolean }]
 */

const H = 190;
const PAD = { top: 16, right: 12, bottom: 24, left: 42 };
const MAX_POINTS = 60;

function fmtShort(value) {
  if (!Number.isFinite(value)) return '—';
  if (Math.abs(value) >= 10000) return `${(value / 1000).toLocaleString('es-ES', { maximumFractionDigits: 1 })}k`;
  return value.toLocaleString('es-ES', { maximumFractionDigits: 1 });
}

function fmtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function fmtDateLong(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ProgressChart({ points, unit = '', emptyMessage = 'Aún no hay suficientes datos para dibujar la gráfica.' }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width;
      if (w) setWidth(Math.max(260, Math.round(w)));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const clean = useMemo(() => {
    const valid = (points || []).filter((p) => p && Number.isFinite(Number(p.value)) && p.date);
    return valid.slice(-MAX_POINTS).map((p) => ({ ...p, value: Number(p.value) }));
  }, [points]);

  const [selected, setSelected] = useState(clean.length - 1);

  // Al cambiar la serie (otro ejercicio, otra métrica…) seleccionar el último punto
  useEffect(() => {
    setSelected(clean.length - 1);
  }, [clean]);

  if (clean.length < 2) {
    return (
      <div className="h-32 flex items-center justify-center text-center px-6">
        <p className="text-xs text-zinc-500 leading-relaxed">{emptyMessage}</p>
      </div>
    );
  }

  const values = clean.map((p) => p.value);
  let yMin = Math.min(...values);
  let yMax = Math.max(...values);
  if (yMin === yMax) {
    const pad = Math.abs(yMin) * 0.1 || 1;
    yMin -= pad;
    yMax += pad;
  } else {
    const pad = (yMax - yMin) * 0.12;
    yMin -= pad;
    yMax += pad;
  }

  const innerW = width - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const xAt = (i) => PAD.left + (clean.length === 1 ? innerW / 2 : (i / (clean.length - 1)) * innerW);
  const yAt = (v) => PAD.top + innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const linePath = clean.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i).toFixed(1)} ${yAt(p.value).toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L ${xAt(clean.length - 1).toFixed(1)} ${PAD.top + innerH} L ${xAt(0).toFixed(1)} ${PAD.top + innerH} Z`;

  const yTicks = [yMin, (yMin + yMax) / 2, yMax];

  // Con más ancho caben más fechas en el eje X
  const labelCount = Math.min(clean.length, width >= 520 ? 5 : 3);
  const xLabelIdx = [...new Set(
    Array.from({ length: labelCount }, (_, i) => Math.round((i / (labelCount - 1)) * (clean.length - 1)))
  )];

  const colW = innerW / Math.max(clean.length - 1, 1);
  const sel = clean[selected] || null;

  return (
    <div ref={containerRef} className="space-y-2" style={{ color: 'rgb(var(--brand-500))' }}>
      <svg viewBox={`0 0 ${width} ${H}`} width={width} height={H} className="max-w-full select-none" role="img">
        <defs>
          <linearGradient id="pcArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Guías + eje Y */}
        {yTicks.map((t) => (
          <g key={t}>
            <line
              x1={PAD.left} x2={width - PAD.right} y1={yAt(t)} y2={yAt(t)}
              className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth="1" strokeDasharray="3 4"
            />
            <text x={PAD.left - 6} y={yAt(t) + 3} textAnchor="end" fontSize="10" className="fill-zinc-400 dark:fill-zinc-500 font-medium">
              {fmtShort(t)}
            </text>
          </g>
        ))}

        {/* Eje X: fechas repartidas */}
        {xLabelIdx.map((i) => (
          <text
            key={i} x={xAt(i)} y={H - 6} fontSize="10"
            textAnchor={i === 0 ? 'start' : i === clean.length - 1 ? 'end' : 'middle'}
            className="fill-zinc-400 dark:fill-zinc-500 font-medium"
          >
            {fmtDate(clean[i].date)}
          </text>
        ))}

        {/* key = la ruta: al cambiar de serie la animación de dibujado se repite */}
        <path key={`a-${linePath}`} d={areaPath} fill="url(#pcArea)" className="chart-fade" />
        <path key={`l-${linePath}`} d={linePath} pathLength="1" className="chart-draw" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Línea vertical del punto seleccionado */}
        {sel && (
          <line
            x1={xAt(selected)} x2={xAt(selected)} y1={PAD.top} y2={PAD.top + innerH}
            stroke="currentColor" strokeWidth="1" strokeDasharray="2 3" opacity="0.5"
          />
        )}

        {/* Puntos */}
        {clean.map((p, i) => (
          <g key={i}>
            {p.isBest && (
              <circle cx={xAt(i)} cy={yAt(p.value)} r="7" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
            )}
            <circle
              cx={xAt(i)} cy={yAt(p.value)} r={i === selected ? 5 : 3}
              fill="currentColor"
              className={i === selected ? '' : 'opacity-70'}
              stroke={i === selected ? 'white' : 'none'} strokeWidth={i === selected ? 1.5 : 0}
            />
            {/* Zona de pulsación amplia (móvil) */}
            <rect
              x={xAt(i) - colW / 2} y={0} width={colW} height={H} fill="transparent"
              onClick={() => setSelected(i)} style={{ cursor: 'pointer' }}
            />
          </g>
        ))}
      </svg>

      {/* Detalle del punto seleccionado */}
      {sel && (
        <div className="rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 px-3 py-2.5 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-zinc-500 capitalize">{fmtDateLong(sel.date)}</span>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {sel.value.toLocaleString('es-ES', { maximumFractionDigits: 1 })} {unit}
              {sel.isBest && (
                <span className="ml-1.5 text-[9px] font-black uppercase tracking-wider text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-1.5 py-0.5 rounded-full align-middle">
                  Récord
                </span>
              )}
            </span>
          </div>
          {sel.detail && <p className="text-[11px] text-zinc-500 leading-relaxed">{sel.detail}</p>}
        </div>
      )}
    </div>
  );
}
