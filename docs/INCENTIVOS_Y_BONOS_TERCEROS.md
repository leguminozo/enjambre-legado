# Matriz Integral de Incentivos a Terceros, Bonos y Objetivos Comerciales

> **Clase**: ESPECIFICACIÓN TÉCNICA Y JURÍDICA CANÓNICA  
> **Estado**: Vigente (Septiembre 2026)  
> **Alcance**: `apps/nucleo` (BFF y Administración), `apps/campo` (POS / PWA Móvil), `packages/database` (Postgres 17, RLS, Triggers), `docs/RED_INTERCAMBIO_LEGAL.md`

---

## 1. Resumen Ejecutivo y Marco Doctrinario

En el modelo de economía regenerativa de **Enjambre Legado**, la comercialización hacia el consumidor final y canales corporativos se apoya en una red de **asociados comerciales independientes** (representantes de ventas feriales, embajadores bioculturales y distribuidores mayoristas B2B).

Para erradicar cualquier contingencia de **subordinación laboral** (Art. 7° del Código del Trabajo, jurisprudencia consolidada de la Corte Suprema, Rol N° 20.995-2026) y blindar el régimen de **Boletas de Honorarios** (Art. 42 N° 2 Ley de la Renta, Ley 21.133), todos los incentivos económicos han sido diseñados bajo los siguientes principios:

1. **Retribución por Resultado Objetivo (No por Tiempo a Disposición)**: Las comisiones y bonos se liquidan sobre hitos verificables de venta cerrada, volumen ferial o metas logísticas de apertura, sin control horario ni marcaje de asistencia.
2. **Autonomía Operativa**: El argumentario de venta, notas de cata y guías de objeciones son herramientas consultivas de libre disposición profesional, no instrucciones directas obligatorias.
3. **Claridad Tributaria F29 vs Ley 21.133**: La retención aplicada a cada boleta (15,25% para el año calendario 2026) es un **anticipo de Impuesto a la Renta de Segunda Categoría** ingresado al Fisco por la empresa (F29, Línea 61, Cód. 151), mientras que la seguridad social se determina anualmente en la Operación Renta (F22) conforme al Art. 89 del D.L. 3.500.

---

## 2. Radiografía de Capas de Incentivos en el Código

El ecosistema cuenta con cuatro capas complementarias de incentivos implementadas en base de datos y backend:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      CAPAS DE INCENTIVOS ENJAMBRE LEGADO                        │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 1. MOTOR DE COMISIÓN DINÁMICA (commission_rules + calcular_comision_venta)       │
│    Venta diaria en Campo: Base * Canal * MultiplicadorVolumen + Fidelización     │
│    + Racha * MultiplicadorTier                                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 2. INCENTIVOS LOGÍSTICOS Y FERIALES (participante_contrato + incentivo_ledger)   │
│    Hitos de evento: Bono Apertura Evento CLP + Bono Meta Ventas CLP              │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 3. CONDICIONES MAYORISTAS Y DESCUENTOS B2B (b2b_investment_tiers)                │
│    Tramos de volumen: 5% ($500K-$1M) | 10% (>= $1M) | MOQs frascos/sachets       │
├──────────────────────────────────────────────────────────────────────────────────┤
│ 4. LEALTAD Y RESEÑAS SENSORIALES (guardian_tier_configs + beneficios_enjambre)   │
│    Ciclos del Néctar: Obrera, Zángano, Reina, Colmena (Canje 100 pts = $1.000)   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Capa 1: Motor de Comisión Dinámica de Ventas

Implementado en `packages/database/supabase/migrations/40_rls_hardening_audit.sql` (reemplazando migraciones 28, 30 y 31) y consumido vía BFF en `apps/nucleo/src/api/routes/rep-ventas.ts`.

### 3.1 Tipos de Regla (`commission_rules`)

La tabla `public.commission_rules` permite al administrador en Núcleo (`/reglas-comision`) definir parámetros activos por empresa:

