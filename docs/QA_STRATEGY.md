# Estrategia de Pruebas y QA — Enjambre Legado

> **Clase: LEY** (enfoque). Playwright E2E existe en `apps/*/e2e`. Índice: [`README.md`](./README.md).
> Documento centralizado sobre la estrategia de validación, pruebas unitarias y E2E.

---

## 1. Visión General del Stack de Pruebas

El ecosistema de **Enjambre Legado** emplea una arquitectura de pruebas de dos niveles, diseñada para asegurar la integridad de cálculos fiscales, estabilidad del BFF y experiencia de usuario en aplicaciones críticas:

- **Pruebas Unitarias y de Integración (Lógica de Negocio):** [Vitest](https://vitest.dev/)
- **Pruebas End-to-End (Flujos de Interfaz):** [Playwright](https://playwright.dev/)

---

## 2. Pruebas Unitarias e Integración (Vitest)

La mayoría del código de negocio crítico reside en los `packages/*` y en el **BFF (Hono)** dentro de Núcleo. Cada workspace posee su propio archivo `vitest.config.ts`, permitiendo la ejecución aislada o concurrente mediante Turborepo.

### Convenciones
- **Archivos:** `[nombre].test.ts` o `[nombre].test.tsx`.
- **Ubicación:** Junto al archivo fuente (ej. `utils.test.ts`) o dentro de un directorio `__tests__/` cuando hay múltiples tests agrupados por dominio.

### Cobertura Clave por Dominio

1. **`@enjambre/contable` y `@enjambre/fiscal` (Nivel Crítico)**
   - **Dónde:** `packages/contable/src/__tests__/` y `packages/fiscal/src/__tests__/`.
   - **Qué prueba:** Cálculos de IVA (F29, F22), impuestos, validadores de RUT, remanentes, Tasa de Cambio (BCC) y la ingestión de XML (DTE) del SII. 
   - **Por qué:** Un error de decimales o en lógica tributaria puede resultar en multas. Los *parsers* de recibos extranjeros (Uber, AWS, Meta) también se validan aquí.

2. **`@enjambre/pricing` y `@enjambre/wallet`**
   - **Dónde:** `packages/pricing/src/__tests__/`
   - **Qué prueba:** Reglas de multiplicadores por `Tier` (Embajador, Suscriptor), lógica de Checkout, y progreso de "stamps" en la billetera.

3. **Nucleo BFF (`apps/nucleo`)**
   - **Dónde:** `apps/nucleo/src/api/routes/__tests__/` y `apps/nucleo/src/api/lib/__tests__/`.
   - **Qué prueba:** Middleware CSRF, Route Guards de autenticación, integración con banco (webhooks), CMS, y endpoints críticos (sincronización fiscal y pagos).

---

## 3. Pruebas E2E (Playwright)

Los flujos que interactúan directamente con el usuario y el DOM, y que requieren validar estados complejos en el navegador, se delegan a **Playwright**. Cada aplicación Next.js cuenta con un `playwright.config.ts`.

### Convenciones
- **Archivos:** `[flujo].spec.ts`.
- **Ubicación:** Carpeta `/e2e/` en la raíz de cada aplicación.

### Flujos Validados (E2E)

- **Apps / Tienda (`apps/tienda/e2e/`)**
  - `checkout.spec.ts` y `checkout-smoke.spec.ts`: El *golden path* del e-commerce premium.
  - `replenishment.spec.ts`: Flujo de suscripciones/reposición automática.
  - `route-guards.spec.ts`: Validación visual de accesos denegados por rol.
  
- **Apps / Campo (`apps/campo/e2e/`)**
  - `pos.spec.ts`: Validación del Punto de Venta (Venta Rápida, Carrito).
  - *Nota:* Validaciones offline/online de Dexie se simulan y validan en esta suite o a través de tests de integración mockeados (`feria-offline.test.ts`).

- **Apps / Nucleo (`apps/nucleo/e2e/`)**
  - `dashboard.spec.ts`: Carga correcta del dashboard general gerencial.
  - `bandeja-fiscal.spec.ts`: Validación de las operaciones DTE.
  - `editor-tienda.spec.ts`: CMS visual funcional sin errores de superposición de z-index.

---

## 4. Ejecución de las Pruebas

Para mantener la calidad y asegurar que no hay regresiones, las pruebas se ejecutan mediante pnpm y Turborepo:

### Desde la Raíz (Monorepo)
- **Ejecutar todos los tests unitarios:** `pnpm test`
- **Ejecutar tests unitarios observando cambios:** `pnpm test:watch`

### En un Workspace Específico
Si solo deseas correr las pruebas del motor contable:
```bash
pnpm --filter @enjambre/contable test
```

### Ejecución E2E
*(Dependiendo de los scripts en package.json de cada app)*
```bash
pnpm --filter @enjambre/tienda test:e2e
```

---

## 5. Mejores Prácticas y Políticas (Zero-Trust)

1. **Nunca dependas únicamente de E2E:** Las validaciones E2E son caras de mantener y lentas de ejecutar. Prefiere Vitest para lógica matemática pura y reglas de negocio.
2. **Mocking Cuidadoso:** Al mockear la base de datos de Supabase, no asumas el retorno (ej: usa coalesce nulo). Las pruebas de integración en el BFF son preferibles al mocking completo del cliente de base de datos.
3. **Idempotencia:** Las pruebas que escriben o envían facturas (Ej. Transbank o SII) deben utilizar entornos de `sandbox` o emular explícitamente el fallo y la re-ejecución sin duplicar los registros.
