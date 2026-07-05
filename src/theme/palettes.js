// ─── Paletas de color de AnotaGym ────────────────────────────────────────────
// Cada paleta define sus 5 colores base en claro y en oscuro; de ahí se
// generan TODAS las variables CSS que consume Tailwind (ver tailwind.config):
//   --ui-*     escala de grises entonada con la paleta (sustituye a zinc)
//   --brand-*  escala del color primario (botones, pestaña activa, gráficas)
//   --accent-* escala del color de acento (series completadas, éxitos, deltas)
// En oscuro la superficie de tarjeta es más clara que el fondo (profundidad),
// y el texto sobre botones pastel es oscuro cuando el color es muy luminoso.

const WHITE = '#ffffff';
const BLACK = '#000000';

export const PALETTES = {
  terracota: {
    name: 'Terracota y pistacho',
    light: { bg: '#FBF6F2', surface: '#FEFCFA', primary: '#D99B7C', accent: '#B7CBAA', text: '#3A2E26' },
    dark:  { bg: '#201B17', surface: '#2A241F', primary: '#DBA183', accent: '#A8C097', text: '#F2EBE4' },
  },
  coral: {
    name: 'Coral y verde botella',
    light: { bg: '#FCF5F1', surface: '#FEFBF9', primary: '#E19A7C', accent: '#8FB39E', text: '#402F24' },
    dark:  { bg: '#1E1A18', surface: '#282220', primary: '#E68A6C', accent: '#7FB8A8', text: '#F5EDE9' },
  },
  rosa: {
    name: 'Rosa empolvado',
    light: { bg: '#FBF4F6', surface: '#FEFBFC', primary: '#D593A9', accent: '#A3B8CB', text: '#3C2E34' },
    dark:  { bg: '#211B1E', surface: '#2B2428', primary: '#DCA0B5', accent: '#96AFC4', text: '#F4EDF0' },
  },
  ciruela: {
    name: 'Ciruela y salvia',
    light: { bg: '#F8F5F7', surface: '#FDFCFD', primary: '#B896A8', accent: '#C7D4BE', text: '#3A2F36' },
    dark:  { bg: '#1E1A1D', surface: '#282328', primary: '#C4A0B4', accent: '#AFC4A4', text: '#F1EBEF' },
  },
  lavanda: {
    name: 'Lavanda y ámbar',
    light: { bg: '#F6F5FA', surface: '#FCFCFE', primary: '#8F80C9', accent: '#D8B95F', text: '#322E40' },
    dark:  { bg: '#1B1B22', surface: '#25252F', primary: '#A99CDE', accent: '#E3C97C', text: '#EDEBF5' },
  },
  menta: {
    name: 'Menta y coral',
    light: { bg: '#F2F8F5', surface: '#FAFDFB', primary: '#63B394', accent: '#E19B7E', text: '#263831' },
    dark:  { bg: '#1C1F1E', surface: '#262B29', primary: '#7FC9AE', accent: '#E8A98F', text: '#EAF2EF' },
  },
  acero: {
    name: 'Azul acero y arena',
    light: { bg: '#F3F6F9', surface: '#FBFCFD', primary: '#5D8FB4', accent: '#CE9878', text: '#26313A' },
    dark:  { bg: '#1A1D21', surface: '#24282D', primary: '#7CA8C7', accent: '#D6A88F', text: '#EDF1F4' },
  },
  mostaza: {
    name: 'Mostaza y petróleo',
    light: { bg: '#FBF8F1', surface: '#FEFCF8', primary: '#E3C26E', accent: '#9DBFC0', text: '#3D3421' },
    dark:  { bg: '#1E1B14', surface: '#28241B', primary: '#E3C26E', accent: '#9DBFC0', text: '#F3EFE2' },
  },
};

export const DEFAULT_PALETTE_ID = 'terracota';

// Usuarios con un acento de la época anterior (violeta, azul…) aterrizan
// en la paleta nueva más parecida en espíritu.
const LEGACY_ACCENTS = {
  violet: 'lavanda',
  blue: 'acero',
  emerald: 'menta',
  rose: 'rosa',
  orange: 'terracota',
  cyan: 'acero',
  amber: 'mostaza',
  pink: 'rosa',
};

export function resolvePaletteId(id) {
  if (PALETTES[id]) return id;
  return LEGACY_ACCENTS[id] || DEFAULT_PALETTE_ID;
}

// ─── Utilidades de color ─────────────────────────────────────────────────────

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Mezcla a→b en proporción t (0 = a, 1 = b). Devuelve hex. */
function mixHex(a, b, t) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  const rgb = ra.map((c, i) => Math.round(c + (rb[i] - c) * t));
  return '#' + rgb.map((c) => c.toString(16).padStart(2, '0')).join('');
}