| `rule_type` | Parámetro JSON (`parameter`) | Valor por Defecto | Propósito Comercial |
|---|---|---|---|
| `base` | `{"rate": 0.10}` | 10% | Tasa base estándar sobre el total bruto de la venta. |
| `channel_rate` | `{"channels": {"feria": 0.10, "delivery": 0.08, "local": 0.10, "corporativo": 0.12, "referido": 0.09, "web": 0.07}}` | Variable según canal | Modula la comisión según el esfuerzo comercial del canal (corporativo premia 12%, delivery descuenta costo logístico al 8%). |
| `volume_threshold` | `{"threshold": 50000, "multiplier": 1.2}` | $\times 1.2$ al superar \$50.000 | Multiplicador acelerador: al superar el umbral diario acumulado de ventas, todas las ventas posteriores en la sesión reciben un multiplicador. |
| `loyalty` | `{"bonus_rate": 0.03}` | +3% extra | Premia la fidelización de cartera: si el cliente es recurrente (`is_new_client = false`), se añade un 3% extra sobre el total. |
| `streak` | `{"bonus_amount": 5000, "min_days": 7}` | \$5.000 fijo o 10% base | Reconoce la constancia operativa en ferias continuas ($\ge 7$ días activos). |
| `tier_bonus` | `{"tiers": {"base": 1.0, "senior": 1.1, "elite": 1.2, "legend": 1.3}}` | 1.0 a 1.3 | Factor de maestría según el histórico del representante en `rep_profiles`. |

### 3.2 Fórmula Matemática Canónica (`calcular_comision_venta`)

Cada vez que se inserta una venta vinculada a un representante y sesión de caja, el trigger de base de datos ejecuta la función PL/pgSQL:

$$\text{TasaCanal} = \text{COALESCE}(\text{regla\_canal}[\text{channel}], \text{TasaBase})$$

$$\text{ComisiónBase} = \text{TotalVenta} \times \text{TasaCanal}$$

$$\text{BonoFidelización} = \begin{cases} \text{TotalVenta} \times \text{TasaLoyalty}, & \text{si cliente es recurrente} \\ 0, & \text{en caso contrario} \end{cases}$$

$$\text{BonoRacha} = \begin{cases} \text{BonoRachaFijo}, & \text{si racha activa} \ge 7 \text{ días} \\ 0, & \text{en caso contrario} \end{cases}$$

$$\text{ComisiónTotal} = \Big( (\text{ComisiónBase} \times \text{MultiplicadorVolumen}) + \text{BonoFidelización} + \text{BonoRacha} \Big) \times \text{MultiplicadorTier}$$

#### Ejemplo Numérico Real
Un vendedor categoría **Elite** ($\times 1.2$) realiza una venta ferial de **\$60.000 CLP** a un cliente habitual (recurrente), habiendo superado previamente la meta diaria de \$50.000 (multiplicador de volumen $\times 1.2$):
1. **Comisión Base**: $\$60.000 \times 10\% = \$6.000$
2. **Volumen Aplicado**: $\$6.000 \times 1.2 = \$7.200$
3. **Bono Fidelización**: $\$60.000 \times 3\% = \$1.800$
4. **Subtotal**: $\$7.200 + \$1.800 = \$9.000$
5. **Factor Tier Elite**: $\$9.000 \times 1.2 = \mathbf{\$10.800\text{ CLP}}$ (Tasa efectiva neta del **18,0%** sobre la venta).

---

## 4. Capa 2: Incentivos Logísticos y de Evento Ferial

Regulado en `packages/database/supabase/migrations/66_incentivo_ledger.sql`, `71_ledger_honorarios_bridge.sql` y `20260912020000_contratos_socios_y_blindaje_honorarios.sql`.

### 4.1 Variables Contractuales (`public.participante_contrato`)

Para eventos feriales (ej. Feria de Castro, Expo Chiloé, Mercado Gourmet Santiago), el contrato comercial entre la empresa y el prestador estipula tres palancas:

1. **`comision_pct` (Comisión porcentual de feria)**:
   - Porcentaje acordado sobre el total de ventas brutas del evento (habitualmente 10% al 15%).
2. **`bono_puntualidad_clp` $\rightarrow$ Denominado "Bono de Apertura de Evento"**:
   - **Monto fijo** (ej. \$15.000 a \$25.000 CLP).
   - **Criterio de devengo**: Hito logístico objetivo. Se desbloquea cuando el módulo ferial cuenta con la caja abierta (`cash_sessions` en estado `open`), stock desembalado e inventario físico verificado dentro de la ventana ferial previa a la apertura de público (ej. antes de las 10:00 AM).
   - **Blindaje**: No sanciona atrasos personales ni computa horas de permanencia; remunera la disponibilidad del activo comercial a tiempo.
3. **`bono_ventas_clp` (Bono por Superación de Meta Ferial)**:
   - **Monto fijo** (ej. \$30.000 a \$50.000 CLP).
   - **Condición**: Se liquida únicamente si el monto total vendido en el evento supera el umbral `meta_ventas_clp` (ej. \$1.000.000 CLP).

### 4.2 Conciliación y Liquidación en `incentivo_ledger`

