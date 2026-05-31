# Módulo Cierres de Caja · Comisiones Vanguardistas · Códigos de Invitación

> Documentación completa de la nueva capa de ventas en campo con comisiones conductuales y gestión de acceso al ecosistema.

---

## 0. Resumen Ejecutivo

Este módulo convierte la app Campo en una herramienta completa de venta en terreno donde un **rep de ventas** (contrato de honorarios) opera de forma autónoma: abre caja, registra ventas en 3 toques, ve sus comisiones crecer en tiempo real, y cierra caja con trazabilidad fiscal. El admin (gerente/tienda_admin) gestiona todo desde Nucleo: crea códigos de invitación para onboarding, asigna roles, configura reglas de comisión, reconcilia cajas y paga comisiones.

---

## 1. Arquitectura General

```
auth.users
├── profiles (role: 'rep_ventas')
├── user_roles (apilable: rep_ventas + vendedor + etc.)
├── usuarios_empresas (multi-tenant)
├── rep_profiles (extensión: tier, stats, streak)
│   └── cash_sessions (una/día, trazabilidad)
│       ├── ventas (linkeadas a session via cash_session_id)
│       │   └── commission_records (calculadas automáticamente por trigger)
│       └── commission_rules (configurables por admin)
├── invitation_codes (admin crea, rep canjea)
│   └── invitation_redemptions (audit trail)
└── rep_performance_view / rep_session_summary_view (vistas)
```

---

## 2. Archivos Creados/Modificados

### Migración (BD)
| Archivo | Descripción |
|---|---|
| `packages/database/supabase/migrations/28_cash_sessions_commissions_invitations.sql` | 6 tablas, 2 vistas, 4 funciones, 2 triggers, RLS, semilla |
| `packages/database/supabase/migrations/29_rep_tier_auto_evaluation.sql` | evaluar_tier_rep(), tier_progress_rep(), trigger, tier_override/tier_promoted_at |
| `packages/database/supabase/migrations/30_tier_bonus_commission.sql` | calcular_comision_venta() con tier_multiplier + seed tier_bonus |
| `packages/database/supabase/migrations/31_channel_rate_commissions.sql` | calcular_comision_venta() con channel_rate lookup + seed channel_rate |
| `packages/database/supabase/migrations/32_rls_hardening.sql` | 6 parches RLS (commission_rules split, rep_profiles soft-delete, etc.) |
| `packages/database/supabase/migrations/33_weekly_leaderboard.sql` | weekly_leaderboard() SECURITY DEFINER STABLE |

### BFF Routes (Hono en Nucleo)
| Archivo | Rutas | Descripción |
|---|---|---|
| `apps/nucleo/src/api/routes/cash-sessions.ts` | `POST /`, `GET /active`, `POST /:id/close`, `PATCH /:id/reconcile`, `GET /history`, `GET /:id`, `GET /export/csv` | Apertura, cierre, reconciliación, historial, CSV |
| `apps/nucleo/src/api/routes/rep-ventas.ts` | `POST /quick`, `GET /commission-status`, `GET /history` (week/month/quarter), `GET /tier-progress`, `GET /leaderboard` | Venta rápida (4 toques), estado comisiones, historial, tier, ranking |
| `apps/nucleo/src/api/routes/invitations.ts` | `POST /redeem`, `GET /validate/:code`, rutas admin: `POST /`, `GET /`, `PATCH /:id`, `DELETE /:id`, `GET /reps`, `PATCH /reps/:userId`, `DELETE /reps/:userId`, `POST /commissions/pay`, `GET /commissions` | Canje, validación, CRUD invitaciones, gestión reps, pago comisiones |
| `apps/nucleo/src/api/routes/commission-rules.ts` | `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`, `GET /dashboard` | CRUD reglas de comisión + dashboard |
| `apps/nucleo/app/api/[[...routes]]/route.ts` | **Modificado**: registra 4 nuevas rutas | `/api/cash-sessions`, `/api/rep-ventas`, `/api/invitations`, `/api/commission-rules` |

