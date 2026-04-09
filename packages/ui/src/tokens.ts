/** Tokens de marca: bosque ulmo, oro miel, crema, tinta */
export const tokens = {
  bosqueUlmo: '#0A3D2F',
  oroMiel: '#D4A017',
  cremaNatural: '#FDFBF7',
  negroTinta: '#1a1a1a',
} as const;

export type TokenKey = keyof typeof tokens;
