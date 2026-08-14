# Cumplimiento Chile — destilado

> **Clase: OPS.** Corte 2026-08-14. Anclado a archivos de `main`, no a folklore.
> **Fuera de alcance:** hidromiel y alambique como **venta**. Son herramientas internas de patio/producción. No aplicar Ley 19.925 ni rotulado de alcohol al carrito.
> No es dictamen jurídico. Es la lista de **hacer / ya está / no aplica** para estar al día con lo que este monorepo realmente opera.

Índice: [`README.md`](./README.md). Confianza técnica: [`TRUST.md`](./TRUST.md). Dinero: [`MONEY_PATH.md`](./MONEY_PATH.md).

---

## Veredicto

**No están full al día.** No falta “agregar diez leyes al footer”. Faltan **tres cortes de producto** y **un cierre fiscal ya auditado**. El resto del marco chileno o ya está en código/copy, o no aplica todavía.

| Prioridad | Frente | Estado |
|---|---|---|
| P0 | 21.719 (vigencia **1 dic 2026**) | Copy sí · operación ARCO/brecha **no** |
| P0 | Publicidad de alimentos (20.606 / RSA) | Claims de salud en tienda **sí** · rotulado de envase **fuera del código** |
| P1 | 21.210 + códigos F29 | Hallazgo A-7 / A-20 **sigue en el fuente** |
| P1 | CMS legales | Fallback del repo limpio · **prod puede tener body viejo** |
| P2 | DS 6 / 21.398 (e-commerce fino) | Retracto y cancelar sub **existen** · IVA en el botón de pago **no está dicho** |
| — | 19.925 alcohol | **No aplica** (hidromiel no se vende) |
| — | 21.663 como OSE / ANCI | **No aplica** a este tamaño (sí la higiene de `TRUST`) |
| — | 19.913 UAF | **No ahora** (feria chica; revisar si el efectivo escala) |

---

## Ya está (no reabrir)

Comprobado en repo:

| Qué | Evidencia |
|---|---|
| Retracto 10 días, garantía legal, cancelación de pedido | `apps/tienda/app/{terminos,reembolso,garantia,cancelacion}/page.tsx` — citan 21.315 y 19.496 |
| Precios con IVA **en términos** | `terminos/page.tsx` § 4 |
| Stock visible | `product-purchase-actions.tsx`, `catalog-view.tsx` |
| Pausar / cancelar reposición en el mismo perfil que se contrata | `replenishment-active-card.tsx` + `subscription-manage-client.ts` (cancela inscripción Flow best-effort) |
| Cookies con opt-in analytics/marketing | `lib/tracking/consent.ts`, `consent-banner.tsx` |
| Encargados de datos (tras el destilado de copy) | `privacidad/page.tsx`: Vercel, Supabase, Transbank/Flow, Sentry, Blue Express, Google/Meta |
| Distancias apícolas 21.102 | `apps/nucleo/src/lib/distancias-legales.ts` |
| Cuaderno de campo Res. SAG 4590/2025 | `CuadernoCampoView`, planes territoriales |
| Consentimientos de censo / coordenadas no públicas | `municipalidades/page.tsx`, `NUCLEO_CHILOE.md` |
| Metodología de impacto versionada | `impacto-metodologia.ts` `2026.08.1` + página Núcleo `/impacto` |
| 20.393 canal de integridad | `terminos` § 22 |
| Fiscal DTE / boleta / CAF | `@enjambre/fiscal`, `SOBERANIA_FISCAL.md` |

---

## Hacer

### 1. Antes del 1 de diciembre de 2026 — Ley 21.719

El texto legal **ya nombra** ARCO, 30 días, brecha 72 h y APD. En código **no hay**:

- Exportar / portar datos del titular (`eliminar cuenta` / `exportar datos`: solo aparecen en el HTML de privacidad).
- Flujo de supresión (más allá de “escribe a contacto@”).
- Runbook de brecha con reloj (Sentry + `security_events` + aviso titular/APD). Ver `PRODUCTION.md`: logs Hobby 1 h.
- Inventario de tratamientos (tienda vs Núcleo vs Groq STT de bitácora). Groq **no** está en `/privacidad` — es panel interno; hay que decidir si entra como encargado o se documenta solo en política interna de patio.
- Re-publicar en CMS `legal_privacidad` / `legal_terminos` / `legal_cookies` si el body en Supabase no está vacío (el fallback del repo no pisa un CMS publicado).

