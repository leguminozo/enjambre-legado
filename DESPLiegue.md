# Guia de Despliegue - Enjambre Legado

## Resumen Ejecutivo

| App | Que es | Donde desplegar | Estado |
|-----|--------|-----------------|---------|
| `apps/tienda` | Frontend publico (e-commerce) | Vercel | Listo |
| `apps/nucleo` | Dashboard + BFF + contable (Next.js 16) | Vercel | Listo |
| `apps/campo` | PWA campo (offline-first planificado) | Vercel | Listo |

> **Nota historica**: `apps/api` (Hono en Railway) fue absorbido por nucleo. Las rutas BFF ahora viven dentro de nucleo en `/api/[[...routes]]`. `apps/eirl` fue absorbido por nucleo (vistas en `apps/nucleo/src/views/eirl/`).

---

## 1. Desplegar Nucleo en Vercel

Nucleo es un dashboard Next.js 16 con Hono BFF integrado.

### Pasos:

```bash
# 1. Ir a Vercel Dashboard
https://vercel.com/dashboard

# 2. Importar repositorio
# - Root: apps/nucleo

# 3. Variables de entorno (Vercel > Settings > Environment Variables)
NEXT_PUBLIC_SUPABASE_URL=https://hdhamxiblwwskvvqbcfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-only para BFF

# 4. Deploy
```

### URL despues del deploy:

```
Produccion: https://nucleo.obrerayzangano.com
Desarrollo: http://localhost:3000
```

---

## 2. Desplegar Tienda en Vercel

Tienda es e-commerce publico (Next.js 16).

### Pasos:

```bash
# 1. Vercel Dashboard
# - Root: apps/tienda

# 2. Variables:
NEXT_PUBLIC_SUPABASE_URL=https://hdhamxiblwwskvvqbcfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
TRANSBANK_COMMERCE_CODE=...
TRANSBANK_API_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...  # Server-only para API routes

# 3. Deploy
```

### URL:

```
Produccion: https://obrerayzangano.com
Desarrollo: http://localhost:3000
```

---

## 3. Desplegar Campo en Vercel

Campo es PWA para trabajo en terreno (Next.js 16).

### Pasos:

```bash
# Root: apps/campo
# Variables:
NEXT_PUBLIC_SUPABASE_URL=https://hdhamxiblwwskvvqbcfo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_NUCLEO_API_URL=https://nucleo.obrerayzangano.com  # BFF endpoint
```

---

## Arquitectura Final

```
+----------+  +----------+  +----------+
| Tienda   |  | Nucleo   |  | Campo   |
| (Vercel) |  | (Vercel) |  | (Vercel)|
+----+-----+  +----+-----+  +----+----+
     |              |              |
     +--------------+--------------+
                    |
                    v
           +----------------+
           |    Supabase    |
           |   (Postgres)   |
           +----------------+
```

---

## Comandos Utiles

### Desarrollo Local

```bash
# Nucleo (puerto 3000)
pnpm --filter @enjambre/nucleo dev

# Tienda (puerto 3000)
pnpm --filter @enjambre/tienda dev

# Campo (puerto 3002)
pnpm --filter @enjambre/campo dev
```

### Build

```bash
# Todo el monorepo
pnpm build

# Solo una app
pnpm --filter @enjambre/nucleo build
pnpm --filter @enjambre/tienda build
pnpm --filter @enjambre/campo build
```

---

## Checklist Pre-Despliegue

### Nucleo (Vercel)
- [ ] Supabase configurado
- [ ] Login funciona
- [ ] Dashboard carga
- [ ] BFF health checks responden

### Tienda (Vercel)
- [ ] Supabase configurado
- [ ] Checkout funciona
- [ ] Catalogo visible

### Campo (Vercel)
- [ ] Supabase configurado
- [ ] POS funciona
- [ ] NUCLEO_API_URL apunta a nucleo BFF

---

## URLs Finales

| Servicio | URL |
|----------|-----|
| Tienda | https://obrerayzangano.com |
| Nucleo | https://nucleo.obrerayzangano.com |
| Campo | https://campo.obrerayzangano.com |
