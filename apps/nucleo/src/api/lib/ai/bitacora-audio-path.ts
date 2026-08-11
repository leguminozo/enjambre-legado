/**
 * Normaliza audio_url de voice_inspection_captures al path del bucket bitacora-audio.
 * El motor de sync guarda paths relativos: `{userId}/{client_request_id}.m4a`
 * También tolera URLs firmadas o públicas que contengan `/bitacora-audio/`.
 */

export function resolveBitacoraStoragePath(audioUrl: string): string | null {
  const raw = audioUrl.trim();
  if (!raw) return null;

  // URL completa con segmento de bucket
  const marker = "/bitacora-audio/";
  const idx = raw.indexOf(marker);
  if (idx >= 0) {
    const rest = raw.slice(idx + marker.length).split("?")[0] ?? "";
    return rest.replace(/^\//, "") || null;
  }

  // Path relativo ya canónico
  if (!raw.includes("://")) {
    return raw.replace(/^\//, "") || null;
  }

  // URL sin marker reconocible — no adivinar
  return null;
}
