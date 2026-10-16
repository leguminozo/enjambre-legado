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

## 5. Mapa de reutilización (auditoría de duplicación, 2026-08-10)

Auditoría profunda de todo lo construido vs. el monorepo completo. Veredicto: la mayoría de las entidades **llenan huecos reales** (identidad ligera sin cuenta, órdenes B2B, instrumento CATA, equipo sin cuenta). Las duplicaciones reales se consolidaron en la migración `20260810250000_consolidacion_duplicacion.sql`:

| Construido | Existente | Decisión |
|---|---|---|
| `fid_retribucion_reglas` | `commission_rules` (rule_type + parameter JSONB) | **CONSOLIDADO** → reglas migradas como rule_type 'mayorista' |
| `infusion_tareas` | `crm_tareas` (generalizable) | **CONSOLIDADO** → crm_tareas con ref_tipo='infusion' (ref_tipo/ref_id/equipo_id/evidencia_path/estado en_proceso) |
| `b2b_resenas_revendedor` | `resenas_producto` (modo + producto_id nullable) | **CONSOLIDADO** → modo 'revendedor' + revendedor_id; moderación existente |
| `fid_retribuciones` (ledger) | `incentivo_ledger` | **SE QUEDA**: incentivo_ledger exige user_id NOT NULL (revendedores sin cuenta) y monto ≥ 0 (contra-asientos negativos) — relajar 4 constraints de un sistema vivo no justifica la consolidación; unificación de ledgers es proyecto aparte |
| `fid_retribucion_tiers` | `niveles_fidelizacion` | **SE QUEDA**: estatus aspiracional (ventana móvil 12m), modelo distinto; candidato futuro |
| `fid_programas` (sellos) | `guardian_stamp_programs` | **INVIABLE hoy**: guardian_stamp_progress exige user_id de auth; los clientes del microcanal no tienen cuenta. Roadmap: cuando fid_clientes.user_id se use |
| `fid_clientes` | `clientes` (user_id NOT NULL) | **SE QUEDA**: llena el hueco de identidad ligera global; puente vía fid_clientes.user_id |
| `b2b_pedidos` | `ventas.buyer_mode='b2b'` | **SE QUEDA**: `ventas` es el canal de los vendedores presenciales de campo (boletas de honorario) — los pedidos del microcanal NO contaminan ese canal |
| `b2b_revendedores` | `revendedor_profile` + `user_roles('revendedor')` | **VINCULADO**: claim con cuenta sincroniza user_roles (patrón AliadosB2BTab); PK user_id de revendedor_profile impide registro sin cuenta |
| `b2b_puntos_venta` (feria_evento) | `participante_contrato` | **VINCULADO**: participante_contrato_id — el vendedor de campo con contrato = dueño de su punto del microcanal |
| `infusion_materias_primas` | `ingredients` / `inventario_items` | **VINCULADO**: ingredient_id (costeo compartido) |
| `infusion_proveedores` | `terceros` (maestro) | **VINCULADO**: tercero_id |
| `perc_*` | `resenas_producto` (campos legacy) | **ALIMENTA**: la reseña guarda solo percepcion_sesion_id (una fuente de verdad); campos legacy siguen como canal |
| `infusion_equipo` | — (nadie cubre personas sin cuenta) | **SE QUEDA** (hueco real) |
| Roles nuevos | `profiles.role` CHECK | **NO SE CREARON** (correcto): claim user_id + RLS por dueño es más barato que un rol (CHECK + handle_new_user + role-redirect + sync app_metadata) y no resuelve el registro sin cuenta |

**Nutrir campo (POS de vendedores presenciales)** — la fidelización del microcanal viaja con la venta: `POST /rep-ventas/quick` acepta `fid_identidad` (tarjeta/email/whatsapp) → el BFF resuelve el punto del vendedor (por cuenta o contrato de feria) y acredita sellos/puntos (helper compartido `registrarEventoFid`). El POS muestra el QR de la landing del punto (percepción + puntos) en la pantalla de éxito. Offline-first respetado: el payload enqueueado lleva fid_identidad y quick lo procesa al sincronizar.

## 6. Dirección en desarrollo: Ecosistema Cafeterías de Especialidad, Fichas de Mesa A6 y Propuestas a Medida

### 6.1 Racional de oferta: De 4 kits a 2 niveles estratégicos + propuesta a medida
Para eliminar la fricción y parálisis de decisión en el canal de cafeterías de especialidad, la oferta se estructura en dos niveles limpios más una tarjeta abierta para solicitudes a medida:

