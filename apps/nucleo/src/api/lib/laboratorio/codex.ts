// Umbrales Codex Alimentarius para miel (CXS 12-1981):
// HMF ≤ 40 mg/kg (80 en tropicales); humedad ≤ 20%.

export const HMF_LIMITE_CODEX = 40;
export const HUMEDAD_UMBRAL_OPERATIVO = 20;

export function evaluarCodex(input: {
  hmf_mgkg?: number | null;
  humedad_pct?: number | null;
}): { bloqueado: boolean; alertaHumedad: boolean } {
  const hmf = Number(input.hmf_mgkg);
  const humedad = Number(input.humedad_pct);
  return {
    bloqueado: Number.isFinite(hmf) && hmf > HMF_LIMITE_CODEX,
    alertaHumedad: Number.isFinite(humedad) && humedad > HUMEDAD_UMBRAL_OPERATIVO,
  };
}
