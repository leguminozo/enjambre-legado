# Microcanales — Ciencia y Gobernanza

> Documento de especificación congelada del módulo Microcanales (Capas 2–4).
> Estado del arte triangulado: economía conductual (loyalty) + ciencia sensorial (CATA/diferencial semántico) + canal y mercado (LatAm/Chile).
> Fecha: 2026-08-10 · Aplica a las migraciones `20260810{200000..240000}_*` y al código del módulo.

## Tesis

No es un programa de puntos: es la **primera infraestructura de percepción sensorial distribuida y validada de alimentos artesanales del sur de Chile**. El programa de lealtad es el mecanismo de reclutamiento de evaluadores; el canal B2B (cafés, tiendas, hoteles, revendedores) es la red de cata. El lock-in comercial y el activo científico son el mismo sistema.

---

## 1. Protocolo de panel sensorial distribuido (ST-CATA)

**Objetivo:** dos capas de datos comparables — percepción de consumidores (CATA) y percepción calibrada de la red (semi-entrenada) — con RV entre configuraciones.

- **Consumidores** (`perc_sesiones.tipo_evaluador = 'consumidor'`): instrumento de ~60s, sin entrenamiento. CATA con consumidores produce configuraciones moderadamente comparables al análisis descriptivo (RV ≈ 0.76) y es válido para productos de baja complejidad como la miel (DLG 05-2016).
- **Red semi-entrenada** (`tipo_evaluador = 'semi_entrenado'`): dueños de café, baristas y revendedores reciben **1 hora de capacitación con referentes físicos** (kit de referencias aromáticas: agua de azahar = floral, vainilla, cera, humo, cítricos…). ST-CATA alcanza 94–95% de similitud con panel descriptivo (Aarhus Univ. 2018).
- **Criterios de inclusión:** la sesión semi-entrenada se marca explícitamente; nunca se mezcla en el mismo agregado sin separar por `tipo_evaluador`.
- **Contrabalanceo:** `perc_sesiones.seed_orden` randomiza el orden de los chips por sesión (el orden de presentación afecta la respuesta — efecto documentado en CATA).
- **N mínimo:** no se publica "perfil" de un producto/punto con menos de **30 sesiones** (`umbral_perfil = 30` en el BFF); bajo el umbral la UI muestra "perfil en construcción".

## 2. Marco experimental de fidelización

**Objetivo:** saber si el programa *causa* recompra o solo la subsidia.

- **Holdout persistente:** 5–10% de revendedores (`b2b_revendedores.grupo_control` + `asignado_holdout_at`) y de membresías (`fid_membresias.grupo_control`) asignados aleatoriamente a control: sin incentivos ni comunicaciones del programa.
- **Métricas declaradas (KPIs):**
  - *Incrementality*: recompra del grupo tratado vs. holdout.
  - *Ratio de canibalización*: redenciones de compradores heavy/medium ÷ redenciones totales.
  - *Velocidad de recompra por cohorte*: días entre pedidos (goal-gradient — Kivetz 2006: el tiempo entre compras se acorta ~20% del primer al último sello).
  - *Tasa de redención* y *tasa de completación del instrumento*.
  - *N acumulado por SKU* (para el umbral de perfil).
- **Reglas de medición:** las cancelaciones NO borran del ledger — se compensan (contra-asiento en `fid_retribuciones`); los eventos de `fid_eventos` son inmutables.
- **Endowed progress:** la membresía parte con 1–2 sellos (`sellos_iniciales`) y el revendedor con puntos de bienvenida (`revendedor_puntos_bienvenida`) — Nunes & Drèze 2006: progreso artificial ≈ +80% de completación.
- **Re-enganche post-canje:** al aprobar un canje se otorga el primer sello del siguiente ciclo (el gradiente se resetea en el canje).
- **Ciclos:** la retribución monetaria liquida por pedido o trimestre (≤90 días); los tiers son estatus aspiracional con **ventana móvil de 12 meses** (un revendedor que parte en marzo no queda fuera del estatus anual).
- **Test de las dos oraciones:** cada regla/recompensa debe poder explicarse en dos oraciones — criterio de aceptación de la UI de configuración.