Al cerrar el evento:
1. El admin aprueba los ítems en `public.incentivo_ledger` (`tipo IN ('comision_feria', 'bono_apertura_evento', 'bono_meta_ventas')`).
2. Mediante la RPC `preparar_honorario_desde_ledger` (migración 71), el sistema crea un borrador en `public.honorarios` calculando la **retención legal F29 (15,25%)**:
   $$\text{MontoBruto} = \text{MontoLedger}$$
   $$\text{RetenciónSII} = \text{MontoBruto} \times 0.1525$$
   $$\text{LíquidoAPago} = \text{MontoBruto} - \text{RetenciónSII}$$
3. El asociado emite su boleta de honorarios en el portal del SII con los datos exactos provistos por la app Campo.

---

## 5. Capa 3: Escalas Mayoristas y Condiciones Comerciales B2B

Implementado en `packages/database/supabase/migrations/20260911000000_centralizar_incentivos_nucleo.sql`.

A diferencia de los revendedores en feria que operan a comisión de honorarios por cuenta de Enjambre Legado, los **clientes mayoristas (hoteles, cafeterías, tiendas gourmet)** adquieren producto en firme bajo factura exenta/afecta:

| Nivel de Inversión (`b2b_investment_tiers`) | Rango de Compra Neta | Descuento Comercial |
|---|---|---|
| **Base** | Menor a \$500.000 CLP | 0% (Precio catálogo mayorista) |
| **Volumen 5%** | \$500.000 a \$999.999 CLP | **5% de descuento** sobre neto |
| **Mayorista Preferente 10%** | \$1.000.000 CLP o superior | **10% de descuento** sobre neto |

### Condiciones Operativas B2B (`b2b_wholesale_rules`):
- **MOQ (Pedido Mínimo)**: 120 frascos surtidos o 500 sachets.
- **Despacho Gratuito RM**: Compras netas $\ge \$900.000\text{ CLP}$.
- **Garantía y Calidad**: 30 días de plazo máximo para reclamos técnicos, temperatura de custodia exigida entre 15°C y 25°C para salvaguardar la enzima invertasa viva.

---

## 6. Capa 4: Guardianes del Bosque y Lealtad Sensorial

Gobernado en `packages/database/supabase/migrations/20260911000000_centralizar_incentivos_nucleo.sql`:

- **Canje de Puntos de Lealtad**: 100 puntos = \$1.000 CLP de descuento en compras.
- **Acumulación**: \$100 CLP de compra = 1 punto generado.
- **Incentivo a la Cata Sensorial**: Cada cliente que completa una cata organoléptica y registra su reseña validada por administración recibe **5 Ciclos del Néctar** (`ciclos_por_resena`) y el stamp digital de autenticidad en su credencial.
- **Tiers de Guardián**:
  - **Obrera**: Nivel base.
  - **Zángano**: 500 ciclos o \$50.000 acumulados.
  - **Reina**: 2.000 ciclos o \$300.000 y 5 árboles nativos plantados.
  - **Colmena**: 5.000 ciclos o \$1.000.000 y 10 árboles nativos protegidos.

---

## 7. Matriz de Blindaje Laboral y Prevención de Contingencias

| Elemento en Sistema | Riesgo Laboral (Art. 7 CT) | Blindaje en Enjambre Legado |
|---|---|---|
| **Argumentario y Guía de Cata** | Que se interprete como orden directa o guion obligatorio de subordinación. | Se rotula explícitamente como **recurso voluntario de apoyo comercial**. El revendedor puede adaptar o prescindir de su lectura según su criterio. |
| **Bono de Apertura de Evento** | Que se califique como "control de asistencia y puntualidad horaria". | No hay registro de asistencia personal. El bono retribuye la meta logística de tener el estand habilitado y listo para operar antes de la apertura ferial. |
| **Metas de Ventas** | Que se califique como imposición unilateral de cuotas bajo amenaza de despido. | Es una bonificación meramente positiva: alcanzarla otorga retribución adicional; no alcanzarla no conlleva sanción ni penalización. |
| **Capacitación en App** | Que los módulos de entrenamiento simulen jornada pasiva o dependencia. | Se estructuran como **"Escuela de Venta Portátil"** integrada en el catálogo: autoaprendizaje consultivo bajo demanda del asociado. |

---

## 8. Gobernanza Administrativa desde Núcleo

Cualquier ajuste en los porcentajes o metas no requiere modificación de código fuente ni despliegue:
1. **Reglas de Comisión**: Editar en `/reglas-comision` (Hono BFF: `/api/commission-rules`).
2. **Parámetros Feriales**: Configurar en `/operadores-feria` al crear o editar contratos de evento.
3. **Escalas B2B y Guardianes**: Ajustables en `b2b_investment_tiers`, `b2b_wholesale_rules` y `guardian_tier_configs` desde el panel central de configuración.
