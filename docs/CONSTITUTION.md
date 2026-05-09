# Constitución del Enjambre Legado

## I. Visión y Propósito
**Enjambre Legado** no es un software de gestión comercial; es un sistema operativo para la **regeneración biocultural**. Su propósito es orquestar la relación entre el bosque nativo de Chiloé, la abeja virgen y el consumo consciente de alta gama. 

Cada línea de código debe honrar la pureza de la miel y la complejidad de la colmena.

---

## II. Principios de Ingeniería

### 1. Estética Editorial (The Wow Factor)
El frontend no es un "producto mínimo viable". Es una pieza de diseño de lujo. 
- **Dark Mode por defecto**: El negro profundo (`#050505`) representa la sombra del bosque.
- **Tipografía Display**: Uso mandatorio de *Cormorant Garamond* para una sensación histórica y editorial.
- **Micro-interacciones**: El uso de GSAP para simular vida (como el vuelo de las abejas) es una prioridad, no un "nice-to-have".

### 2. Monorepo y Modularidad
- El código se vive en `packages/`. Lo que puede ser compartido, **debe** ser compartido.
- Las `apps/` son interfaces específicas para roles específicos:
    - `tienda`: El portal hacia el mundo.
    - `nucleo`: El cerebro del gerente.
    - `campo`: La herramienta del apicultor.

### 3. Seguridad Nativa (RLS)
La base de datos (Supabase) es la fuente de verdad. 
- **Row Level Security (RLS)**: Nunca se confía en el cliente. La seguridad vive en Postgres.
- **Roles Estrictos**: Los roles (`apicultor`, `gerente`, `tienda_admin`) dictan el acceso al dato desde la médula.

### 4. Código para Agentes (AI-Ready)
Este repositorio está diseñado para ser co-escrito con IA.
- **Named Exports**: Prohibido el uso de `export default` en componentes (excepto en páginas de Next.js).
- **Tipado Fuerte**: TypeScript no es opcional. No se permiten `any`.
- **Comentarios Semánticos**: Los comentarios deben explicar el "por qué", no el "qué".

---

## III. El Flujo del Néctar (Data Flow)
1.  **Origen**: `cosechas` y `lotes` en el bosque.
2.  **Transformación**: `productos` vinculados a lotes específicos para trazabilidad total.
3.  **Destino**: `ventas` internacionales o locales con impacto regenerativo (cada pedido planta árboles).

---

## IV. Mandamientos del Desarrollador
- **No romperás el legado**: Cada cambio debe ser verificado localmente con `build` antes de subirlo.
- **Honrarás la simplicidad**: Menos componentes, más intención.
- **Documentarás el cambio**: Si cambias la médula (database), actualiza el esquema documental inmediatamente.
