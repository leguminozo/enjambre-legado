# Confianza: seguridad, tenancy, datos

> **Clase: LEY** (postura) + **OPS** (dónde está el control).
> Auditoría puntual: [`AUDITORIA_PROFUNDA_2026-08.md`](./AUDITORIA_PROFUNDA_2026-08.md). Roles: [`ROLES_Y_ACCESO.md`](./ROLES_Y_ACCESO.md). Secretos: [`ENV-CHECKLIST.md`](./ENV-CHECKLIST.md).

## Postura

La seguridad vive en **Postgres (RLS)** y en el **BFF**. El cliente es hostil. `user_metadata` es autodeclarable. `oyz_role` no eleva a admin. Service role nunca viaja al browser.

Hobby/Free no es un control de seguridad: es un techo de cuota. Un proyecto pausado no “está seguro”; está apagado.

## Controles que ya son ley

| Control | Dónde | Regla |
|---|---|---|
| RLS en toda tabla de usuario | migraciones | Sin policy = no merge |
| Helpers `STABLE` + `search_path = ''` | `jwt_app_role`, `is_admin`, `current_role`, `has_empresa_access` | DEFINER solo con check de caller |
| `getUser()` no `getSession()` para gates | auth | Firma validada en servidor |
| `INTERNAL_API_SECRET` en prod | 3 apps | Sin fallback a service_role |
| Webhooks | `webhooks.ts`, banco HMAC | TBK = `commit`; no HMAC inventado |
| CSRF + middleware | Tienda / Núcleo | No desactivar “para el editor” |
| Rate limit | `@enjambre/rate-limit` + Upstash si hay | Webhooks y AI sí o sí |
| Uploads | Storage policies + `owner` / admin | WebP; no SVG ejecutable en CMS sin mime check |
| IA | `AI_NUCLEO` | Scope por `auth.uid()`; kill `AI_ENABLED` |

`SECURITY DEFINER` es cambio de identidad, no un `EXPLAIN`. Playbook de abuso: auditoría agosto 2026 (signup `app_source`, puntos, retiros, códigos).

## Tenancy

Un proyecto Supabase. N `empresas`. El aislamiento contable es `has_empresa_access(empresa_id)`, no un schema por cliente.

- Patio / censo / perfiles de marca OYZ conviven en el mismo Postgres.
- No hay “segundo proyecto Free de staging siempre encendido” (límite: 2 proyectos; pause). Staging = preview Vercel + cuidado con la misma DB, o un proyecto 2 que se va a dormir.
- Un admin de plataforma ≠ todos los tenants. No uses `is_admin()` para saltarte empresa salvo pantallas que son explícitamente globales.

## Mapa de datos personales

| Dato | Dónde | Sale del perímetro |
|---|---|---|
| Email / nombre / rol | `auth.users`, `profiles` | JWT a las 3 apps |
| Dirección / pedidos | Tienda + `ventas` | Mail (Resend) si hay key |
| Teléfono / WhatsApp | perfil, notificaciones | Twilio si está configurado |
| Audio bitácora | Storage + Groq STT | **Sí, a Groq** — consentimiento |
| Chat IA patio | BFF → Groq | **Sí, a Groq** — solo scope propio |
| P12 / clave SII / Banco / SumUp | UI Núcleo, cifrado `SII_CLAVE_ENCRYPTION_KEY` (≥32) | Nunca al client en claro |
| Consentimientos censo | `actores_registro.consentimientos` | Capa pública solo si `true` (Ley 21.719) |
| Avatares / fotos producto | Storage público + cache 1 año | CDN Supabase |
| Errores Tienda | Sentry | PII posible en breadcrumbs — no loguear tokens |
| Pagos | PSP (Flow/TBK/SumUp) | No guardamos PAN |

Páginas legales de tienda (`/privacidad`, `/cookies`, `/terminos`) tienen que **nombrar** Groq, Sentry, PSP y WhatsApp si están encendidos. Si apagas un proveedor, el copy también.

## Retención (Free obliga a ser tacaño)

- `security_events`, `notification_queue`, logs de job: no son eternos en disco de 500 MB. Si no hay job de purge, **el disco se llena y el proyecto queda read-only**.
- Auth logs Free: 1 hora. No investigues un login de la semana pasada ahí.
- No guardes CAF/P12 de más en Storage sin cifrar.

Cuando exista un cron de purge, anótalo aquí. Hoy el riesgo es crecimiento silencioso.

## Amenazas que el producto ya tuvo (no olvidar)

1. Signup que se auto-asigna `rep_ventas` / `territorial` vía `app_source`.
2. RPC DEFINER con `p_user_id` del caller (puntos, retiros).
3. Retry POS online con `client_request_id` nuevo → cobro doble.
4. `INTERNAL_API_SECRET` = service_role (cerrado en prod; no reabrir).
5. Image Optimization / egress como DoS de cuota.

Verificar en código, no en la memoria del snapshot.

## Cómo tocar seguridad

Cambio de RLS o DEFINER = migración + nota en `DATABASE_SCHEMA` + test de policy si existe. Cambio de webhook = test de firma + replay. Cambio de secretos = rotar en **3** proyectos Vercel + GitHub Actions secrets (CI las usa).
