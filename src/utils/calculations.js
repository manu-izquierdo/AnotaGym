export const calculate1RM = (weight, reps) => {
  if (!weight || !reps || weight <= 0 || reps <= 0) return 0;
  // Fórmula de Brzycki: Peso × (36 / (37 - Repeticiones))
  // Solo es precisa hasta ~10 repeticiones, pero la usamos como estándar general.
  const oneRepMax = weight * (36 / (37 - reps));
  return Math.round(oneRepMax * 10) / 10; // Redondear a 1 decimal
};
