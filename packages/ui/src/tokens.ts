export const tokens = {
  bosqueUlmo: '#0A3D2F',
  oroMiel: '#D4A017',
  cremaNatural: '#FDFBF7',
  negroTinta: '#1a1a1a',
} as const;

export type TokenKey = keyof typeof tokens;

export const hslTokens = {
  bosqueUlmo: '167 68% 14%',
  oroMiel: '44 85% 46%',
  cremaNatural: '35 60% 95%',
  negroTinta: '0 0% 4%',
  rojo: '0 72% 51%',
  verde: '145 63% 42%',
  azul: '204 70% 53%',
  amber: '38 92% 50%',
} as const;

export type HSLTokenKey = keyof typeof hslTokens;
