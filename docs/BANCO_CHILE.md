# Banco Chile Integration - Enjambre Legado

## Overview

Implementación completa de las APIs de **Banco Chile Empresas** para el ecosistema Enjambre Legado.

## APIs Implementadas

### 1. Movimientos y Saldos
- ✅ Listar cuentas bancarias
- ✅ Obtener movimientos por cuenta
- ✅ Sincronización automática con la DB
- ✅ Conciliación bancaria

### 2. Abono en Línea (Transferencias)
- ✅ Crear transferencias
- ✅ Listar transferencias
- ✅ Seguimiento de estado
- ✅ Comprobantes

### 3. Cotizaciones Previsionales
- ✅ Obtener cotizaciones por trabajador
- ✅ Filtrado por período
- ✅ Almacenamiento histórico

### 4. Rentas Depuradas
- ✅ Validación de ingresos
- ✅ Niveles de confianza
- ✅ Múltiples fuentes

### 5. Nóminas (Confirming)
- ✅ Procesar nómina completa
- ✅ Detalles por beneficiario
- ✅ Seguimiento de estado

### 6. Documentos (Factoring)
- ✅ Listar documentos
- ✅ Aceptar/rechazar documentos
- ✅ Facturas, pagarés, letras

### 7. Montos Preaprobados
- ✅ Listar montos disponibles
- ✅ Consulta por cliente
- ✅ Condiciones y tasas

### 8. Notificaciones (Webhooks)
- ⏳ Implementación pendiente
- 📋 Event-driven architecture

## Estructura del Proyecto

```
packages/
banco-chile/ # Cliente API oficial
src/
index.ts # Exports
types.ts # Tipos TypeScript
client.ts # Cliente API

apps/
nucleo/
src/app/api/banco-chile/ # BFF routes (Hono via Next.js)
├── route.ts
src/views/banco-chile/
BancoChileView.tsx # Dashboard UI
```

## Base de Datos

### Tablas
- `banco_chile_config` - Configuración y credenciales
- `banco_chile_tokens` - Tokens de autenticación
- `banco_chile_cuentas` - Cuentas bancarias
- `banco_chile_movimientos` - Movimientos
- `banco_chile_transferencias` - Transferencias
- `banco_chile_cotizaciones` - Cotizaciones AFP/Isapre
- `banco_chile_rentas` - Rentas depuradas
- `banco_chile_nominas` - Nóminas (cabecera)
- `banco_chile_nomina_detalles` - Detalles de nómina
- `banco_chile_documentos` - Documentos comerciales
- `banco_chile_montos_preaprobados` - Cupos de crédito
- `banco_chile_notificaciones` - Webhooks
- `banco_chile_conciliaciones` - Conciliaciones bancarias

### Migraciones
```bash
# Aplicar migraciones
cd packages/database
pnpm db:push
```

## Configuración

### Variables de Entorno

```env
# Banco Chile (sandbox)
BANCO_CHILE_CLIENT_ID=tu_client_id
BANCO_CHILE_CLIENT_SECRET=tu_client_secret
BANCO_CHILE_USERNAME=tu_username
BANCO_CHILE_PASSWORD=tu_password
BANCO_CHILE_ENVIRONMENT=sandbox  # sandbox | production
```

### Setup en Nucleo

1. Ir a **Nucleo** → Dashboard
2. Seleccionar rol **admin**
3. Navegar a **Integraciones** → **Banco Chile**
4. Completar credenciales
5. Habilitar integración

## Uso del Cliente API