### Campo (UI - Mobile First)
| Archivo | Descripción |
|---|---|
| `apps/campo/src/components/pos/cash-context.tsx` | Context provider: sesión activa, comisiones, venta rápida, carrito, cliente |
| `apps/campo/src/components/pos/cash-session-panel.tsx` | UI: abrir caja, stats en vivo, barra multiplicador, TierBadge, ThresholdBanner, cerrar caja |
| `apps/campo/src/components/pos/quick-sale-button.tsx` | Venta rápida 4 toques: producto→cantidad→canal→pago |
| `apps/campo/src/components/pos/client-lookup-panel.tsx` | Buscar/crear cliente con debounce 300ms |
| `apps/campo/src/components/pos/tier-badge.tsx` | TierBadge (icon+label) + TierProgressBar + useTierProgress() hook |
| `apps/campo/src/components/pos/leaderboard-panel.tsx` | Leaderboard campo: top 3 cards (oro/plata/bronce) + lista |
| `apps/campo/src/components/pos/threshold-notification.tsx` | useThresholdNotification() + ThresholdNotificationBanner (≥80% y ≥100%) |
| `apps/campo/src/app/pos/historial/page.tsx` | 4 tabs: Curva volumen, Comisiones, Sesiones caja, Ranking |
| `apps/campo/src/app/pos/carrito/page.tsx` | Carrito dual (cartSale BFF / /api/pos/venta local), channel + metodo_pago |
| `apps/campo/src/app/pos/page.tsx` | Terminal POS con 3 links (Venta Rápida, Carrito, Historial) |

### Nucleo (UI - Admin Dashboard)
| Archivo | Descripción |
|---|---|
| `apps/nucleo/src/components/caja/CashSessionsPanel.tsx` | Dashboard sesiones caja + CSV export + alertas Δ ≥$10K |
| `apps/nucleo/src/components/reps/RepsPanel.tsx` | Gestión reps con tier override (checkbox admin) |
| `apps/nucleo/src/components/comisiones/ComisionesPanel.tsx` | Tabla comisiones con columnas Tier + Canal |
| `apps/nucleo/src/components/invitaciones/InvitacionesPanel.tsx` | CRUD códigos + historial redenciones |
| `apps/nucleo/src/components/reglas-comision/ReglasComisionPanel.tsx` | Editor 6 rule_types (editores especiales channel_rate + tier_bonus) |
| `apps/nucleo/src/components/leaderboard/LeaderboardPanel.tsx` | Admin leaderboard: stat cards + top 3 + tabla completa |
| `apps/nucleo/src/components/layout/Sidebar.tsx` | 6 entradas nuevas filtradas por rol (gerente/tienda_admin) |
| `apps/nucleo/app/(dashboard)/leaderboard/page.tsx` | Ruta leaderboard |

---

## 3. Tablas Nuevas (Esquema)

### `cash_sessions`
| Columna | Tipo | Descripción |
|---|---|---|
| `id` | UUID PK | |
| `empresa_id` | UUID FK → empresas | Multi-tenant |
| `rep_id` | UUID FK → auth.users | Vendedor |
| `opened_at` | TIMESTAMPTZ | Timestamp apertura |
| `closed_at` | TIMESTAMPTZ | Timestamp cierre |
| `opening_cash` | NUMERIC(19,4) | Efectivo declarado al abrir |
| `closing_cash_counted` | NUMERIC(19,4) | Efectivo físico contado al cerrar |
| `closing_cash_expected` | NUMERIC GENERATED | Calculado: opening + ventas efectivo |
| `cash_difference` | NUMERIC GENERATED | Delta: contado - esperado (trazado) |
| `session_status` | TEXT | `open` → `closed` → `reconciled` |
| `reconciled_by` | UUID FK | Admin que confirma |
| `notas` | TEXT | Observaciones |

### `commission_rules`
| Columna | Tipo | Descripción |
|---|---|---|
| `empresa_id` | UUID FK | Multi-tenant |
| `rule_type` | TEXT | `base`, `channel_rate`, `volume_threshold`, `loyalty`, `streak`, `tier_bonus` |
| `name` | TEXT | Nombre visible |
| `parameter` | JSONB | Config flexible: `{rate: 0.10}`, `{threshold: 50000, multiplier: 1.4}` |
| `active` | BOOLEAN | Activar/desactivar sin borrar |
| `priority` | INT | Orden de evaluación |

