# Constitucion del Enjambre Legado

## I. Vision y Proposito

**Enjambre Legado** no es un software de gestion comercial. Es un **sistema operativo para la regeneracion biocultural**. Su proposito es orquestar la relacion entre el bosque nativo de Chiloe, la abeja virgen y el consumo consciente de alta gama.

Cada linea de codigo debe honrar la pureza de la miel y la complejidad de la colmena.

---

## II. Principios de Ingenieria

### 1. Estetica Editorial (The Wow Factor)

El frontend no es un "producto minimo viable". Es una pieza de diseno de lujo.

- **Dark Mode por defecto**: El negro profundo (`#050505`) representa la sombra del bosque.
- **Tipografia Display**: Uso mandatorio de *Cormorant Garamond* para una sensacion historica y editorial.
- **Micro-interacciones**: GSAP para simular vida (como el vuelo de las abejas) es prioridad, no un "nice-to-have".
- **Textura organica**: GrainOverlay y efectos de textura son obligatorios en paginas publicas.
- **Espaciado generoso**: El whitespace es lujo. Las paginas respiran.

#### Paleta Canonica

| Token | Hex | Uso |
|---|---|---|
| Bosque Ulmo | `#0A3D2F` | Verde profundo, primary actions |
| Oro Miel | `#D4A017` / `#c9a227` | Acentos premium, highlights |
| Crema Natural | `#FDFBF7` / `#f5f0e8` | Texto claro sobre oscuro |
| Negro Tinta | `#1a1a1a` / `#050505` | Fondos, profundidad |

> **Prohibido** usar hex sueltos. Usar siempre las variables CSS semanticas (`bg-background`, `text-foreground`, `text-primary`, etc.) o los tokens de `packages/ui`.

### 2. Monorepo y Modularidad

- El codigo compartido vive en `packages/`. Lo que puede ser compartido, **debe** ser compartido.
- Las `apps/` son interfaces especificas para roles especificos. No duplican logica.
- La base de datos es una sola (Supabase). EIRL es la unica excepcion (SQLite propio).
- Toda nueva funcionalidad que cruza apps debe evaluarse primero como `package`.

```
packages/
  database/   Fuente de verdad del esquema
  contable/   Logica tributaria reutilizable
  auth/       Sesion y roles compartidos
  offline/    Sincronizacion offline-first
  ui/         Design tokens + componentes base
  ai/         Integraciones de IA
  maps/       Utilidades cartograficas
```

### 3. Seguridad Nativa (RLS)

La base de datos (Supabase) es la fuente de verdad. La seguridad no es negociable.

- **Row Level Security (RLS)**: Nunca se confia en el cliente. La seguridad vive en Postgres.
- **Roles Estrictos**: `apicultor`, `vendedor`, `gerente`, `logistica`, `marketing`, `tienda_admin`, `cliente`. Cada rol ve exactamente lo que le corresponde.
- **Multi-tenant contable**: La capa contable usa `has_empresa_access()` para aislar datos por empresa.
- **Validacion en BFF**: La API Hono valida JWT via Supabase Auth antes de cada operacion.
- **Service Role Key**: Solo se usa en server-side (API routes, BFF). Nunca en el cliente.

### 4. Offline-First para Campo

El apicultor trabaja en el bosque. No hay internet.

- **Dexie (IndexedDB)** es la primera parada de toda escritura en campo.
- Las mutaciones se encolan en `sync-queue` y se sincronizan con Supabase al recuperar conexion.
- El Service Worker cachea el catalogo y las interfaces criticas.
- **Prohibido** hacer `supabase.insert()` directo desde un componente UI de campo. Siempre a traves del hook de sincronizacion.

### 5. Codigo para Agentes (AI-Ready)

Este repositorio esta disenado para ser co-escrito con IA.

- **Named Exports**: Prohibido `export default` en componentes (excepto pages Next.js).
- **Tipado Fuerte**: TypeScript strict. `any` es un error. Usar `unknown` + type guards.
- **Comentarios Semanticos**: Los comentarios explican el "por que", no el "que".
- **Estructura Predecible**: Cada modulo sigue el mismo patron (hooks, componentes, tipos, utilidades).

---

## III. El Flujo del Nectar (Data Flow)

```
1. ORIGEN       cosechas + inspecciones en el bosque (campo/offline)
2. TRANSFORMA   lotes vinculados a colmenas especificas (nucleo)
3. TRAZA        blockchain_hash por colmena para certificacion
4. PRODUCTO     productos premium con descripcion regenerativa (tienda)
5. VENTA        transbank + impacto ambiental (tienda/api)
6. IMPACTO      arboles plantados por pedido (nucleo + tienda)
7. CONTABILIDAD facturas, IVA, impuestos (eirl/api)
```

Cada etapa del flujo es trazable. Un cliente puede escanear un QR y ver exactamente de que colmena viene su miel.

---

## IV. Mandamientos del Desarrollador

1. **No romperas el legado** — Cada cambio debe ser verificado con `build` antes de subir.
2. **Honraras la simplicidad** — Menos componentes, mas intencion.
3. **Documentaras el cambio** — Si cambias la medula (database), actualiza el esquema documental inmediatamente.
4. **No haras carniceria** — Cirugia: modifica solo lo estrictamente necesario. Evita refactors masivos no solicitados.
5. **Probable la critica** — Si hay flujo de pago o dato sensible, debe haber test automatizado.
6. **Respetaras los roles** — Cada nueva tabla necesita RLS. Sin excepciones.
7. **Leeras antes de escribir** — Investiga componentes similares antes de crear nuevos.

---

## V. Anti-patrones (Prohibido)

| Anti-patron | Correcto |
|---|---|
| `export default function` | `export function MiComponente` |
| `any` como tipo | `unknown` + type guard |
| Hex sueltos (`#fff`) | Tokens semanticos (`bg-background`) |
| `bg-white` en superficies | `bg-card` / `surface-raised` |
| `catch(e) {}` vacio | `toast.error()` con mensaje al usuario |
| `supabase.insert()` directo en UI | Hook de sincronizacion |
| Componentes en la raiz del repo | `packages/ui` o `apps/*/components` |
| `console.log` en produccion | Logger estructurado o remover |
| Service Role Key en el cliente | Solo server-side |

---

## VI. Gobernanza del Codigo

### Decisiones Arquitectonicas
Toda decision que afecte a mas de 3 archivos o cruce apps/packages debe documentarse en `docs/ARCHITECTURE.md` con:
- Contexto del problema
- Opciones consideradas
- Decision tomada y razon
- Consecuencias

### Nuevo Paquete/App
Antes de crear un nuevo paquete o app, responder:
1. Puede vivir en un paquete existente?
2. Lo necesita mas de una app?
3. Tiene dependencias circulares con otros paquetes?

### Migraciones de Base de Datos
- Toda migracion va en `packages/database/supabase/migrations/`
- Numeracion secuencial (`NN_descripcion.sql`)
- Incluir RLS si la tabla tiene datos sensibles
- Actualizar `DATABASE_SCHEMA.md`

---

*Este documento es la ley suprema del proyecto. Todo agente (humano o IA) debe leerlo antes de operar.*
*Ultima actualizacion: Mayo 2026*
