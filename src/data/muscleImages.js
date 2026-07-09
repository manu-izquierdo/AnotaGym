// Imágenes de alta calidad sin derechos de autor (Unsplash) optimizadas en tamaño.
// Las claves deben coincidir con los muscleGroup reales de las librerías:
// Pectoral, Espalda, Piernas, Hombros, Brazos, Core, Cuello
export const MUSCLE_IMAGES = {
  'Pectoral': 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=400&q=80',
  'Espalda': 'https://images.unsplash.com/photo-1603287681836-b174ce5074c2?auto=format&fit=crop&w=400&q=80',
  'Piernas': 'https://images.unsplash.com/photo-1434682881908-b43d0467b798?auto=format&fit=crop&w=400&q=80',
  'Hombros': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
  'Brazos': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80',
  'Bíceps': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80',
  'Tríceps': 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80',
  'Core': 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=400&q=80',
  'Cuello': 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=400&q=80',
  'Cardio': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=400&q=80',
  'Funcional': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80',
  'Movilidad': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=400&q=80',
  'Full Body': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=400&q=80',
  'default': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80'
};

export const getMuscleImage = (muscleGroup) => {
  return MUSCLE_IMAGES[muscleGroup] || MUSCLE_IMAGES['default'];
};
