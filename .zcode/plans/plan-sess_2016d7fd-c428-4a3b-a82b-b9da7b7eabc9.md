# Fase inicial del censo territorial — registro legal completo (Ley 21.489 + ordenanza tipo)

## Diagnóstico (verificado en código)

- El signup territorial crea perfil + actor (trigger 999) con solo: rol, comuna, región, consentimientos. **Faltan todos los campos legales**: RUT, teléfono, RUP con vigencia, prácticas sanitarias, método de control de varroa, declaración de existencia animal, apiarios con sector/paraje + n° colmenas, aceptación de la Carta y la política de datos.
- **Bug confirmado**: `GET /actores/me` devuelve `{ data: [...] }` (array, sin `.single()`), pero `TerritorioHomeView`, `InscripcionActorForm`, `AlertaFitosanitariaForm` y `TerritorioUsuarioPanel` lo tratan como objeto → el hub muestra "Aún no estás en el Registro" estando inscrito y la emisión de alertas usa un `actor_id` dummy.
- `InscripcionActorForm` ofrece roles que no existen en el CHECK de la DB (`predio_agricultor`, `brigada_sanitaria`) → POST rechazado por zod.
- El consentimiento `acopio_cooperativo` no tiene checkbox en el signup. El CTA de la landing no abre el registro directo. Los eventos de seguridad del signup usan `appSource: 'nucleo'`.

## Fase 1 — Migraciones

### 1.1 `1003_territorial_censo_legal.sql`
- `ALTER TABLE actores_registro ADD COLUMN IF NOT EXISTS`: `rut TEXT`, `telefono TEXT`, `practicas_sanitarias TEXT`, `metodo_control_varroa TEXT`, `declaracion_existencia_animal BOOLEAN NOT NULL DEFAULT false`, `acepta_carta BOOLEAN NOT NULL DEFAULT false`, `acepta_politica_datos BOOLEAN NOT NULL DEFAULT false`, `completo BOOLEAN NOT NULL DEFAULT false`.
- `CREATE TABLE apiarios_registro`: `actor_id → actores_registro CASCADE`, `nombre`, `comuna NOT NULL`, `zona NOT NULL` (sector/paraje), `lat_aproximada`/`lng_aproximada` (~1 km, patrón 991), `n_colmenas INTEGER NOT NULL CHECK (>0)`, `categoria CHECK ('produccion','polinizacion','seleccion_cria','otro') DEFAULT 'produccion'`, `activo`, `observaciones`, timestamps. Índices por actor_id/comuna + trigger `update_updated_at_column()`.
- **RLS** (patrón 991/1002): `apiarios_registro_own` (FOR ALL, `actor_id IN (SELECT id FROM actores_registro WHERE user_id = auth.uid()) OR public.is_admin()`) + `apiarios_registro_community_read` (SELECT: `activo AND auth.role()='authenticated' AND EXISTS(... consentimientos->>'mapa_comunitario' = 'true')` — la escalera de visibilidad de la Carta).
- `ALTER TABLE predios_facilitadores ADD COLUMN IF NOT EXISTS rol_predio TEXT` (rol catastral).
- **Reescribir `handle_new_user()`** (CREATE OR REPLACE, la última versión gana — patrón del repo): leer de la metadata del signup `territorial_acepta_carta` y `territorial_acepta_politica_datos` y guardarlas en el insert de `actores_registro`. Preservar la lógica de referidos de la 999.

### 1.2 `1004_certificados_sanitarios_bucket.sql`
- Bucket `certificados-sanitarios` (privado, patrón de la migración 02) + policies en `storage.objects`: owner (auth.uid()) y `is_admin()` para select/insert/update/delete.

## Fase 2 — BFF (`apps/nucleo/src/api/routes/registro-territorial.ts`)

- **Fix bug**: `GET /actores/me` → `.maybeSingle()` (devuelve `{ data: actor | null }`). Los 4 consumidores funcionan sin cambios.
- **Schemas ampliados**: `CreateActorSchema` + `rut` (con `refine(validarRUT)` de `@enjambre/contable` — ya se usa así en `terceros.ts`), `telefono`, `practicas_sanitarias`, `metodo_control_varroa`, `declaracion_existencia_animal`, `acepta_carta`, `acepta_politica_datos`, `completo`. PATCH = partial (ya existe), **añadir validación UUID del param `:id`**.
- **Nueva sección APIARIOS**: `GET /apiarios` (RLS filtra: propios + comunitarios consentidos — alimenta el mapa), `POST /apiarios` (resuelve el actor propio; 400 si no hay actor), `PATCH /apiarios/:id`.
- **Regla de la ordenanza Art. 14**: en `POST /apiarios-externos`, si hay `cert_sanitaria_fecha`, validar ≤ 30 días antes de `fecha_ingreso` (error claro). Aceptar `cert_sanitaria_lab`.
- **Certificado**: el GET de apiarios-externos propios incluye URL firmada del PDF (createSignedUrl 1h) cuando `cert_sanitaria_url` es un path del bucket.

