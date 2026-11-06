export type StampProgram = {
  id: string;
  producto_id: string;
  nombre: string;
  unidades_requeridas: number;
  unidad_gratis: number;
  wallet_label: string | null;
  imagen_url: string | null;
  producto_nombre?: string | null;
};

export type StampProgressRow = {
  program_id: string;
  unidades_acumuladas: number;
  unidades_canjeadas: number;
  program?: StampProgram;
};

export type StampProgressView = {
  programId: string;
  productoId?: string;
  productoNombre?: string | null;
  imagenUrl?: string | null;
  label: string;
  accumulated: number;
  required: number;
  remaining: number;
  eligibleForFree: boolean;
  progressPct: number;
  availableFreeUnits?: number;
  totalAccumulated?: number;
  totalRedeemed?: number;
  cyclesCompleted?: number;
};

export type WalletGuardianSnapshot = {
  userId: string;
  displayName: string;
  tier: string;
  tierNombre?: string;
  tierIcono?: string;
  tierColorToken?: string;
  tierNarrativa?: string;
  ciclos: number;
  puntos: number;
  programs: StampProgressView[];
};

export type ApplePassConfig = {
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  description: string;
  foregroundColor: string;
  backgroundColor: string;
  logoText: string;
  webServiceURL?: string;
  authenticationToken?: string;
};