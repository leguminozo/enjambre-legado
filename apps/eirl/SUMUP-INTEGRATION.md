# 🚀 Integración SumUp - EIRL PROPYME

## ✅ Completado

### 1. **Tipos TypeScript** ✅
- [x] `src/lib/sumup/types.ts` - Tipos completos de SumUp API
- [x] Checkouts, Transactions, Customers, Payouts, Receipts
- [x] Webhooks y conciliación

### 2. **Cliente SumUp** ✅
- [x] `src/lib/sumup/client.ts` - Cliente API completo
- [x] Soporte sandbox y producción
- [x] Manejo de errores robusto

### 3. **Server Actions** ✅
- [x] `crearLinkPago()` - Generar links de pago
- [x] `listarTransacciones()` - Listar transacciones
- [x] `conciliarTransaccion()` - Conciliar con facturas
- [x] `generarConciliacion()` - Reporte de conciliación
- [x] `reembolsarTransaccion()` - Reembolsos

### 4. **Modelos de Base de Datos** ✅
- [x] `ConciliacionSumUp` - Tracking de conciliación
- [x] Relaciones con `Empresa`, `FacturaEmitida`
- [x] Índices para performance

### 5. **UI Components** ✅
- [x] `/conciliacion` - Dashboard de conciliación
- [x] `/pagos` - Generador de links de pago
- [x] Loading states + Suspense
- [x] Toast notifications

---

## 📋 Funcionalidades Implementadas

### 🔗 Links de Pago
- ✅ Generar link con monto y descripción
- ✅ Metadata para conciliación (empresa_id, factura_id)
- ✅ Soporte para múltiples tipos (factura, gasto, servicio)
- ✅ Copy al portapapeles
- ✅ Abrir en nueva pestaña

### 💳 Conciliación Automática
- ✅ Conciliar transacciones con facturas
- ✅ Detección de diferencias
- ✅ Reportes por período
- ✅ Estado de conciliación

### 📊 Dashboard
- ✅ Métricas en tiempo real
- ✅ Transacciones del período
- ✅ Montos totales, comisiones, neto
- ✅ Diferencias detectadas

### 💰 Reembolsos
- ✅ Reembolso total o parcial
- ✅ Actualización de estados
- ✅ Historial de reembolsos

---

## 🔧 Configuración

### 1. Variables de Entorno

```bash
# .env
SUMUP_API_KEY="tu_api_key"
SUMUP_SANDBOX="true"  # false para producción

NEXT_PUBLIC_APP_URL="http://localhost:3000"
EIRL_EMPRESA_ID="uuid-de-la-empresa"
```

### 2. Migración de Base de Datos

```bash
cd apps/eirl

# Generar Prisma Client
pnpm db:generate

# Push del schema (incluye ConciliacionSumUp)
pnpm db:push

# Opcional: migración manual
# (El schema ya incluye la tabla)
```

### 3. Configurar Webhook (Opcional)

```bash
# En Dashboard de SumUp:
# Settings → API → Webhooks
# URL: https://tu-app.com/api/sumup/webhook
# Eventos: checkout.completed, transaction.successful
```

---

## 📖 Cómo Usar

### Generar Link de Pago

1. Ve a `/pagos`
2. Ingresa monto y descripción
3. Selecciona tipo (factura/gasto/servicio)
4. Click en "Generar Link"
5. Copia y envía al cliente

### Conciliar Transacción

1. Ve a `/conciliacion`
2. Revisa transacciones del período
3. Las transacciones se concilian automáticamente
4. Detecta diferencias manualmente

### Reembolsar

```typescript
import { reembolsarTransaccion } from '@/lib/sumup/actions';

const result = await reembolsarTransaccion({
  transactionId: 'tx_123',
  monto: 10000, // opcional, si es parcial
  razon: 'Devolución de cliente',
});
```

---

## 🔗 Endpoints de SumUp Soportados

| Endpoint | Estado | Descripción |
|----------|--------|-------------|
| `POST /checkouts` | ✅ | Crear checkout |
| `GET /checkouts/:id` | ✅ | Obtener checkout |
| `POST /checkouts/:id/deactivate` | ✅ | Desactivar checkout |
| `GET /transactions` | ✅ | Listar transacciones |
| `GET /transactions/:id` | ✅ | Obtener transacción |
| `POST /transactions/:id/refund` | ✅ | Reembolsar |
| `POST /customers` | ✅ | Crear cliente |
| `GET /customers/:id` | ✅ | Obtener cliente |
| `GET /payouts` | ✅ | Listar payouts |
| `GET /receipts/:id` | ✅ | Obtener receipt |

---

## 🧪 Testing

### Sandbox Mode

```bash
# .env
SUMUP_SANDBOX="true"
SUMUP_API_KEY="sk_test_..."
```

1. Cuenta sandbox en [SumUp Dashboard](https://me.sumup.com/settings/developer)
2. Obtén API key de test
3. Configura `.env`
4. Testea links de pago con tarjetas de test

### Producción

```bash
# .env
SUMUP_SANDBOX="false"
SUMUP_API_KEY="sk_live_..."
```

---

## 📊 Métricas

| Concepto | Detalle |
|----------|---------|
| **Comisiones SumUp** | ~2.9% + $250 CLP por transacción |
| **Tiempo de liquidación** | 1-2 días hábiles |
| **Monto mínimo** | $100 CLP |
| **Monto máximo** | $1.500.000 CLP/día |
| **Medios de pago** | Visa, MC, AMEX, Apple Pay, Google Pay |

---

## 🐛 Solución de Problemas

### Error: "Invalid API Key"
- Verifica que `SUMUP_API_KEY` esté en `.env`
- Asegúrate de que no tenga comillas ni espacios

### Error: "Checkout no encontrado"
- Verifica que el checkout_id sea correcto
- Los checkouts expiran a las 24 horas

### Error: "Conciliación fallida"
- Revisa que la transacción exista en SumUp
- Verifica conexión a internet

---

## 📝 Próximas Mejoras (Backlog)

- [ ] Webhooks en tiempo real
- [ ] Conciliación automática con IA
- [ ] Reportes PDF para SII
- [ ] Integración con bancos chilenos
- [ ] Múltiples empresas
- [ ] Límites por usuario
- [ ] Aprobación de pagos grandes

---

## 🔗 Recursos

- [SumUp API Docs](https://developer.sumup.com/api)
- [SumUp Dashboard](https://me.sumup.com/settings/developer)
- [SumUp SDKs](https://github.com/sumup)
- [Conciliación SII](https://www.sii.cl/ayudas/como_se_emite.htm)

---

*Generado: 2026-05-19*
*Integración SumUp completada ✅*
