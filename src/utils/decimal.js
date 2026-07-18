// La coma del teclado decimal de iOS no existe para <input type="number">:
// Safari la descarta antes de que llegue al onChange, así que "62,5" era
// imposible de teclear. Los campos de peso son type="text" + inputmode="decimal"
// y aquí se normaliza lo tecleado para que parseFloat (y Firestore) vean "62.5".

/** Cambia la coma decimal por punto (para campos donde se admite texto libre). */
export function normalizeDecimal(value) {
  return String(value ?? '').replace(',', '.');
}

/** Coma → punto y además solo dígitos y punto (para los campos de peso). */
export function sanitizeDecimal(value) {
  return normalizeDecimal(value).replace(/[^\d.]/g, '');
}