## 3. Política de privacidad y visibilidad de datos

- **RLS invariante:** un punto de venta ve SOLO su membresía, sus eventos y sus sesiones — **nunca el ledger global del cliente ni los datos de otro punto**. Los agregados globales solo los ve la marca (admin).
- **Contacto privado:** la vista pública `v_b2b_puntos_publicos` no expone contacto; la landing pública solo muestra nombre, tipo y ciudad de puntos `publico = true` y `estado = 'activo'`.
- **Identidad del consumidor:** la tarjeta (codigo_cliente) es un identificador **reutilizable por diseño** — sirve para vincular la sesión Y para verificar saldo en el local (sin cuenta, sin contraseña). El riesgo de reutilización es nulo: quien escanea con un código ajeno otorga puntos al dueño del código, no los recibe. Rate-limit global en claim y en sesiones. Sesión de percepción **anónima válida** — la percepción no depende de la identidad.
- **Moderación:** una reseña rechazada no aparece en la tienda, pero la sesión perceptual sí queda en agregados anónimos (`moderada_flag = true`).
- **Consentimiento explícito** en el registro del consumidor (percepción + contacto) — habilita el uso académico posterior de los datos.
- **Reglas visibles = confianza:** `fid_valores`, `fid_retribucion_reglas` y `fid_retribucion_tiers` son de lectura pública (SELECT policy) — el revendedor siempre puede ver cómo se calcula su retribución.

## 4. Narrativa de producto

- La miel chilena está en curva de sofisticación (873 g/cápita 2024, +401% vs 2013; 65,7% de hogares consumen apícola — ODEPA/CIJJ). El canal gourmet es minúsculo (3%) pero es donde el valor por kg es mayor: competimos por subir de categoría el consumo del hogar, no contra el supermercado.
- El instrumento captura el léxico real (5 descriptores que discriminan en mieles chilenas: **ahumado, caramelo, damasco, propóleos, vainilla** — panel chileno) y lo publica como reseña profunda en tienda: el consumidor compra con la voz de otros consumidores.
- WhatsApp como identidad ligera es el patrón ganador de conversational commerce LatAm (Yalo): sin app, sin login, sin descarga.
- **Elicitación local (fase 0, campo):** 40–60 descripciones libres en ferias/cafés de Chiloé sobre 4–6 mieles → ajustar `perc_chip_catalogos` (configurable, sin código) + material etnográfico del léxico vernáculo.

---

## Fuera de alcance (roadmap)

Gateway WhatsApp real (OTP) · pases Apple/Google Wallet (el patrón de `packages/wallet` existe pero los pases están en 503) · unificación de los ledgers web/POS existentes (`puntos_fidelizacion`, `ciclos`/`loyalty`, `guardian_stamps` — el sistema microcanal es canónico paralelo, no los toca) · compra POS automática (hoy la registra el dueño en su portal) · kit físico ST-CATA (protocolo escrito; kit se arma en campo) · pipeline analítico avanzado (Cochran's Q → análisis de correspondencias → penalty analysis / drivers of liking) · KPIs de canibalización/incrementality (se miden una vez haya datos del holdout).

## Fuentes clave

Kivetz, Urminsky & Zheng (2006) · Nunes & Drèze (2006) · Jaeger et al. (2020) · Aarhus Univ. (2018, ST-CATA) · DLG Expert Report 05-2016 · UC Davis Honey Flavor and Aroma Wheel · Marcazzan et al. (IHC) · Piana et al. (2004) · Galán-Soldevilla et al. (2010) · panel sensorial chileno (Cien. Inv. Agr. 35(1)) · Yalo conversational commerce · ODEPA / CIJJ (sondeo consumo de miel 2024)