**Hecho =** un mail no basta. Un endpoint o un procedimiento operativo con responsable y plazo.

### 2. Copy de alimentos — 20.606 / RSA (DS 977) / 19.496 publicidad

No hay campos de rotulado en `productos` (cero `kcal`, tabla, lote de envase). El **envase físico** es ops Minsal/SEREMI, no este repo.

Sí hay **publicidad sanitaria** en tienda:

- `catalog-view.tsx` — badge `Sustituye azúcar`
- `pdp-body.tsx` — `Sustituye ~{n}g azúcar`
- `nosotros/page.tsx` y `origen/ulmo/page.tsx` — IG, picos glucémicos, “rompiendo adicciones”, serotonina, ansiolítico, polifenoles, “síndrome metabólico”

**Hacer (código):** bajar o acotar esos claims a sabor/origen/trazabilidad, o moverlos a un bloque “no es consejo médico / no es claim Minsal” y citar paper. El badge `Sustituye azúcar` es el más expuesto.

**Hacer (ops, fuera de git):** resolución sanitaria del obrador, rotulado del frasco (responsable, neto, lote, tabla). Eso no se “cierra” con un PR.

### 3. IVA digital — Ley 21.210 + F29

Sigue igual que la auditoría:

- `gasto-extranjero.ts`: 14 proveedores `conIva: false` → crédito 511 siempre 0.
- `f29.ts`: `CREDITO_COMPRAS_NACIONALES: 503` **igual** que el débito de ventas (A-20).

**Hacer:** `conIva` real por proveedor (Uber Chile no es “digital extranjero” igual que AWS) + códigos 507/508/511/512. Hasta entonces **no declarar F29 desde este motor** como si fuera la planilla oficial.

### 4. Legales en CMS

Si en Núcleo → Editor de tienda las secciones `legal_*` tienen body, **ese** texto está en producción. Tras el destilado de Hostinger/Next.js hay que **guardar de nuevo** Términos, Privacidad y Cookies.

### 5. E-commerce fino (menor)

- En checkout no aparece la frase “IVA incluido” (sí en términos). Un renglón en el total cierra DS 6 / 21.398 de precio final.
- Cancelar Flow es best-effort (`cancel-inscription`); si falla, el copy dice que el equipo cancela en el panel. Dejar un alerta interna o reintento. No es un hueco de “no se puede cancelar”: el botón está al lado de pausar.

---

## No hacer (ahora)

| Tentación | Por qué no |
|---|---|
| Tratar hidromiel como alcohol regulado en tienda | Usuario: no se vende. Ficha `/hidromiel/:id` = interna/pública de lote, no SKU. |
| Certificarse 21.663 como servicio esencial | No son infraestructura crítica. Basta `TRUST` + `PRODUCTION`. |
| Programa UAF / 19.913 | Caja de feria chica. Revisar solo si el efectivo mensual se vuelve material. |
| Modelar tabla nutricional 20.606 en `productos` | Primero el envase real y la resolución sanitaria. El riesgo **hoy** es el copy web. |
| Reescribir 21.102 / 4590 | Ya están en Núcleo. |

---

## Checklist corto (dueño + agente)

```
[ ] CMS: republicar legal_terminos, legal_privacidad, legal_cookies
[ ] 21.719: procedimiento ARCO (export + delete) con plazo 30 días
[ ] 21.719: runbook de brecha (quién, en cuánto, a quién)
[ ] 21.719: decidir Groq STT como encargado o política interna de patio
[ ] Alimentos: quitar o acotar “Sustituye azúcar” / claims de nosotros y ulmo
[ ] Ops: resolución sanitaria + rotulado de frasco (fuera de git)
[ ] Fiscal: no usar F29 del código como declaración; parche 21.210 + códigos
[ ] Checkout: una línea “precio incluye IVA”
```

Cuando los tres `[ ]` de 21.719 y el de copy de alimentos estén cerrados, **el software de cara al público queda al día** con lo que la ley les pide a *esta* operación. El frasco físico y el F29 oficial siguen siendo ops/contador.

*Actualizar este archivo al tachar un ítem. No añadir leyes “por si acaso”.*
