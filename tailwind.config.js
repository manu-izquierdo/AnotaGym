/** @type {import('tailwindcss').Config} */

// Todos los colores de la interfaz salen de variables CSS que define la
// paleta activa (src/theme/palettes.js). Así las clases zinc/white/emerald
// de siempre se entonan solas con la paleta elegida, en claro y en oscuro.
const fromVar = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (prefix, shades) =>
  Object.fromEntries(shades.map((s) => [s, fromVar(`${prefix}-${s}`)]));

const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'Inter', 'sans-serif'],
        display: ['"DM Sans"', 'Figtree', 'sans-serif'],
      },
      colors: {
        // Grises entonados con la paleta (las tarjetas usan white = ui-0)
        white: fromVar('ui-0'),
        zinc: scale('ui', SHADES),
        // Primario de la paleta
        brand: scale('brand', SHADES),
        // Acento de la paleta (series completadas, éxitos, deltas positivos)
        emerald: scale('accent', SHADES),
        // Texto sobre fondos brand/accent: blanco u oscuro según luminosidad
        'on-brand': fromVar('brand-contrast'),
        'on-accent': fromVar('accent-contrast'),
      }
    },
  },
  plugins: [],
}
