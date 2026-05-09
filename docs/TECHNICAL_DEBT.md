# Manifiesto de Deuda Tecnica — Enjambre Legado

> Puntos de friccion, redundancia y fragilidad tecnica. Priorizados por riesgo.

---

## CRITICO — Resolver antes de produccion

### D1. Redundancia en el Monorepo: Carpetas "Copia de..."

**Problema**: Existen multiples directorios como `apps/nucleo/Copia de Cafeteria Eureka!`, `Copia de Verano Eccomerce?`, etc.

**Impacto**: Confusion en git, desperdicio de espacio, riesgo de importar logica obsoleta.

**Accion**: Purga total tras verificar que no existan assets unicos.

**Prioridad**: ALTA — Bloquea la claridad del monorepo.

**Archivos**:
```
apps/nucleo/Copia de Cafeteria Eureka!/     → ELIMINAR
apps/nucleo/Copia de Verano Eccomerce?/      → ELIMINAR
```

---

### D2. Componentes en la Raiz vs Monorepo

**Problema**: `components/shop/` en la raiz del proyecto mientras otros estan en `apps/tienda/components`.

**Impacto**: Rompe la convencion de monorepo, dificulta la reutilizacion.

**Accion**: Migrar a `packages/ui` (si es compartido) o `apps/tienda/components` (si es especifico).

**Prioridad**: ALTA — Los agentes se confunden con la estructura.

---

### D3. Version de Next.js Inestable (Tienda)

**Problema**: `next: ^16.2.1` es experimental o mal declarada. Causa errores de compatibilidad con linting y TypeScript.

**Impacto**: Errores silenciosos en build, dificultad para actualizar dependencias.

**Accion**: Evaluar downgrade a Next.js 15.x estable o fijar version exacta tras test de regresion completo.

**Prioridad**: ALTA — Puede romper produccion.

**Archivos**: `apps/tienda/package.json`

---

### D4. No Existen Tests Automatizados

**Problema**: No hay unit tests ni tests de integracion para flujos criticos.

**Impacto**: Riesgo EXTREMO de rotura en produccion tras actualizacion de dependencias. Especialmente critico en:
- Checkout + Transbank (dinero real)
- Calculo de IVA e impuestos (legal)
- Sync offline (datos de campo)

**Accion**:
1. Implementar Vitest para `@enjambre/contable` (logica pura, facil de testear)
2. Implementar Playwright para flujo de compra completo
3. Testing Library para componentes criticos

**Prioridad**: CRITICA — Sin tests, no hay seguridad en los cambios.

---

## ALTO — Resolver en proximos sprints

### D5. Paquetes Vacios/Stubs

**Problema**: `packages/ai`, `packages/maps`, `packages/ui` estan practicamente vacios.

**Impacto**: Falsa sensacion de modularidad. Logica "atrapada" dentro de las apps.

**Accion**:
- `packages/ai`: Conectar a Edge Function o OpenRouter para prediccion real
- `packages/maps`: Extraer logica de Leaflet de nucleo al paquete
- `packages/ui`: Migrar componentes compartidos (ProductCard, GrainOverlay, etc.)

**Prioridad**: ALTA — La modularidad es un principio constitucional.

---

### D6. Auditoria de RLS Incompleta

**Problema**: Nuevas tablas (pedidos_cliente, marketing_posts, contable) necesitan revision exhaustiva de RLS.

**Impacto**: Riesgo de privacidad y cumplimiento legal. Un cliente podria ver datos de otro.

**Accion**: Ejecutar auditoria de seguridad completa:
```sql
-- Verificar que TODAS las tablas tienen RLS habilitado
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  AND tablename NOT IN (
    SELECT tablename FROM pg_policies WHERE schemaname = 'public'
  );
```

**Prioridad**: ALTA — Seguridad es principio constitucional.

---

### D7. Service Worker sin Testing

**Problema**: Hay `RegisterServiceWorker` pero la logica de cache offline no esta probada.

**Impacto**: Perdida de datos en el bosque de Chiloe (zona con baja senal).

**Accion**:
1. Refactorizar logica offline en `packages/offline`
2. Tests de sincronizacion con interrupcion de red simulada
3. Validar en Chrome DevTools > Application > Service Workers

**Prioridad**: ALTA — El apicultor depende de esto en el campo.

---

## MEDIO — Planificar para el roadmap

### D8. EIRL Desacoplado del Ecosistema

**Problema**: `apps/eirl` usa SQLite + Prisma + NextAuth, totalmente independiente de Supabase.

**Impacto**: Duplicacion de logica (contable ya esta en `packages/contable`). Dos sistemas de auth. Dos bases de datos.

**Accion**: Evaluar migracion gradual:
1. Usar `@enjambre/contable` en vez de logica propia
2. Considerar Supabase como backend (eliminar Prisma/SQLite)
3. Unificar auth con el resto del ecosistema

**Prioridad**: MEDIA — Funciona, pero es tech debt arquitectonico.

---

### D9. Hardcoding de Contenido (Resuelto)

**Problema**: Textos de landing quemados en codigo.

**Estado**: RESUELTO — Implementado `site_content` en Supabase + fetching dinamico.

**Leccion**: Siempre usar CMS para contenido editable por el cliente.

---

### D10. Variables de Entorno Dispersas

**Problema**: Cada app tiene sus propias variables con nombres inconsistentes (`VITE_*` vs `NEXT_PUBLIC_*`).

**Impacto**: Configuracion compleja en Vercel, facil cometer errores.

**Accion**: Estandarizar nomenclatura por app:
- Tienda/Campo: `NEXT_PUBLIC_SUPABASE_*`
- Nucleo: `VITE_SUPABASE_*`
- API: `SUPABASE_*` (sin prefijo publico)
- Documentar en `VERCEL.md`

**Prioridad**: MEDIA — Documentado en VERCEL.md pero mejorable.

---

## BAJA — Mejoras de calidad

### D11. Linting Inconsistente

**Problema**: No hay ESLint configurado consistentemente en todo el workspace.

**Accion**: Configurar ESLint flat config con reglas compartidas en la raiz.

### D12. Sin CI/CD Pipeline

**Problema**: No hay pipeline de integracion continua. Los builds se verifican manualmente.

**Accion**: GitHub Actions con:
- Build de la app afectada en cada PR
- Lint + typecheck
- Tests (cuando existan)

---

## Indice de Prioridad

| ID | Deuda | Prioridad | Esfuerzo | Riesgo |
|---|---|---|---|---|
| D4 | Sin tests | CRITICA | Alto | Extremo |
| D1 | Carpetas "Copia" | ALTA | Bajo | Medio |
| D2 | Componentes en raiz | ALTA | Medio | Medio |
| D3 | Next.js inestable | ALTA | Medio | Alto |
| D6 | RLS incompleto | ALTA | Medio | Alto |
| D7 | SW sin testing | ALTA | Medio | Alto |
| D5 | Paquetes vacios | ALTA | Alto | Bajo |
| D8 | EIRL desacoplado | MEDIA | Alto | Bajo |
| D10 | Variables dispersas | MEDIA | Bajo | Bajo |
| D11 | Linting | BAJA | Medio | Bajo |
| D12 | Sin CI/CD | BAJA | Medio | Medio |

---

*Actualizar este documento cuando se resuelva un item o se descubra nueva deuda.*
*Ultima actualizacion: Mayo 2026*
