# Registro de Afirmaciones Científicas Públicas

> **Clase: VIVO.** Regla estructural: una afirmación solo puede aparecer en HTML público
> (tienda) si está en el catálogo `packages/ciencia` con estado `triangulado` (fuente real y
> verificable). Los claims `pendiente` / `retirado` no existen para el render: es imposible
> colgarlos. Gate verificado por test en `packages/ciencia`.

## Contexto legal (Chile)

- **Ley 20.606** (rotulación de alimentos) y regulación MINSAL: un alimento no puede declarar
  efectos terapéuticos, ni sobre enfermedades, ni claims de salud en envase/página.
- Un claim publicable es **composición o contexto bibliográfico**, redactado como tal, con su
  cita visible. Nunca "efecto en tu cuerpo".

## Catálogo vigente (`CLAIMS_CIENCIA` en `packages/ciencia/src/index.ts`)

| id | Título público | Estado | Fuente |
|---|---|---|---|
| `ig_referencia` | Índice glucémico de referencia | triangulado | Foster-Powell, Holt & Brand-Miller (2002), Am. J. Clin. Nutr. 76(1):5–56 |
| `composicion_enzimas` | Enzimas de la miel cruda | triangulado | Codex Alimentarius CXS 12-1981 |
| `h2o2_antimicrobiana` | Peróxido de hidrógeno (contexto) | triangulado | White, Subers & Schepartz (1963), Science 142:794–795 |
| `hmf_limite_codex` | HMF: límite regulatorio de referencia | triangulado | Codex Alimentarius CXS 12-1981 |
| `perfil_organoleptico` | Origen botánico y perfil sensorial | triangulado | UC Davis Honey Wheel; Galán-Soldevilla et al. (2010); Cien. Inv. Agr. 35(1) |
| `manuka_comparable` | Comparación con variedades de referencia | pendiente | Requiere ensayo estandarizado por variedad |
| `antioxidante_ulmo_estudio` | Antioxidantes en flora nativa de Chiloé | pendiente | Consolidación bibliográfica pendiente |
| `efectos_ansioliticos` | Categoría salud mental | retirado | Ley 20.606 |
| `control_glucemico_clinico` | Categoría uso clínico (HbA1c, prediabetes) | retirado | Ley 20.606 |

## Qué se retiró del HTML público (con esta ola)

- `/nosotros` "Evidencia Científica": categorías **Control Glicémico clínico**, **Neuroprotección
  y Salud Mental**, **Contexto Epidemiológico Chile** y **Propiedades del Ulmo** sin cita →
  eliminadas del render (el CMS ya no alimenta la sección).
- `/ciencia`: tabla de CO₂ miel vs azúcar (0.5 vs 3.2 kg/kg) sin fuente → retirada; fallback
  mágico de 5.200 kg emitidos y coeficiente "15 kg/árbol/año" → reemplazados por metodología
  publicada (`@enjambre/impacto`) y dato real (`irr_records`); si no hay dato → "—".

## Flujo para agregar una afirmación

1. Escribir el claim como **composición/contexto** (nunca efecto terapéutico).
2. Tener la **cita real** (autor/año/medio verificable).
3. Agregarlo al catálogo con `estado: 'triangulado'` → test pasa → la página lo renderiza.
4. Sin cita real → `estado: 'pendiente'` → no se renderiza. Retirado legal → `estado: 'retirado'`.

## Rendimiento en páginas

- `/ciencia`: tabla + bloques renderizados desde `claimsTrianguladas()` / `getClaim()`.
- `/nosotros`: sección "Fuentes / Evidencia" renderizada solo desde el catálogo.