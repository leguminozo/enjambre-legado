# 🚀 Migración EIRL: SQLite → PostgreSQL (Supabase)

## Contexto

Tu app EIRL usaba **SQLite** (archivo local). Ahora migrará a **PostgreSQL** (Supabase) para:

- ✅ Escalar a producción
- ✅ Multi-tenant real
- ✅ Misma DB que `nucleo`, `tienda`, `campo`
- ✅ RLS policies de seguridad
- ✅ Backups automáticos
- ✅ Conexión pooler

---

## Paso 1: Obtener credenciales de Supabase

1. Ve a https://supabase.com
2. Selecciona tu proyecto (ej. "enjambre-legado")
3. Settings → Database
4. Copia la **Connection string** (Pooler mode recomendado)

```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

---

## Paso 2: Configurar variables de entorno

Crea `.env` en `apps/eirl/`:

```bash
# .env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
EIRL_AUTH_TOKEN="tu-token-secreto"
EIRL_EMPRESA_ID="uuid-de-la-empresa"
```

---

## Paso 3: Migrar datos (si tienes datos en SQLite)

```bash
cd apps/eirl

# 1. Instalar dependencias
pnpm install

# 2. Generar Prisma Client para PostgreSQL
pnpm db:generate

# 3. Push del schema a PostgreSQL
pnpm db:push

# 4. Migrar datos (opcional, si tienes datos en SQLite)
pnpm db:migrate:postgres
```

---

## Paso 4: Verificar migración

```bash
# Conéctate a Supabase SQL Editor
psql "postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

-- Verifica las tablas
\dt

-- Verifica datos
SELECT COUNT(*) FROM empresas;
SELECT COUNT(*) FROM periodos_contables;
```

---

## Paso 5: Build y test

```bash
# Build
pnpm build

# Dev
pnpm dev

# Abre http://localhost:3000
```

---

## Script de migración automática

El script `scripts/migrate-to-postgres.ts`:

1. ✅ Verifica conexión PostgreSQL
2. ✅ Crea empresa por defecto
3. ✅ Crea período contable actual
4. ✅ Valida datos

---

## Tablas creadas (alineadas con Supabase)

| Tabla SQLite | Tabla PostgreSQL | Estado |
|--------------|------------------|--------|
| `Empresa` | `empresas` | ✅ Migrado |
| `Tercero` | `terceros` | ✅ Migrado |
| `FacturaEmitida` | `facturas_emitidas` | ✅ Migrado |
| `FacturaRecibida` | `facturas_recibidas` | ✅ Migrado |
| `Gasto` | `gastos` | ✅ Migrado |
| `Impuesto` | `impuestos` | ✅ Migrado |
| `PeriodoContable` | `periodos_contables` | ✅ Migrado |
| `Reporte` | `reportes` | ✅ Migrado |
| `CalculoIA` | `calculos_ia` | ✅ Migrado |

---

## Cambios en el Schema

### PostgreSQL (nuevo)
```prisma
datasource db {
  provider = "postgresql"
  url = env("DATABASE_URL")
}

model Empresa {
  id String @id @default(uuid())  // UUID nativo
  rut String @unique
  // ...
}
```

### SQLite (antiguo)
```prisma
datasource db {
  provider = "sqlite"
  url = env("DATABASE_URL")
}

model Empresa {
  id String @id @default(cuid())  // CUID
  rut String @unique
  // ...
}
```

---

## Solución de problemas

### Error: "Can't reach database server"
- Verifica `DATABASE_URL` en `.env`
- Asegúrate de que tu IP esté whitelist en Supabase

### Error: "Table 'empresas' does not exist"
- Ejecuta `pnpm db:push` para crear tablas
- O `pnpm db:migrate` si usas migraciones

### Error: "Prisma Client no generado"
- Ejecuta `pnpm db:generate`
- Reinicia el servidor de desarrollo

---

## Siguientes pasos

1. ✅ **Completado**: Schema PostgreSQL
2. ✅ **Completado**: Scripts de migración
3. 🔄 **Pendiente**: Auth real (NextAuth → Supabase Auth)
4. 🔄 **Pendiente**: Integrar SumUp

---

## Recursos

- [Supabase + Prisma Docs](https://supabase.com/docs/guides/tools/prisma)
- [PostgreSQL vs SQLite](https://www.prisma.io/docs/orm/reference/prisma-schema-reference#database-features)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooling)
