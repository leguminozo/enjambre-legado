# Checklist ops — roles, patio, territorio (post PR0–PR6 + hardening)

**Cuándo usar:** antes de confiar el slice en staging/prod o de crear usuarios reales.

---

## 1. Migraciones (bloqueante)

Aplicar en el proyecto Supabase del entorno:

| Archivo | Qué hace |
|---------|----------|
| `packages/database/supabase/migrations/20260811000000_apicultor_platform_role.sql` | CHECK `profiles.role` incluye `apicultor` |
| `packages/database/supabase/migrations/20260811010000_invitation_platform_roles.sql` | `canjear_codigo_invitacion` escribe `profiles.role` + `handle_new_user` patio |

Verificar:

```sql
-- Constraint
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'profiles_role_check';

-- Función canje existe y es SECURITY DEFINER
SELECT prosecdef FROM pg_proc WHERE proname = 'canjear_codigo_invitacion';
```

---

## 2. Smoke por rol (mínimo)

| Rol | Login → home | Debe poder | No debe |
|-----|--------------|------------|---------|
| **admin** | `/inicio` ejecutivo | editor-tienda, contable, invitaciones | — |
| **apicultor** | `/inicio` patio | colmenas, cuaderno, bitácora, config (3 tabs) | contable, editor-tienda, CRM |
| **territorial api_*** | `/inicio` red apícola | territorio, mis-planes, fenología | menú censo comunal |
| **territorial institucion** | `/inicio` institución | censo comunal, territorio, fenología | mis-planes en menú |
| **rep_ventas** | Campo `/pos` | POS | dashboard gerencial nucleo |
| **cliente** | Tienda catálogo | tienda | nucleo admin |

Patio aislamiento:

1. Usuario A crea colmena → B (`apicultor`) no la ve (RLS).  
2. B no llama bitácora de A (BFF filtra `user_id`).

---

## 3. Política de invitaciones (seguridad)

| Caso | Regla |
|------|--------|
| Código con `admin` | **max_uses = 1**, **TTL ≤ 7 días** (forzado en BFF + panel) |
| Preferencia admin | **Crear cuenta directa** (service role), no código multi-uso |
| Patio | `role=apicultor` por invitación o crear cuenta |
| Tras canje | `RedeemInviteForm` (Config → Personal o Invitaciones) → `redeemInvitationCode` + reload |
| CRUD códigos | **Solo BFF** `GET/POST/PATCH/DELETE /api/invitations` (panel unificado) |

---

## 4. JWT / sesión

- Tras cambiar `profiles.role`, el trigger `trg_sync_profile_role_to_auth` actualiza `app_metadata.role`.  
- El middleware lee JWT primero: **sin refresh** el usuario puede ver menú viejo unos segundos.  
- Usar `redeemInvitationCode()` o, tras crear cuenta y login, un `checkUser()` limpio.

---

## 5. Bitácora patio

| Check | Estado |
|-------|--------|
| Banner sync en shell | admin + apicultor |
| Un solo motor de sync | `BitacoraSyncProvider` |
| Transcript manual | RecorderVoz opción B |
| STT | Opcional / no bloqueante |

---

## 6. Deuda consciente (no bloquear MVP)

Ver `docs/ROLES_Y_ACCESO.md` § riesgos:

- Sub-rol territorial en BFF: familia `minimo` ya bloquea escrituras no-inscripción.  
- `@enjambre/auth` aún lee `actores_registro` (acoplamiento dominio).  
- e2e multi-usuario RLS aún no automatizado.  
- Oleada 2b menús (técnico, agri…).

## 7. Residuo FE↔BE (cerrado en código)

| Ítem | Estado |
|------|--------|
| CRUD invitaciones unificado BFF | ✅ GET/POST/PATCH/DELETE |
| Crear cuenta vía `apiFetch` | ✅ |
| UI canje código | ✅ Config → Personal + Invitaciones |
| Auto-STT tras sync audio | ✅ best-effort; off con `NEXT_PUBLIC_BITACORA_AUTO_STT=false` |
| Migraciones + `GROQ_API_KEY` en entorno | ⏳ ops (no código) |

---

## 7. Commit recomendado

Aislar el slice de roles del resto del working tree (campo/b2b/infusiones ajenos). Mensaje sugerido:

```
feat(auth): RoleKey apicultor, territorio 2a, bitácora patio e invitaciones seguras

- RoleKey apicultor + guards/shell/BFF/RLS audit docs
- Territorial oleada 2a menus + BFF write gate minimo
- Invitaciones: admin 1 uso/7d; canje con refreshSession helper
- Bitácora: banner, transcript manual, BitacoraSyncProvider
```