### `commission_records` (Ledger Inmutable)
| Columna | Tipo | Descripción |
|---|---|---|
| `empresa_id` | UUID FK | |
| `session_id` | UUID FK → cash_sessions | |
| `venta_id` | UUID FK → ventas | |
| `rep_id` | UUID FK → auth.users | |
| `base_commission` | NUMERIC | % de la venta |
| `volume_multiplier` | NUMERIC | ×1.0, ×1.2, ×1.4, ×1.6 |
| `loyalty_bonus` | NUMERIC | Cliente recurrente |
| `streak_bonus` | NUMERIC | Racha de días consecutivos |
| `total_commission` | NUMERIC | Suma final |
| `tier_multiplier` | NUMERIC DEFAULT 1.0 | ×1.0–×1.3 según tier |
| `channel_rate` | NUMERIC | % comisión por canal (si aplica) |
| `paid` | BOOLEAN | Pendiente → pagado |
| `paid_at` / `paid_by` | TIMESTAMPTZ / UUID | Auditoría de pago |

### `invitation_codes`
| Columna | Tipo | Descripción |
|---|---|---|
| `empresa_id` | UUID FK | |
| `code` | TEXT UNIQUE | Código de 8 chars (generado) |
| `created_by` | UUID FK | Admin que crea |
| `roles` | TEXT[] | Roles que se asignan al canjear |
| `tools` | JSONB | Herramientas específicas habilitadas |
| `max_uses` | INT | Límite de usos (null = ilimitado) |
| `current_uses` | INT | Contador automático |
| `expires_at` | TIMESTAMPTZ | Expiración opcional |
| `active` | BOOLEAN | Desactivar sin borrar |

### `invitation_redemptions` (Audit)
| Columna | Tipo | Descripción |
|---|---|---|
| `invitation_id` | UUID FK | |
| `user_id` | UUID FK | |
| `redeemed_at` | TIMESTAMPTZ | |
| `roles_assigned` | TEXT[] | Snapshot de roles al momento del canje |
| `tools_assigned` | JSONB | Snapshot de herramientas |

### `rep_profiles`
| Columna | Tipo | Descripción |
|---|---|---|
| `user_id` | UUID UNIQUE FK | |
| `empresa_id` | UUID FK | |
| `display_name` | TEXT | Nombre visible |
| `commission_tier` | TEXT | `base` → `senior` → `elite` → `legend` |
| `tier_override` | TEXT | Override manual admin (null = automático) |
| `tier_promoted_at` | TIMESTAMPTZ | Último ascenso automático |
| `fixed_monthly` | NUMERIC | Monto fijo honorarios |
| `total_commissions_earned` | NUMERIC | Acumulado histórico |
| `total_commissions_paid` | NUMERIC | Ya pagado |
| `total_sales_lifetime` | INT | Número de ventas |
| `total_revenue_lifetime` | NUMERIC | Revenue generado |
| `clients_captured` | INT | Clientes originados |
| `current_streak_days` | INT | Racha actual |
| `best_streak_days` | INT | Mejor racha histórica |
| `active` | BOOLEAN | Admin puede desactivar |

### Extensiones a `ventas`
| Columna | Tipo | Descripción |
|---|---|---|
| `cash_session_id` | UUID FK → cash_sessions | Linkeo a sesión |
| `channel` | TEXT | `feria`, `delivery`, `local`, `corporativo`, `web`, `referido` |
| `is_new_client` | BOOLEAN | Para comisión de fidelización |
| `rep_commission_base` | NUMERIC | Comisión base de esta venta |
| `rep_commission_multiplier` | NUMERIC | Multiplicador aplicado |
| `rep_commission_loyalty` | NUMERIC | Bonus fidelización |
| `rep_commission_total` | NUMERIC | Comisión total de esta venta |

---

## 4. Funciones de BD

| Función | Tipo | Descripción |
|---|---|---|
| `generar_codigo_invitacion(empresa_id)` | SECURITY DEFINER | Genera código único de 8 chars |
| `canjear_codigo_invitacion(code, user_id)` | SECURITY DEFINER | Valida, asigna roles, crea rep_profile, incrementa usos |
| `calcular_comision_venta(venta_id, empresa_id)` | SECURITY DEFINER | Motor de comisiones: ((base × vol_mult) + loyalty + streak) × tier_multiplier, channel_rate lookup |
| `actualizar_streak_rep(rep_id)` | SECURITY DEFINER | Verifica sesión cerrada hoy, actualiza racha |
| `evaluar_tier_rep(p_user_id)` | SECURITY DEFINER | Evaluación automática de tier (solo sube, nunca baja) |
| `tier_progress_rep(p_user_id)` | SECURITY DEFINER | Progreso hacia siguiente tier |
| `weekly_leaderboard(p_empresa_id)` | SECURITY DEFINER STABLE | Top 20 reps por comisiones semanales |
| `on_venta_calc_comision()` | TRIGGER | Ejecuta `calcular_comision_venta` al insertar venta |
| `on_cash_session_close_streak()` | TRIGGER | Actualiza streak al cerrar sesión |
| `on_rep_profile_tier_check()` | TRIGGER | Re-evaluación automática de tier al actualizar métricas |

