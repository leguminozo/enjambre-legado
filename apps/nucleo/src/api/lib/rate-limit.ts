/**
 * RATE LIMIT EN MEMORIA (FACHADA LOCAL PARA RUTAS PÚBLICAS)
 * Re-exporta el limitador en memoria de `@enjambre/rate-limit`.
 * 
 * USO APROPIADO: Rutas públicas de consulta de bajo riesgo o alta frecuencia
 * (ej. `/api/meteo`, `/api/censo-publico`, endpoint base del router).
 * 
 * ADVERTENCIA DE SEGURIDAD (NO USAR PARA RUTAS CRÍTICAS):
 * Para endpoints con impacto financiero, autenticación o webhooks distribuidos:
 * USAR `@/api/lib/ratelimit` (sin guión), el cual implementa Upstash Redis distribuido
 * con sliding-window multi-instancia en Vercel.
 */
export { rateLimit, getIdentifierFromRequest, cleanupRateLimitMap } from '@enjambre/rate-limit';