1. **Nivel 1: Set Piloto de Mesa & Barra ($69.000 CLP netos)**:
   - **Enfoque**: Neutral y abstracto, sin imposición de dogmas ni prédica ecológica; enfocado 100% en compartir herramientas operativas de alta gama.
   - **Componentes**: 48 frascos de mesa de 25 g (12 Floral, 12 Avellana Chilena, 12 Cacao Santander, 12 Polen Pureo) + 6 frascos de vitrina de 150 g para mesón/caja (la venta de estos 6 frascos a PVP ~$9.900 amortiza casi la totalidad del kit).
   - **Láminas A6 de Mesa (105 × 148 mm)**: Tarjetas para atril/estante de mesa donde se condensa el protocolo completo de fidelización (perfil sensorial neutro, límite térmico <40°C y QR soberano al protocolo ST-CATA con 1 sello de bienvenida y 25 puntos en el Club Legado).
2. **Nivel 2: Reserva Barra & Vitrina Autor ($249.000 CLP netos)**:
   - **Enfoque**: Plan escalado de alta gama para cafeterías que validaron el piloto y requieren abastecimiento continuo de salón, vitrina retail de alto margen y granel técnico para barista.
   - **Componentes**: 144 frascos de 25 g de mesa + 24 frascos de 150 g de vitrina + 4 potes de 500 g (o 1 balde de 5 kg) de miel para barista (syrups fríos, lattes, repostería) + pack completo de láminas A6 plastificadas + atril de mesón + presencia en mapa público de cafeterías aliadas (`b2b_puntos_venta.publico = true`) + acceso permanente a escala mayorista con 5% de descuento por volumen.
3. **Tarjeta 3: Propuesta a Medida / Pedido Específico para Cafetería**:
   - Tarjeta interactiva en el showcase B2B orientada a tostadurías con múltiples sucursales, pedidos a granel personalizados, co-branding en fichas A6 de mesa o convenios de suministro programado.

### 6.2 Gobernanza y Editabilidad 100% desde Núcleo (Cero Hardcoding)
Toda la configuración del programa de cafeterías reside en las herramientas activas de Núcleo:
- **Editor de Tienda (`/editor-tienda` → sección `b2b_cafeterias`)**: Gobierna los textos públicos, la lista dinámica de kits (`kits`), márgenes, componentes físicos e integraciones digitales. Toda mutación se persiste en `site_content` y revalida ISR automáticamente en la Tienda pública.
- **Microcanales → Sets de Entrada (`/microcanales` → `SetsPanel.tsx`)**: Gestiona la correspondencia de inventario real en las tablas `b2b_sets_entrada` y `b2b_set_items`, permitiendo enlazar SKUs físicos de la tienda y controlar stock.
- **Microcanales → Puntos de Venta (`/microcanales` → `PuntosVentaPanel.tsx`)**: Administra los locales físicos (`b2b_puntos_venta`), aprueba su ingreso, genera su `codigo_acceso` de mesa y habilita su visibilidad pública en el mapa de aliados.
- **Estudio Editorial RRSS (`/estudio-rrss`)**:
  - `TabletopPrintModal.tsx`: Genera las fichas impresas para mesa calibradas en formato **A6 (105 × 148 mm)** para acrílicos de mesa y A5 para barra.
  - `HardDataInjectorModal.tsx`: Inyecta datos analíticos de lote y genera el QR de mesa vinculado al `codigo_acceso` de cada cafetería aliada (`/punto-de-venta/[codigo]`).

---

## Fuera de alcance (roadmap)

Gateway WhatsApp real (OTP) · pases Apple/Google Wallet (el patrón de `packages/wallet` existe pero los pases están en 503) · unificación de los ledgers web/POS existentes (`puntos_fidelizacion`, `ciclos`/`loyalty`, `guardian_stamps` — el sistema microcanal es canónico paralelo, no los toca) · compra POS automática (hoy la registra el dueño en su portal) · kit físico ST-CATA (protocolo escrito; kit se arma en campo) · pipeline analítico avanzado (Cochran's Q → análisis de correspondencias → penalty analysis / drivers of liking) · KPIs de canibalización/incrementality (se miden una vez haya datos del holdout).

## Fuentes clave

Kivetz, Urminsky & Zheng (2006) · Nunes & Drèze (2006) · Jaeger et al. (2020) · Aarhus Univ. (2018, ST-CATA) · DLG Expert Report 05-2016 · UC Davis Honey Flavor and Aroma Wheel · Marcazzan et al. (IHC) · Piana et al. (2004) · Galán-Soldevilla et al. (2010) · panel sensorial chileno (Cien. Inv. Agr. 35(1)) · Yalo conversational commerce · ODEPA / CIJJ (sondeo consumo de miel 2024)