---

## 5. Sistema de Comisiones — Mecanismo Conductual

Inspirado en DTC premium, agentes de terreno de marcas que funcionan sin supervisión. La clave: **el vendedor ve su ganancia creciendo en tiempo real** — eso es lo que mueve el cuerpo.

### Fórmula Final

```
total = ((base_rate × volume_mult) + loyalty_bonus + streak_bonus) × tier_multiplier
```

- `base_rate`: si existe `channel_rate` para el canal → usa ese; si no → base rate global
- `volume_mult`: $0–49K→×1.0, $50K–99K→×1.2, $100K–199K→×1.4, ≥$200K→×1.6
- `loyalty_bonus`: 3% si cliente recurrente (`is_new_client = false`)
- `streak_bonus`: 7d→$5K, 14d→$15K, 30d→$50K
- `tier_multiplier`: base=1.0, senior=1.1, elite=1.2, legend=1.3
- `channel_rate`: feria=10%, delivery=8%, local=10%, corporativo=12%, referido=9%, web=7%

### 6 Capas Superpuestas

| Capa | Lógica | Default | Config en |
|---|---|---|---|
| **Comisión base** | % sobre cada venta | 10% del precio neto | `commission_rules` rule_type=base |
| **Channel rate** | % diferenciado por canal | feria=10%, delivery=8%, corporativo=12% | `commission_rules` rule_type=channel_rate |
| **Multiplicador de volumen** | Escala al cruzar umbrales diarios | >$50K→×1.2, >$100K→×1.4, >$200K→×1.6 | `commission_rules` rule_type=volume_threshold |
| **Comisión de fidelización** | Cliente recurrente vuelve | +3% adicional | `commission_rules` rule_type=loyalty |
| **Bonus por racha** | Días consecutivos con cierre de caja | 7d→$5K, 14d→$15K, 30d→$50K | `commission_rules` rule_type=streak |
| **Tier multiplier** | Multiplicador por nivel de rep | base=×1.0, senior=×1.1, elite=×1.2, legend=×1.3 | `commission_rules` rule_type=tier_bonus |

El multiplicador de volumen es el **mecanismo conductual clave**: crea asimetría de recompensa que se activa tarde en el día, cuando ya tiene momentum. El tier multiplier amplifica todo — legend gana ×1.3 sobre todo lo anterior.

### Cálculo Automático (Trigger)

Cada INSERT en `ventas` con `cash_session_id` dispara:
1. Lee `commission_rules` de la empresa (prioridad ascendente)
2. Busca `channel_rate` para el canal de la venta; si existe, usa ese como base_rate; si no, usa rate global
3. Calcula comisión base = total × base_rate
4. Suma ventas del día → aplica multiplicador del umbral más alto alcanzado
5. Si `is_new_client = false` → suma bonus loyalty
6. Si `current_streak_days >= 7` → suma bonus streak
7. Busca `tier_multiplier` según `commission_tier` del rep (tier_bonus rule)
8. Total = ((base × vol_mult) + loyalty + streak) × tier_multiplier
9. Escribe `commission_records` (incluye tier_multiplier + channel_rate) + actualiza `rep_profiles`

---

## 6. Flujo del Rep (Campo)

```
1. Abre app Campo → ve "Abrir Caja"
2. Declara efectivo inicial → sesión abierta
3. Selecciona producto → cantidad → canal → método de pago → VENTA (4 toques)
4. Ve en tiempo real: ventas, ingresos, comisión acumulada, barra hacia próximo multiplicador
5. TierBadge muestra su nivel; TierProgressBar muestra progreso al siguiente tier
6. ThresholdNotification: banner fijo al cruzar ≥80% del umbral
7. Al cerrar: cuenta efectivo → ingresa monto → sistema calcula diferencia
8. Resumen: ventas por canal, comisiones del día, delta de caja, tier, channel rates
9. Historial: 4 tabs (Curva volumen, Comisiones, Sesiones caja, Ranking leaderboard)
10. Estado: "pendiente de revisión" → tú confirmas → reconciled
```

