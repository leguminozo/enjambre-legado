# Mapa Operativo — bitácora geo-temporal inspirada en Trama

## Concepto
El Mapa del Legado deja de ser markers estáticos y se vuelve un **visor geo-temporal**: el admin navega el territorio por fecha y cada entidad cuenta su historia. Tres piezas sobre los datos existentes (Trama ya está en la DB: `1006 bitacora_apicola` + `GET /api/bitacora/colmenas/:id`).

## Pieza A — Timeline temporal global (navegar el territorio en el tiempo)
- Selector de mes/año + botón "Hoy" en el mapa (estilo del selector de capas existente).
- Filtra por su ventana temporal, en memoria:
  - **Trashumantes**: visibles si `fecha_ingreso ≤ t ≤ COALESCE(fecha_salida, ∞)` — el territorio "en esa fecha".
  - **Alertas fitosanitarias**: `fecha_programada` dentro de ±7 días de `t` (con su Circle de radio de 3 km sobre los apiarios).
  - **Ferias/eventos**: `fecha_inicio` dentro del mes de `t`.
  - **Cosechas (nueva capa temporal)**: puntos con kg y floración geolocalizados vía `cosechas → colmenas → apiarios` (lat/lng), para el mes de `t`. La cosecha como evento en el espacio-tiempo.
- "Hoy" muestra el estado operativo actual (comportamiento por defecto).

## Pieza B — Trayectorias trashumantes (el movimiento en el espacio-tiempo)
- `Polyline` de react-leaflet (nuevo import, soportado) por cada trashumante activo: **comuna origen → destino** (lat/lng aprox del destino + coords de la comuna origen resueltas reutilizando el resolver de `@/lib/cliente-coords`, extendiéndolo con comunas de Chiloé si falta).
- Popup de la trayectoria: actor, ruta, n° colmenas, fechas ingreso/salida, certificado (fecha/lab).

## Pieza C — Ficha geo-temporal del apiario (la bitácora en el mapa)
- Clic en un apiario (propio 🐝 o del censo comunal) abre un **panel lateral** (overlay derecho) con su línea de vida:
  - Cabecera: nombre, sector, coordenadas.
  - **Línea de vida cronológica unificada**: inspecciones (con fase y cuadros), tratamientos (con fin de retiro), cosechas (kg, floración → lote), pesos, varroa — ordenados por fecha, con icono por tipo (patrón de ColmenaFicha).
  - Gráficos de varroa y peso (recharts LineChart, patrón existente).
  - Colmenas del apiario con su última inspección.
- **BFF nuevo** `apps/nucleo/src/api/routes/mapa.ts`: `GET /historial/apiario/:id` (authMiddleware + requireProfileRole admin) que consolida en una llamada: apiario + colmenas con series anidadas (`inspecciones/varroa_records/peso_records`) + `cosechas` (con `fecha, kg, floracion, lote_id`) + `tratamientos` y `reina_history` (tablas de la 1006). Montar en `route.ts` como `/api/mapa`.

## Capas territoriales (del plan anterior, integradas al timeline)
- Alertas ⚠️ (Circle de radio), Trashumantes 🚚, Predios 🌿, Apiarios del censo 🐝 — con sus toggles en el panel de capas y entrada en la leyenda. Los 4 endpoints de `/api/registro-territorial` ya existen (admin lee todo por RLS).

## Archivos
1. **Nuevo**: `apps/nucleo/src/api/routes/mapa.ts` (+ montaje en `route.ts`).
2. **Editar**: `apps/nucleo/src/components/map/MapaLegadoBase.tsx` (timeline, trayectorias, capas, panel lateral, leyenda).
3. **Editar** (si falta cobertura): `apps/nucleo/src/lib/cliente-coords.ts` (comunas de Chiloé para trayectorias).

## Fuera de alcance
- El cruce "alerta → bloquear lotes" (Riesgo Fitosanitario en Producción) queda como siguiente costura.
- Sin migraciones nuevas (la 1006 ya existe; verificar que `database.types.ts` la incluya — si no, ajuste de tipos manual como en fases anteriores).

## Verificación
- `pnpm --filter @enjambre/nucleo build` (typecheck).
- Revisión manual: timeline "Hoy" vs mes pasado, trayectoria trashumante, ficha lateral con línea de vida.