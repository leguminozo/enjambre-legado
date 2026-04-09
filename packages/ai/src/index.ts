export type PredictFloracionInput = { colmenaId: string; mes: string };

/** Placeholder: sustituir por Edge Function + modelo (OpenRouter, etc.) */
export async function predictFloracion(
  _input: PredictFloracionInput
): Promise<{ flujoIndex: number; nota: string }> {
  return {
    flujoIndex: 0,
    nota: 'Conectar La Reina vía Supabase Edge u OpenRouter en producción.',
  };
}