---

## 7. Flujo del Admin (Nucleo)

### Códigos de Invitación
```
1. Admin crea código: elige roles, herramientas, usos máximos, expiración
2. Comparte código al nuevo rep
3. Rep se registra en la app → canjea código → queda bajo los roles asignados
4. Admin ve redenciones, puede desactivar/eliminar códigos
```

### Gestión de Reps
```
1. Ver todos los reps: stats, tier, ventas, comisiones, racha
2. Editar: tier, monto fijo, notas, activar/desactivar
3. Eliminar: quita acceso al ecosistema
```

### Comisiones
```
1. Ver todas las comisiones: filtrar por rep, pagadas/pendientes
2. Pagar comisiones: selecciona IDs → marca como pagadas → actualiza rep_profiles
3. Exportable para cuadrar con boleta de honorarios del rep
```

### Reglas de Comisión
```
1. CRUD completo: crear, editar, activar/desactivar, eliminar
2. Parámetros flexibles via JSONB
3. Dashboard: reglas activas, pendientes por pagar, top reps
```

---

## 8. RLS — Resumen (Post-Hardening Migration 32)

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `cash_sessions` | rep propio + admin | rep (abrir) | rep (propios, open) + admin (closed/reconciled) | bloqueado |
| `commission_records` | rep propio + admin | service_role / admin | admin (paid/paid_at) | bloqueado |
| `commission_rules` | `has_empresa_access()` | admin (gerente/tienda_admin) | admin | solo gerente |
| `invitation_codes` | admin | admin | admin | admin |
| `invitation_redemptions` | admin | service_role / auth.uid()=user_id | — | — |
| `rep_profiles` | propio + admin | propio (auth.uid()=user_id) | propio (activo) + admin | bloqueado (soft-delete) |

---

## 9. Marco Legal-Fiscal (Chile)

- **Contrato de honorarios**: Rep emite boleta mensual por monto fijo + comisiones devengadas
- **Retención 10.75%** si supera umbral exento (~$792K CLP/mes bruto 2024); si está bajo, puede pedir exención
- **Registro en OYZ**: Las comisiones quedan documentadas en `commission_records` como base de cálculo antes de que él emita boleta
- **Deducible**: Tú registras el gasto como honorarios en el libro — deducible de la base imponible del EIRL
- **Caja**: Fondo fijo diario inicial (él declara al abrir), cuadre al cierre (efectivo contado vs registrado), diferencia trazada no oculta

---

## 10. Planes a Futuro

### Fase 2 — UI Admin en Nucleo ✅
- [x] Página `/caja` en Nucleo: dashboard de sesiones de caja con filtros por fecha/rep/estado
- [x] Página `/reps` en Nucleo: gestión completa de reps (CreadoresAdminPanel como referencia)
- [x] Página `/invitaciones` en Nucleo: CRUD de códigos + historial de redenciones
- [x] Página `/comisiones` en Nucleo: tabla de comisiones con pago masivo
- [x] Página `/reglas-comision` en Nucleo: editor de reglas con preview
- [x] Sidebar entries nuevas filtradas por rol (gerente/tienda_admin)

### Fase 3 — UI Rep en Campo ✅
- [x] Integrar `CashProvider` en el layout del POS (`apps/campo/src/app/pos/layout.tsx`)
- [x] Integrar `CashSessionPanel` en la página principal del POS
- [x] Venta rápida 4 toques: `QuickSaleButton` en catálogo (producto→cantidad→canal→método de pago)
- [x] Identificación de cliente: buscar/crear con nombre+contacto en el flujo de venta (`ClientLookupPanel`)
- [x] Pantalla de historial: 4 tabs (Curva/Comisiones/Sesiones/Ranking) con tier + channel badges
- [x] Notificación umbral multiplicador: `ThresholdNotificationBanner` (≥80% y ≥100%)
- [x] TierBadge + TierProgressBar con `useTierProgress()` hook
- [x] LeaderboardPanel campo (top 3 cards + lista resto)
- [x] Carrito integrado con cash session + channel + metodo_pago selectors

