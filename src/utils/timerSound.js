// Aviso sonoro del timer de descanso, generado con Web Audio (sin archivos).
//
// iOS solo permite reproducir audio si el AudioContext se creó/reanudó dentro
// de un gesto del usuario. Por eso primeTimerSound() se llama al arrancar el
// timer (el toque que completa la serie ES ese gesto) y deja el contexto listo
// para que el pitido de playTimerEndSound() suene segundos después sin gesto.

let audioCtx = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

/** Llamar dentro de un gesto del usuario (p. ej. al iniciar el descanso). */
export function primeTimerSound() {
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  // Buffer mudo de 1 frame: desbloquea la salida de audio en iOS
  const buffer = ctx.createBuffer(1, 1, 22050);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  try { source.start(0); } catch { /* ya desbloqueado */ }
}

function beep(ctx, freq, startAt, duration = 0.18, volume = 0.4) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  // Ataque y caída suaves para que no haga "click"
  gain.gain.setValueAtTime(0, startAt);
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Tres notas ascendentes: "descanso terminado, a por la siguiente serie". */
export function playTimerEndSound() {
  const ctx = getContext();
  if (!ctx) return;
  const play = () => {
    const now = ctx.currentTime;
    beep(ctx, 660, now);
    beep(ctx, 880, now + 0.22);
    beep(ctx, 1100, now + 0.44, 0.3);
  };
  if (ctx.state === 'suspended') {
    // Último intento de reanudar (en Android suele funcionar incluso sin gesto)
    ctx.resume().then(play).catch(() => {});
  } else {
    play();
  }
}
