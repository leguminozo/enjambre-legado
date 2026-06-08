# Arquitectura - Integración Banco Chile

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────────┐
│ USUARIO (Nucleo) │
│ Dashboard React - Banco Chile │
└─────────────────────────────────────────────────────────────────────┘
│
│ HTTPS
▼
┌─────────────────────────────────────────────────────────────────────┐
│ Nucleo BFF (Next.js + Hono) │
│ apps/nucleo/src/app/api/ │
│ ┌──────────────────────────────────────────────────────────────┐ │
│  │  /api/banco-chile/*                                          │  │
│  │  ├── config           # Configuración                        │  │
│  │  ├── cuentas          # Listar cuentas                       │  │
│  │  ├── movimientos      # Movimientos por cuenta               │  │
│  │  ├── transferencias   # Abonos en línea                     │  │
│  │  ├── conciliacion     # Conciliación bancaria               │  │
│  │  ├── nominas          # Nóminas/Confirming                  │  │
│  │  ├── documentos       # Factoring                           │  │
│  │  ├── cotizaciones     # Cotizaciones AFP                    │  │
│  │  ├── rentas                # Rentas depuradas               │  │
│  │  └── montos           # Montos preaprobados                 │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
         │                              │
         │ (1) Auth JWT                 │ (2) Llamada API
         │ supabase.auth                │ BancoChileClient
         ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────────────────┐
│   Supabase Auth         │    │   @enjambre/banco-chile             │
│   - Validación token    │    │   - OAuth 2.0                       │
│   - User context        │    │   - Auto-refresh tokens             │
│   - RLS policies        │    │   - Tipos TypeScript                │
└─────────────────────────┘    └─────────────────────────────────────┘
                                        │
                                        │ HTTPS (OAuth)
                                        ▼
                            ┌─────────────────────────────────────┐
                            │   Banco Chile API Gateway           │
                            │   - /oauth/token                    │
                            │   - /api/v1/accounts                │
                            │   - /api/v1/transfers               │
                            │   - /api/v1/payroll                 │
                            │   - /api/v1/documents               │
                            │   - /api/v1/cotizaciones            │
                            │   - /api/v1/rentas                  │
                            │   - /api/v1/preapproved-amounts     │
                            └─────────────────────────────────────┘
                                        │
                                        │
                            ┌─────────────────────────────────────┐
                            │   Banco Chile Core                  │
                            │   - Sistema bancario                │
                            │   - Base de datos transaccional     │
                            └─────────────────────────────────────┘
```

## Flujo de Datos

### 1. Configuración Inicial

```
Usuario (Nucleo)
    │
    │ 1. Ingresa credenciales
    │    - Client ID
    │    - Client Secret
    │    - Username
    │    - Password
    │
    ▼
API Nucleo BFF (/api/banco-chile/config POST)
    │
    │ 2. Valida JWT y empresa
    │
    ▼
Supabase (banco_chile_config)
    │
    │ 3. Guarda credenciales encriptadas
    │
    ▼
Confirmación
```

### 2. Obtener Cuentas

```
Usuario (Nucleo)
    │
    │ 1. Click "Sincronizar cuentas"
    │
    ▼
API Nucleo BFF (/api/banco-chile/cuentas GET)
    │
    │ 2. Valida autenticación
    │
    ▼
BancoChileClient.getCuentas()
    │
    │ 3. Obtiene token OAuth (si no tiene)
    │ 4. Llama GET /api/v1/accounts
    │
    ▼
Banco Chile API
    │
    │ 5. Retorna lista de cuentas
    │
    ▼
Supabase (banco_chile_cuentas)
    │
    │ 6. Guarda/actualiza cuentas
    │
    ▼
API Nucleo BFF
    │
    │ 7. Retorna JSON al frontend
    │
    ▼
Usuario ve cuentas actualizadas
```

### 3. Crear Transferencia

```
Usuario (Nucleo)
    │
    │ 1. Completa formulario transferencia
    │    - Cuenta origen
    │    - Cuenta destino
    │    - Rut destinatario
    │    - Monto
    │    - Concepto
    │
    ▼
API Nucleo BFF (/api/banco-chile/transferencias POST)
    │
    │ 2. Valida datos con Zod schema
    │
    ▼
BancoChileClient.crearTransferencia()
    │
    │ 3. Obtiene token OAuth
    │ 4. POST /api/v1/transfers
    │
    ▼
Banco Chile API
    │
    │ 5. Valida fondos
    │ 6. Ejecuta transferencia
    │ 7. Retorna número de operación
    │
    ▼
Supabase (banco_chile_transferencias)
    │
    │ 8. Guarda comprobante
    │
    ▼
Usuario recibe confirmación
```

### 4. Conciliación Automática

```
Job Programado (cron)
    │
    │ 1. Ejecutar cada hora
    │
    ▼
API Nucleo BFF (/api/banco-chile/conciliacion/sync)
    │
    │ 2. Obtiene últimos movimientos
    │
    ▼
BancoChileClient.getMovimientos()
    │
    │ 3. Llama API Banco Chile
    │
    ▼
Banco Chile API
    │
    │ 4. Retorna movimientos
    │
    ▼
Algoritmo Conciliación
    │
    │ 5. Compara con ventas/gastos
    │ 6. Busca matches por:
    │    - Monto
    │    - Fecha
    │    - Rut
    │    - Referencia
    │
    ▼
Supabase (banco_chile_conciliaciones)
    │
    │ 7. Crea conciliaciones
    │ 8. Marca movimientos como conciliados
    │
    ▼
Dashboard muestra conciliaciones
```

## Seguridad

### Flujo OAuth 2.0

```
┌─────────────┐
│   Cliente   │
│ (BancoChile │
│  Client)    │
└─────────────┘
       │
       │ 1. POST /oauth/token
       │    grant_type=password
       │    username=xxx
       │    password=yyy
       │    scope=accounts transfers
       │
       ▼
┌─────────────────────────────────┐
│  Banco Chile Auth Server        │
│  - Valida credenciales          │
│  - Genera access_token          │
│  - Genera refresh_token         │
│  - Define expires_in            │
└─────────────────────────────────┘
       │
       │ 2. Retorna:
       │    {
       │      access_token: "eyJ...",
       │      refresh_token: "dGh...",
       │      expires_in: 3600,
       │      token_type: "Bearer"
       │    }
       │
       ▼
┌─────────────┐
│   Cliente   │
│  - Guarda   │
│  - Usa en   │
│    headers  │
└─────────────┘
       │
       │ 3. Antes de expirar (5 min)
       │    POST /oauth/token
       │    grant_type=refresh_token
       │    refresh_token=...
       │
       ▼
  Renueva token
```

### RLS Policies

```sql
-- Todas las tablas tienen RLS activado
ALTER TABLE banco_chile_config ENABLE ROW LEVEL SECURITY;

-- Policy ejemplo: solo usuarios de la empresa pueden ver
CREATE POLICY "Usuarios con acceso a empresa pueden ver config"
  ON banco_chile_config
  FOR SELECT
  USING (has_empresa_access(empresa_id));

-- Función has_empresa_access() verifica:
-- 1. Usuario es dueño de la empresa
-- 2. Usuario es gerente
-- 3. Usuario tiene permiso explícito
```

## Multi-tenant

Cada empresa tiene sus propios datos aislados:

```
Empresa A (uuid: aaa-bbb-ccc)
├── banco_chile_config (empresa_id = aaa-bbb-ccc)
├── banco_chile_cuentas (empresa_id = aaa-bbb-ccc)
├── banco_chile_movimientos (empresa_id = aaa-bbb-ccc)
└── ...

Empresa B (uuid: xxx-yzz-zzz)
├── banco_chile_config (empresa_id = xxx-yzz-zzz)
├── banco_chile_cuentas (empresa_id = xxx-yzz-zzz)
├── banco_chile_movimientos (empresa_id = xxx-yzz-zzz)
└── ...
```

## Escalabilidad

### Caché de Tokens
- Tokens almacenados en `banco_chile_tokens`
- Refresh automático 5 min antes de expirar
- Múltiples requests comparten mismo token

### Rate Limiting
- Banco Chile limita requests por minuto
- Implementar cola de requests si es necesario
- Reintentar con backoff exponencial

### Sincronización
- Movimientos: cada 5-15 minutos
- Saldos: cada 1-5 minutos
- Nóminas: bajo demanda
- Documentos: cada hora

## Monitoreo

### Logs a implementar
```typescript
// En cada route
console.log('Banco Chile API Call:', {
  endpoint: 'accounts',
  empresaId,
  timestamp: new Date().toISOString(),
  status: 'success' | 'error',
  duration: ms,
});
```

### Métricas clave
- Tiempo de respuesta promedio
- Tasa de error
- Tokens refreshados
- Conciliaciones automáticas
- Transferencias fallidas

---

**Documentación técnica completa en:** `docs/BANCO_CHILE.md`