### Fase 4 — Tier + Channel + RLS + Leaderboard ✅
- [x] Tier automático: `evaluar_tier_rep()` + `tier_progress_rep()` + trigger (Migration 29)
- [x] Tier bonus comisión: `calcular_comision_venta()` con tier_multiplier (Migration 30)
- [x] Comisiones por canal diferenciadas: channel_rate lookup en `calcular_comision_venta()` (Migration 31)
- [x] RLS hardening: 6 parches — commission_rules split, commission_records INSERT restrict, rep_profiles soft-delete, cash_sessions UPDATE restrict (Migration 32)
- [x] Leaderboard semanal: `weekly_leaderboard()` + BFF endpoint + Campo LeaderboardPanel + Nucleo LeaderboardPanel (Migration 33)
- [x] Rate limiting en `POST /rep-ventas/quick` (30 req/min, in-memory)
- [x] CSV export de sesiones de caja (`GET /cash-sessions/export/csv`)
- [x] Alertas Δ automáticas cuando `cash_difference` excede ≥$10K CLP
- [x] Admin override tier: checkbox en RepsPanel
- [x] ReglasComisionPanel: editores especiales channel_rate (6 inputs %) + tier_bonus (4 inputs ×N)

### Fase 5 — Offline Real (pendiente)
- [ ] Implementar `@enjambre/offline` (Dexie) para ventas sin conexión
- [ ] Sync queue que purga al recuperar conexión
- [ ] Conflict resolution para ventas offline que se sincronizan
- [ ] Cierre de caja offline con reconciliación diferida

### Fase 6 — Pulido y Seguridad
- [ ] QuickSale enhanced: mostrar tier_multiplier + channel_rate real-time post-venta
- [ ] Animaciones GSAP en TierBadge al subir de tier
- [ ] Log de acciones sensibles (cambio de tier, pago de comisiones, eliminación de reps)
- [ ] Rotación de códigos de invitación (auto-expirar después de X días)
- [ ] Rate limiter multi-instance (Redis o Upstash)
- [ ] Integración con `@enjambre/contable` para registro automático de honorarios como gasto

---

## 11. Decisiones de Diseño

| Decisión | Razón |
|---|---|
| `closing_cash_expected` y `cash_difference` como GENERATED ALWAYS STORED | Inmutabilidad: el sistema calcula, no el usuario. La diferencia queda trazada permanentemente. |
| `commission_records` como ledger inmutable (solo INSERT, no DELETE) | Auditoría fiscal: las comisiones son base de cálculo para boletas de honorarios. |
| `canjear_codigo_invitacion` como SECURITY DEFINER | Necesita escribir en `user_roles`, `usuarios_empresas`, `rep_profiles` y `invitation_redemptions` en una transacción atómica. |
| Multiplicadores como reglas configurables (JSONB) en vez de hardcoded | Cada empresa puede tener umbrales distintos. El admin ajusta sin tocar código. |
| `channel` en ventas en vez de reutilizar `origen` | `origen` ya existe con valores `web/feria/local`, pero `channel` es más granular para el contexto del rep. |
| Streak bonus como monto fijo en vez de % | El bonus por racha es una recompensa por consistencia, no por volumen. Monto fijo evita distorsiones. |
| Tier solo sube, nunca baja | Motivación: el rep nunca pierde progreso. Solo acumula. El admin puede override si necesita corregir. |
| Fórmula con tier_multiplier al final (×no +) | El tier amplifica todo el esfuerzo del día. Un legend gana ×1.3 sobre base+vol+loyalty+streak. Es la recompensa más alta. |
| channel_rate override del base_rate | Si la empresa configura rate por canal, ese toma precedencia sobre el rate base. Corporativo (12%) premia la relación B2B. |
| RLS hardened: commission_records INSERT = service_role/admin | El trigger calcula e inserta comisiones. El rep nunca escribe directamente — evita manipulación. |
| RLS hardened: rep_profiles DELETE = bloqueado (soft-delete) | Los reps se desactivan (active=false), no se eliminan. Preserva historial fiscal. |
| Rate limiter in-memory (30/min) | Simple, sin infra extra. No funciona en multi-instance — migrar a Redis cuando se escale. |
| Leaderboard SECURITY DEFINER STABLE | Ejecuta como superusuario para leer commission_records de todos los reps de la empresa. STABLE = optimizable. |

---

*Ultima actualizacion: Mayo 2026*
*Migraciones: `28` → `29` (tier) → `30` (tier_bonus) → `31` (channel_rate) → `32` (RLS hardening) → `33` (leaderboard)*
*Fases completadas: 1 → 2 → 3 → 4 | Pendiente: 5 (Offline) → 6 (Pulido)*