## Fase 3 — UI

### 3.1 Signup (paso 1) — `login/page.tsx`
- Checkboxes obligatorios **"Acepto la Carta Constitutiva Apícola Territorial"** y **"Acepto la política de datos y privacidad"** (con enlace a página pública `/carta`); se envían como `territorial_acepta_carta`/`territorial_acepta_politica_datos` en la metadata.
- Añadir el checkbox faltante de `acopio_cooperativo` (4 consentimientos completos).
- `signup_success` logueado con `appSource: 'nucleo_territorial'`.
- Landing (`app/page.tsx`): CTA "Inscribirse · Acceso" → `/login?mode=signup` (abre el registro directo).

### 3.2 Página pública de la Carta
- `apps/nucleo/app/carta/page.tsx` (server, estática, tokens semánticos) con el texto de la Carta Constitutiva v0.2 (preámbulo + artículos 1-14, Capa A). Registrar `/carta` en `publicRoutes` del middleware.

### 3.3 Wizard de inscripción legal (paso 2) — en `/territorio`
- **Nuevo** `apps/nucleo/src/components/apicultor/CensoLegalWizard.tsx`, integrado en el tab "Mi Registro" de `TerritorioHomeView` cuando `!actor.completo`, con checklist de pasos (cada uno guarda PATCH inmediato, se puede entrar y salir):
  1. **Identidad**: RUT (con validación de dígito verificador), teléfono, RUP, ✅ declaración de existencia animal.
  2. **Actividad**: prácticas sanitarias + método de control de varroa (textos con placeholders orientadores).
  3. **Mis Apiarios**: lista + formulario (sector/paraje, comuna, n° colmenas, categoría producción/polinización/selección_cría/otro, coordenadas aproximadas opcionales).
  4. **Completar**: checklist final → PATCH `acepta_carta: true, acepta_politica_datos: true, completo: true` (validando que lo requerido esté).
- **Gating suave**: banner de progreso fijo en el hub; "Declarar Ingreso" (trashumancia) y "Registrar Predio" se bloquean con mensaje claro "Completa tu inscripción legal para declarar" si `!completo`; el mapa y las alertas (recibir/emitir — obligación legal del Art. 18) quedan siempre disponibles.

### 3.4 Formularios existentes
- `InscripcionActorForm`: corregir roles inválidos (`predio_agricultor` → `prop_facilitador`, `brigada_sanitaria` → `tecnico_inspector`), añadir RUT (validado), teléfono y checkboxes de Carta/política.
- `ApiarioExternoForm`: añadir laboratorio, n° de documento y **adjuntar PDF** (upload a `certificados-sanitarios` con el JWT del usuario → path en `cert_sanitaria_url`).

### 3.5 Mapa y vista admin
- `MapaTerritorialBase.tsx`: capa nueva "Apiarios del Registro" (🐝 con n° de colmenas, círculos ~1 km) recibiendo `apiariosRegistro` (prop opcional — no rompe usos actuales).
- `RegistroTerritorialView.tsx`: pasar los apiarios-registro al mapa y badge "censo completo/incompleto" en la lista de actores.

## Fase 4 — Tipos y verificación
- `packages/database/database.types.ts`: intentar `pnpm --filter @enjambre/database db:typegen` (requiere supabase link); si no está disponible, editar manualmente las filas de `actores_registro` + nueva tabla `apiarios_registro` (verificando `database.types.test.ts` antes).
- Verificar: `pnpm --filter @enjambre/database test` y `pnpm --filter @enjambre/nucleo build`.

## Fuera de alcance (documentado)
- Página `/perfil` para territorial (consentimientos gestionables ahí) — la Carta exige gestión posterior de consentimientos; se documenta como deuda.
- Sidebar por rol, flujo de lotes/QR, `lotes_read USING (true)` (ya documentados).