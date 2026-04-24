const fs = require('fs');

const extendedLibraryPath = '/home/manu/Escritorio/gym-pwa/src/data/extendedLibrary.js';
const baseLibraryPath = '/home/manu/Escritorio/gym-pwa/src/data/exerciseLibrary.js';

// Leer archivos
let extendedRaw = fs.readFileSync(extendedLibraryPath, 'utf8');
let baseRaw = fs.readFileSync(baseLibraryPath, 'utf8');

// Extraer arrays
const extendedContent = extendedRaw.substring(extendedRaw.indexOf('['));
const extended = eval(extendedContent); // eval is safe here as it's our own code

const baseContent = baseRaw.substring(baseRaw.indexOf('['));
const base = eval(baseContent);

const matches = {};

// Keywords mapping (Spanish -> English keywords)
const dictionary = [
  { id: 'ex_001', match: 'Barbell_Bench_Press' },
  { id: 'ex_002', match: 'Barbell_Incline_Bench_Press' },
  { id: 'ex_003', match: 'Barbell_Decline_Bench_Press' },
  { id: 'ex_004', match: 'Dumbbell_Bench_Press' },
  { id: 'ex_005', match: 'Incline_Dumbbell_Press' },
  { id: 'ex_006', match: 'Dumbbell_Flyes' },
  { id: 'ex_007', match: 'Incline_Dumbbell_Flyes' },
  { id: 'ex_008', match: 'Cable_Crossover' },
  { id: 'ex_010', match: 'Butterfly' },
  { id: 'ex_011', match: 'Pushups' },
  { id: 'ex_014', match: 'Pullups' },
  { id: 'ex_016', match: 'Wide_Grip_Lat_Pulldown' },
  { id: 'ex_018', match: 'Bent_Over_Barbell_Row' },
  { id: 'ex_020', match: 'One_Arm_Dumbbell_Row' },
  { id: 'ex_021', match: 'Seated_Cable_Rows' },
  { id: 'ex_023', match: 'Barbell_Deadlift' },
  { id: 'ex_024', match: 'Barbell_Romanian_Deadlift' },
  { id: 'ex_027', match: 'Barbell_Squat' },
  { id: 'ex_028', match: 'Barbell_Front_Squat' },
  { id: 'ex_031', match: 'Leg_Press' },
  { id: 'ex_035', match: 'Barbell_Hip_Thrust' },
  { id: 'ex_037', match: 'Leg_Extensions' },
  { id: 'ex_038', match: 'Lying_Leg_Curls' },
  { id: 'ex_039', match: 'Seated_Leg_Curl' },
  { id: 'ex_045', match: 'Barbell_Shoulder_Press' },
  { id: 'ex_046', match: 'Dumbbell_Shoulder_Press' },
  { id: 'ex_047', match: 'Arnold_Dumbbell_Press' },
  { id: 'ex_048', match: 'Dumbbell_Lateral_Raise' },
  { id: 'ex_051', match: 'Face_Pull' },
  { id: 'ex_055', match: 'Barbell_Curl' },
  { id: 'ex_056', match: 'Dumbbell_Alternate_Bicep_Curl' },
  { id: 'ex_057', match: 'Hammer_Curls' },
  { id: 'ex_058', match: 'Concentration_Curls' },
  { id: 'ex_059', match: 'Preacher_Curl' },
  { id: 'ex_061', match: 'Triceps_Pushdown' },
  { id: 'ex_063', match: 'EZ_Bar_Skullcrusher' },
  { id: 'ex_065', match: 'Dips_Triceps_Version' },
  { id: 'ex_069', match: 'Crunches' },
  { id: 'ex_070', match: 'Cable_Crunch' },
  { id: 'ex_071', match: 'Hanging_Leg_Raise' },
  { id: 'ex_072', match: 'Plank' },
  { id: 'ex_084', match: 'Smith_Machine_Bench_Press' },
  { id: 'ex_085', match: 'Smith_Machine_Decline_Bench_Press' },
  { id: 'ex_013', match: 'Smith_Machine_Incline_Bench_Press' },
  { id: 'ex_029', match: 'Smith_Machine_Squat' },
  { id: 'ex_053', match: 'Smith_Machine_Shoulder_Press' },
];

const newBase = base.map(ex => {
  const match = dictionary.find(d => d.id === ex.id);
  if (match) {
    const target = extended.find(e => e.id.includes(match.match));
    if (target) {
      return { ...ex, imageUrl: target.imageUrl };
    }
  }
  return ex;
});

const output = `export const defaultExerciseLibrary = ${JSON.stringify(newBase, null, 2)};`;
fs.writeFileSync(baseLibraryPath, output);
console.log('Mapped images to base library');