/** "R G B" — el formato que esperan las variables de Tailwind. */
function triplet(hex) {
  return hexToRgb(hex).join(' ');
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

// ─── Generación de variables ─────────────────────────────────────────────────

function buildVars(spec, mode) {
  const { bg, surface, primary, accent, text } = spec;
  const dark = mode === 'dark';
  const vars = {};

  // Escala de grises entonada (--ui-*, sustituye a zinc)
  if (!dark) {
    vars['ui-0'] = surface;   // tarjetas (antes bg-white)
    vars['ui-50'] = bg;       // fondo de la app
    [[100, 0.06], [200, 0.12], [300, 0.22], [400, 0.42], [500, 0.55], [600, 0.67], [700, 0.77], [800, 0.87]]
      .forEach(([shade, t]) => { vars[`ui-${shade}`] = mixHex(bg, text, t); });
    vars['ui-900'] = text;
    vars['ui-950'] = mixHex(text, BLACK, 0.35);
  } else {
    vars['ui-0'] = WHITE;
    vars['ui-50'] = mixHex(text, WHITE, 0.55);
    vars['ui-100'] = text;
    [[200, 0.10], [300, 0.20], [400, 0.38], [500, 0.50], [600, 0.60]]
      .forEach(([shade, t]) => { vars[`ui-${shade}`] = mixHex(text, bg, t); });
    vars['ui-700'] = mixHex(text, surface, 0.78); // bordes marcados
    vars['ui-800'] = mixHex(text, surface, 0.89); // bordes sutiles y chips
    vars['ui-900'] = surface;                     // tarjetas
    vars['ui-950'] = bg;                          // fondo de la app
  }

  // Escala del primario (--brand-*). En oscuro el botón (600) ES el pastel.
  const brandShades = dark
    ? { 50: [WHITE, 0.85], 100: [WHITE, 0.72], 200: [WHITE, 0.55], 300: [WHITE, 0.30], 400: [WHITE, 0.12], 500: [WHITE, 0.08], 600: [null, 0], 700: [BLACK, 0.15], 800: [BLACK, 0.30], 900: [BLACK, 0.45], 950: [BLACK, 0.68] }
    : { 50: [WHITE, 0.90], 100: [WHITE, 0.80], 200: [WHITE, 0.68], 300: [WHITE, 0.45], 400: [WHITE, 0.20], 500: [null, 0], 600: [BLACK, 0.12], 700: [BLACK, 0.26], 800: [BLACK, 0.40], 900: [BLACK, 0.52], 950: [BLACK, 0.66] };
  const brandHex = {};
  Object.entries(brandShades).forEach(([shade, [target, t]]) => {
    brandHex[shade] = target ? mixHex(primary, target, t) : primary;
    vars[`brand-${shade}`] = brandHex[shade];
  });

  // Escala del acento (--accent-*, sustituye a emerald)
  const accentShades = dark
    ? { 50: [WHITE, 0.85], 100: [WHITE, 0.70], 200: [WHITE, 0.55], 300: [WHITE, 0.32], 400: [WHITE, 0.10], 500: [null, 0], 600: [BLACK, 0.12], 700: [BLACK, 0.28], 800: [BLACK, 0.45], 900: [BLACK, 0.60], 950: [BLACK, 0.72] }
    : { 50: [WHITE, 0.88], 100: [WHITE, 0.76], 200: [WHITE, 0.60], 300: [WHITE, 0.40], 400: [WHITE, 0.18], 500: [null, 0], 600: [BLACK, 0.25], 700: [BLACK, 0.40], 800: [BLACK, 0.52], 900: [BLACK, 0.62], 950: [BLACK, 0.72] };
  const accentHex = {};
  Object.entries(accentShades).forEach(([shade, [target, t]]) => {
    accentHex[shade] = target ? mixHex(accent, target, t) : accent;
    vars[`accent-${shade}`] = accentHex[shade];
  });

  // Texto sobre botones/chips de color: blanco por defecto; oscuro cuando el
  // color es muy luminoso (pasteles en oscuro, o la mostaza en claro).
  const threshold = dark ? 0.58 : 0.72;
  const darkInk = dark ? mixHex(bg, BLACK, 0.5) : text;
  vars['brand-contrast'] = luminance(brandHex[600]) > threshold ? darkInk : WHITE;
  vars['accent-contrast'] = luminance(accentHex[500]) > threshold ? darkInk : WHITE;

  // A tripletas "R G B" para rgb(var(--x) / alpha)
  return Object.fromEntries(Object.entries(vars).map(([k, v]) => [k, triplet(v)]));
}

/** Bloque CSS `:root{...}` + `:root.dark{...}` para la paleta dada. */
export function buildPaletteCss(palette) {
  const block = (spec, mode) =>
    Object.entries(buildVars(spec, mode)).map(([k, v]) => `--${k}:${v};`).join('');
  return `:root{${block(palette.light, 'light')}}\n:root.dark{${block(palette.dark, 'dark')}}`;
}
