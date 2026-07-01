export type MoonPhaseIndex = 0 | 1 | 2 | 3;

const PHASE_NAMES = ['Luna Nueva', 'Cuarto Creciente', 'Luna Llena', 'Cuarto Menguante'] as const;

/** Approximate moon phase index from date (0–3). */
export function getMoonPhaseIndex(date = new Date()): MoonPhaseIndex {
  const lunarCycleSec = 2_551_443;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14, 0);
  const phase = (((date.getTime() - knownNewMoon) / 1000) % lunarCycleSec) / lunarCycleSec;
  const normalized = phase < 0 ? phase + 1 : phase;
  if (normalized < 0.03 || normalized > 0.97) return 0;
  if (normalized < 0.25) return 1;
  if (normalized < 0.5) return 2;
  if (normalized < 0.75) return 3;
  return 1;
}

export function getMoonPhaseName(date = new Date()): string {
  return PHASE_NAMES[getMoonPhaseIndex(date)];
}