```typescript
import { BancoChileClient } from '@enjambre/banco-chile';

const client = new BancoChileClient({
  clientId: process.env.BANCO_CHILE_CLIENT_ID,
  clientSecret: process.env.BANCO_CHILE_CLIENT_SECRET,
  username: process.env.BANCO_CHILE_USERNAME,
  password: process.env.BANCO_CHILE_PASSWORD,
  environment: 'sandbox',
});

// Obtener cuentas
const cuentas = await client.getCuentas();

// Obtener movimientos
const movimientos = await client.getMovimientos('123456', {
  desde: '2026-01-01',
  hasta: '2026-01-31',
});

// Crear transferencia
const transferencia = await client.crearTransferencia({
  cuentaOrigen: '123456',
  cuentaDestino: '789012',
  rutDestinatario: '76543210-K',
  nombreDestinatario: 'Proveedor SPA',
  bancoDestino: 'Banco Estado',
  monto: 100000,
  tipoTransferencia: 'normal',
});

// Obtener renta depurada
const renta = await client.getRentaDepurada('76543210-K');

// Procesar nómina
const nomina = await client.procesarNomina({
  numeroNomina: 'NOM-2026-01',
  periodo: '2026-01',
  detalles: [
    {
      rutBeneficiario: '12345678-9',
      nombreBeneficiario: 'Juan Pérez',
      banco: 'Banco Chile',
      tipoCuenta: 'corriente',
      numeroCuenta: '123456',
      monto: 1000000,
    },
  ],
});
```

## Endpoints API

### Configuración
- `GET /api/banco-chile/config` - Obtener configuración
- `POST /api/banco-chile/config` - Guardar configuración

### Cuentas y Movimientos
- `GET /api/banco-chile/cuentas` - Listar cuentas
- `GET /api/banco-chile/movimientos/:cuentaId` - Listar movimientos

### Transferencias
- `GET /api/banco-chile/transferencias` - Listar transferencias
- `POST /api/banco-chile/transferencias` - Crear transferencia

### Conciliación
- `GET /api/banco-chile/conciliacion` - Listar movimientos por conciliar
- `POST /api/banco-chile/conciliacion/conciliar` - Conciliar movimiento
- `POST /api/banco-chile/conciliacion/desconciliar/:id` - Desconciliar

### Nóminas
- `GET /api/banco-chile/nominas` - Listar nóminas
- `POST /api/banco-chile/nominas` - Procesar nómina

### Documentos
- `GET /api/banco-chile/documentos` - Listar documentos
- `GET /api/banco-chile/documentos/external` - Consultar desde Banco Chile
- `POST /api/banco-chile/documentos/:id/accept` - Aceptar documento

### Cotizaciones
- `GET /api/banco-chile/cotizaciones` - Listar cotizaciones
- `GET /api/banco-chile/cotizaciones/:rutTrabajador` - Por trabajador

### Rentas
- `GET /api/banco-chile/rentas` - Listar rentas
- `GET /api/banco-chile/rentas/:rutPersona` - Por persona

### Montos Preaprobados
- `GET /api/banco-chile/montos` - Listar montos
- `GET /api/banco-chile/montos/:rutCliente` - Por cliente

## Seguridad

- ✅ RLS (Row Level Security) en todas las tablas
- ✅ Credenciales encriptadas en la DB
- ✅ Autenticación OAuth 2.0
- ✅ Tokens con expiración
- ✅ Refresh tokens automático

## Estados

| API | Estado | Notas |
|-----|--------|-------|
| Movimientos y Saldos | ✅ Implementado | Stub hasta tener credenciales reales |
| Abono en línea | ✅ Implementado | Validar con sandbox Banco Chile |
| Cotizaciones | ✅ Implementado | - |
| Rentas Depuradas | ✅ Implementado | - |
| Nóminas | ✅ Implementado | - |
| Documentos | ✅ Implementado | - |
| Montos Preaprobados | ✅ Implementado | - |
| Notificaciones | ⏳ Pendiente | Webhook endpoint necesario |

## Próximos Pasos

1. **Certificación**: Validar APIs con sandbox de Banco Chile
2. **Producción**: Migrar credenciales a producción
3. **Webhooks**: Implementar endpoint para notificaciones
4. **UI Avanzada**: Dashboard ejecutivo en Nucleo
5. **Conciliación Automática**: ML para matching de transacciones

## Soporte

Documentación oficial: https://apistore.bancochile.cl/banco-chile/sandbox

## Licencia

Uso interno Enjambre Legado.
