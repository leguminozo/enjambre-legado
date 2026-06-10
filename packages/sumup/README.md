# @enjambre/sumup

Integracion con SumUp POS para punto de venta.

## Instalacion

```bash
pnpm add @enjambre/sumup
```

## Uso

```typescript
import { SumUpClient } from '@enjambre/sumup'

const client = new SumUpClient({
  clientId: '...',
  clientSecret: '...',
  username: '...',
  password: '...',
})
```

## SumUpClient — Metodos (12)

| Metodo | Descripcion |
|---|---|
| `getTransaction(id)` | Obtener transaccion por ID |
| `listTransactions(opts)` | Listar transacciones con filtros |
| `refundTransaction(id)` | Reembolsar transaccion |
| `listPayouts(opts)` | Listar pagos/payouts |
| `listCheckouts()` | Listar checkouts |
| `createCheckout(data)` | Crear checkout (validado con `CreateCheckoutSchema`) |
| `getCheckout(id)` | Obtener checkout por ID |
| `processCheckout(id, card)` | Procesar pago de checkout |
| `deactivateCheckout(id)` | Desactivar checkout |
| `listReaders()` | Listar lectores POS |
| `createReaderCheckout(readerId, data)` | Crear checkout en lector |
| `terminateReaderCheckout(readerId, checkoutId)` | Terminar checkout en lector |
| `getMerchant()` | Info del merchant |

## Tipos

- `SumUpCurrency` — 17 monedas (incl. CLP)
- `TransactionStatus`, `SimpleStatus`, `PaymentType`, `EntryMode`, `CardType`
- `SumUpTransaction`, `SumUpTransactionHistoryItem`, `SumUpTransactionHistoryResponse`
- `SumUpFinancialPayout`, `SumUpCheckout`, `SumUpReader`, `SumUpMerchant`
- `SumUpApiError`, `SumUpResult<T>` (discriminated union success/error)
- `ListTransactionsOptions`, `ListPayoutsOptions`

## Zod Schemas

- `CreateCheckoutSchema` — validacion de checkout
- `RefundTransactionSchema` — validacion de reembolso
