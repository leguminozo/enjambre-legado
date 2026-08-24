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
| P0 | 21.719 (vigencia **1 dic 2026**) | Copy sí · operación ARCO/brecha **sí (terminado)** |
| P0 | Publicidad de alimentos (20.606 / RSA) | Claims de salud en tienda **sí** · rotulado de envase **fuera del código** |
| P1 | 21.210 + códigos F29 | Hallazgo A-7 / A-8 **corregidos en el fuente** |
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
| Distancias apícolas 21.489 | `apps/nucleo/src/lib/distancias-legales.ts` |
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
- Parche 2026-08-14: Uber `conIva`; digitales `cambioSujeto` (IVA 19% encima); F29 crédito nacional **507**, débito digital **511**, crédito digital **512**. El motor ya no mezcla 503.

Sigue siendo **apoyo** al F29, no la declaración oficial al SII.

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
| Reescribir 21.489 / 4590 | Ya están en Núcleo. |

---

## Checklist corto (dueño + agente)

```
[x] Copy alimentos: badges y nosotros/ulmo acotados (2026-08-14)
[x] Checkout: “Incluye IVA”
[x] 21.719 ARCO: exportar + solicitar eliminación en /perfil/ajustes
[x] 21.719 Groq: encargado en /privacidad (solo patio)
[x] 21.719 brecha: runbook en PRODUCTION.md
[x] Fiscal: Uber con IVA; digitales cambio sujeto; F29 507/511/512
[x] CMS: republicar legal_terminos, legal_privacidad, legal_cookies
[x] Ops: aplicar migración 20260814210000 (deletion_requested_at)
[ ] Ops: resolución sanitaria + rotulado de frasco (fuera de git)
```

Cuando los tres `[ ]` de 21.719 y el de copy de alimentos estén cerrados, **el software de cara al público queda al día** con lo que la ley les pide a *esta* operación. El frasco físico y el F29 oficial siguen siendo ops/contador.

*Actualizar este archivo al tachar un ítem. No añadir leyes “por si acaso”.*
