# NUCLEO_CHILOE.md — Arquitectura y Visión Territorial
> Documento de largo horizonte para el módulo Chiloé dentro de Núcleo.  
> Integra contexto estratégico, arquitectura técnica, modelo de datos, hoja de ruta y posicionamiento.  
> **Lectura obligatoria antes de tocar cualquier archivo bajo `src/components/apicultor/`, `src/views/RegistroTerritorialView*`, `src/api/routes/registro-territorial.ts` o migraciones 100+.**

---

## 0. Contexto estratégico — por qué existe este módulo

Chiloé tiene un ecosistema apícola fragmentado: apicultores residentes sin organización formal, trashumantes que llegan sin aviso desde el norte del país, propietarios de predios que no saben quién tiene colmenas en su tierra, y municipios que quisieran regular la actividad pero no tienen herramienta para hacerlo.

Obrera y Zángano (O&Z) está construyendo la infraestructura que hace posible ordenar ese ecosistema. **El vector de entrada no es la regulación directa, sino la utilidad práctica:** un sistema que resuelve problemas concretos (¿quién viene? ¿de dónde? ¿cuándo fumigan?) y que, al hacerlo, construye una posición estructural en el territorio.

### El movimiento central

```
Grupo de apicultores locales
    ↓  propone
Ordenanza Municipal (Art. 9: Registro Obligatorio)
    ↓  exige
Municipio sin capacidad técnica
    ↓  necesita
O&Z con Núcleo ya construido
    ↓  firma convenio
Todos los actores del territorio entran a Núcleo
    ↓  consolida
Monopolio de infraestructura de datos apícola en Chiloé
```

El poder no se declara. Se construye en silencio mientras otros piden cosas al SAG.

### Las tres capas

| Capa | Audiencia | Qué saben que existe |
|---|---|---|
| **A — Comunal** | Grupo de WhatsApp, apicultores de Queilen | La ordenanza, el registro comunal, la plataforma como herramienta útil |
| **B — Territorial** | Red Apícola Chiloé cuando se formalice | La Asociación Gremial, la Carta Constitutiva, la arquitectura económica |
| **C — Interna O&Z** | Gabriel, Sandra, agentes IA | Núcleo como infraestructura de control, modelo económico, ventaja estructural |

**Regla:** los documentos de Capa C nunca se comparten en las capas superiores hasta que la estructura esté consolidada.

---

## 1. Arquitectura del módulo en Núcleo

### 1.1 Ubicación en el monorepo

```
apps/nucleo/
├── app/(dashboard)/registro-territorial/
│   └── page.tsx                          ← ruta /registro-territorial
│
├── src/
│   ├── views/
│   │   └── RegistroTerritorialView.tsx   ← vista principal con tabs
│   │
│   ├── components/apicultor/
│   │   ├── ApiarioManager.tsx            ← gestión apiarios propios O&Z (existente)
│   │   ├── TrazabilidadPanel.tsx         ← lotes, stats, blockchain (existente)
│   │   ├── ColmenaFicha.tsx              ← ficha completa colmena (existente)
│   │   ├── MapaLegado.tsx                ← mapa Leaflet apiarios propios (existente)
│   │   ├── InscripcionActorForm.tsx      ← inscribir nuevo actor al registro ✅ Sprint 1
│   │   ├── AlertaFitosanitariaForm.tsx   ← emitir alerta de plaguicida ✅ Sprint 1
│   │   ├── AlertasPanel.tsx              ← panel de alertas activas ✅ Sprint 1
│   │   ├── MapaTerritorial.tsx           ← mapa por capas (Sprint 2)
│   │   └── LoteQRPreview.tsx             ← preview QR lote público (Sprint 3)
│   │
│   └── api/routes/
│       └── registro-territorial.ts       ← 11 endpoints BFF Hono ✅ Sprint 1

packages/database/supabase/migrations/
├── 00_initial_schema.sql                 ← apiarios, colmenas, inspecciones (existente)
├── 20260614053000_qr_trazabilidad.sql    ← qr_codes (existente)
└── 991_registro_territorial_apicola.sql  ← actores, predios, apiarios externos, alertas ✅ Sprint 1
```

### 1.2 Separación entre datos propios y datos territoriales

```
Datos de O&Z (existentes)          Datos del Registro Territorial (nuevos)
─────────────────────────          ─────────────────────────────────────────
apiarios                           actores_registro
colmenas                           predios_facilitadores
inspecciones                       apiarios_externos
cosechas                           alertas_fitosanitarias
qr_codes
lotes
```

**Regla de diseño:** los apiarios propios de O&Z también tienen una entrada en `actores_registro` con rol `api_residente`. O&Z es un actor del registro como cualquier otro — con la diferencia de que también opera la infraestructura.

---

## 2. Modelo de datos — tablas del Registro Territorial

### 2.1 `actores_registro`

```sql
id                UUID PK
user_id           UUID → profiles(id)
rol               TEXT  -- api_residente | api_trashumante | api_mixto |
                        -- prop_facilitador | agri_fitosanitario | agri_aplicador |
                        -- comercial_acopio | tecnico_inspector | institucion_publica
nombre_actor      TEXT NOT NULL
rup               TEXT  -- Registro Único Pecuario SAG (opcional en trámite)
comuna            TEXT NOT NULL
region            TEXT DEFAULT 'Los Lagos'
estado            TEXT  -- activo | suspendido | cancelado
nivel_acreditacion TEXT -- base | trazable | comprometido | referente
consentimientos   JSONB -- granular: mapa_comunitario, alertas, catalogo, acopio
```

**Niveles de acreditación:** no se autoasignan. Se obtienen por actividad documentada.

| Nivel | Requisito |
|---|---|
| `base` | Inscripción completada |
| `trazable` | ≥1 lote registrado con análisis o ≥1 temporada documentada |
| `comprometido` | Consentimiento de mapa comunitario + datos completos |
| `referente` | Validación por pares + producción verificada en plataforma |

### 2.2 `predios_facilitadores`

Propietarios de tierra que reciben colmenas de trashumantes. El Art. 9 de la Ordenanza Tipo exige que estén en el registro municipal — que es este.

```sql
id               UUID PK
actor_id         UUID → actores_registro(id)
nombre           TEXT
comuna           TEXT NOT NULL
zona             TEXT NOT NULL           -- sector en texto (no coordenada exacta)
lat_aproximada   DOUBLE PRECISION        -- ~1km precisión para mapa comunitario
lng_aproximada   DOUBLE PRECISION
superficie_ha    NUMERIC
disponible_desde DATE
disponible_hasta DATE
condiciones      TEXT
activo           BOOLEAN DEFAULT true
```

### 2.3 `apiarios_externos`

Declaración de ingreso de trashumantes. El que entra a operar en Chiloé debe declarar acá. Esto es lo que le faltaba al SAG: el registro local que identifica quién entra, cuándo y dónde.

```sql
id                   UUID PK
actor_id             UUID → actores_registro(id)
predio_id            UUID → predios_facilitadores(id)
n_colmenas           INTEGER NOT NULL
comuna_origen        TEXT NOT NULL        -- de dónde viene
comuna_destino       TEXT NOT NULL        -- en Chiloé
zona_destino         TEXT NOT NULL
lat_aproximada       DOUBLE PRECISION
lng_aproximada       DOUBLE PRECISION
fecha_ingreso        DATE NOT NULL
fecha_salida         DATE
cert_sanitaria_url   TEXT
cert_sanitaria_fecha DATE
estado               TEXT  -- declarado | activo | retirado | suspendido
```

### 2.4 `alertas_fitosanitarias`

Sistema de aviso de plaguicidas. Un agricultor declara que va a fumigar; la plataforma notifica a los apicultores dentro del radio. Esto resuelve el problema más urgente y más concreto del territorio.

```sql
id                     UUID PK
actor_id               UUID → actores_registro(id)
comuna                 TEXT NOT NULL
zona                   TEXT NOT NULL
lat_aproximada         DOUBLE PRECISION
lng_aproximada         DOUBLE PRECISION
radio_km               NUMERIC DEFAULT 3
producto               TEXT NOT NULL
tipo_producto          TEXT  -- herbicida | fungicida | insecticida | acaricida | fertilizante | otro
fecha_programada       TIMESTAMPTZ NOT NULL
periodo_carencia_horas INTEGER
confirmaciones         JSONB DEFAULT '[]'  -- [{actor_id, confirmado_at}]
estado                 TEXT  -- activa | ejecutada | cancelada
```

**RPC `alertas_en_radio(lat, lng, radio)`:** función Haversine en Postgres, sin extensión PostGIS requerida. Devuelve alertas activas dentro del radio dado.

### 2.5 Extensiones futuras (Sprint 3+)

```sql
-- Extensión de cosechas para lotes comerciales
ALTER TABLE cosechas ADD COLUMN
  variedad_floral TEXT,
  metodo_extraccion TEXT,        -- manual | centrifugo | prensado
  analisis_humedad NUMERIC,
  analisis_hmf NUMERIC,
  lab_nombre TEXT,
  lab_fecha DATE,
  canal_destino TEXT,            -- interno | individual | colectivo | acopio
  relato_publico TEXT,
  publico BOOLEAN DEFAULT false;
```

---

## 3. API BFF — endpoints del Registro Territorial

**Base:** `POST/GET /api/registro-territorial/...`  
**Auth:** `authMiddleware` (Bearer JWT validado con Supabase server-side)  
**Rate limit:** 100 req/min (rama `standardPaths` del rate limiter de Hono)

| Método | Ruta | Función |
|---|---|---|
| GET | `/actores` | Lista actores por comuna, rol o estado |
| GET | `/actores/me` | Perfil propio del usuario autenticado |
| POST | `/actores` | Inscribir nuevo actor |
| PATCH | `/actores/:id` | Actualizar perfil |
| GET | `/predios` | Predios activos disponibles |
| POST | `/predios` | Registrar predio facilitador |
| GET | `/apiarios-externos` | Apiarios externos declarados |
| POST | `/apiarios-externos` | Declarar ingreso de trashumante |
| PATCH | `/apiarios-externos/:id/estado` | Cambiar estado (retirado, etc.) |
| GET | `/alertas` | Alertas activas (con radio si lat/lng presentes) |
| POST | `/alertas` | Emitir alerta fitosanitaria |
| POST | `/alertas/:id/confirmar` | Confirmar recepción de alerta |
| PATCH | `/alertas/:id/estado` | Marcar alerta ejecutada o cancelada |

---

## 4. Modelo de roles y visibilidad

### 4.1 Quién ve qué en el mapa territorial (Sprint 2)

```
Sin login (público)
└── Zonas generales de actividad apícola en Chiloé
    └── Sin actores individuales, sin coordenadas

Login como actor del registro
└── Mapa comunitario: apiarios externos aproximados (círculo ~1km)
└── Alertas activas con zona y radio
└── Predios facilitadores disponibles
└── Perfil propio (coordenadas exactas propias)

Login como admin / O&Z
└── Todo lo anterior + coordenadas exactas de todos
└── Panel de gestión del registro
└── Exportación para municipios
```

### 4.2 Escalación de visibilidad por consentimiento

El campo `consentimientos` en `actores_registro` es JSONB. Los datos de un actor aparecen en capas comunitarias **sólo si** el consentimiento correspondiente está en `true`. Sin consentimiento, el actor existe en el sistema pero es invisible para el resto.

```typescript
// Ejemplo de check en el BFF
if (!actor.consentimientos.mapa_comunitario) {
  // devolver solo zona aproximada, nunca coordenadas
}
```

---

## 5. Hoja de ruta técnica

### Sprint 1 — Base ✅ COMPLETADO (julio 2026)

- [x] Migración `991_registro_territorial_apicola.sql`
- [x] 4 tablas nuevas con RLS + índices + RPC Haversine
- [x] BFF Hono `registro-territorial.ts` con 13 endpoints
- [x] Registrado en `app/api/[[...routes]]/route.ts`
- [x] `RegistroTerritorialView.tsx` — vista con tabs y stats
- [x] `InscripcionActorForm.tsx` — formulario de inscripción
- [x] `AlertaFitosanitariaForm.tsx` — emisión de alertas
- [x] `AlertasPanel.tsx` — panel de alertas comunitarias
- [x] Ruta `/registro-territorial` en Next.js App Router
- [x] Build verificado sin errores

### Sprint 2 — Mapa territorial por capas ✅ COMPLETADO (julio 2026)

- [x] `MapaTerritorial.tsx` / `MapaTerritorialBase.tsx` — mapa Leaflet con capas por rol (🐝 residentes, 🚚 trashumantes, ⚠️ alertas con radio)
- [x] Layer `comunitaria`: marcadores de apiarios externos aproximados (~1 km) + alertas
- [x] Integración con `alertas_en_radio` RPC para mostrar radio de alerta (BFF `GET /alertas?lat&lng`)
- [x] Integrado en `/registro-territorial` (tab Mapa) y en el panel del actor `/territorio` (tab Mapa Comunitario)
- [ ] Refinamientos pendientes: layer pública sin login (zonas generales), selector de comunas

### Sprint 3 — Lotes comerciales + QR público ✅ COMPLETADO (julio 2026)

- [x] Migración `101_lotes_comerciales.sql` — campos de trazabilidad comercial (actor_id → actores_registro, variedad floral, análisis de laboratorio, relato público, `publico`)
- [x] `LoteQRPreview.tsx` — preview interno del lote antes de publicar (existe; su integración en el panel del actor territorial queda para fase posterior)
- [x] Página pública `/lote/[id]` — escaneable sin login (pasaporte público con mapa Leaflet)
- [x] Integración con `qr_codes` / `qr_audit_trail` existentes

### Sprint 4 — Módulo económico básico (estimado: 5-7 días)

- [ ] Tabla `aportes_cooperativos` — registro de contribuciones
- [ ] Tabla `compras_conjuntas` — insumos comprados en grupo
- [ ] Tabla `liquidaciones_temporada` — cierre por temporada
- [ ] Vista `EconomiaInternaView.tsx` — disponible sólo para miembros
- [ ] Lógica de distribución proporcional por aporte

### Sprint 5 — Infraestructura compartida (estimado: 4-5 días)

- [ ] Tabla `activos_compartidos` — salas, bodegas, extractores, vehículos
- [ ] Sistema de reservas con calendario
- [ ] Gestión de uso y liquidación por hora/día
- [ ] Vista `InfraestructuraView.tsx`

### Sprint 6 — Integración institucional (estimado: variable)

- [ ] Exportación de datos para municipios (PDF o CSV firmado)
- [ ] Panel de acceso para instituciones públicas (rol `institucion_publica`)
- [ ] Webhook o endpoint público para consulta de registro (autenticado con API key municipal)
- [ ] Módulo de estadísticas territoriales para reportes anuales

---

## 6. Decisiones de diseño y por qué

### 6.1 Haversine sin PostGIS para alertas en radio

La función `alertas_en_radio` usa cálculo trigonométrico puro en SQL. No depende de la extensión PostGIS aunque el proyecto la tiene disponible. El motivo: las coordenadas de alertas son aproximadas (~1km precision) y el radio de consulta típico es 3-10km. A esa escala, Haversine es suficientemente preciso y elimina una dependencia de extensión en queries frecuentes.

### 6.2 Coordenadas siempre aproximadas en datos comunitarios

Las colmenas son activos de valor. Exponer coordenadas exactas en el mapa comunitario crearía riesgo de robo o sabotaje. El sistema almacena coordenadas exactas (privadas) pero sirve coordenadas aproximadas (±1km) en cualquier consulta comunitaria. La API BFF nunca devuelve `lat` y `lng` exactos en los endpoints de listado; sólo `lat_aproximada` y `lng_aproximada`.

### 6.3 Consentimientos granulares desde el primer registro

Muchos sistemas piden permiso global al inicio. Este sistema pide permisos granulares porque el territorio tiene actores con diferentes niveles de confianza y diferentes intereses. Un propietario facilitador puede querer aparecer en el catálogo de predios pero no en el mapa de alertas. Un agricultor puede querer emitir alertas pero no aparecer en el registro público. El JSONB de consentimientos es la solución.

### 6.4 Niveles de acreditación por actividad, no por declaración

El nivel `base` es el de inscripción. Los niveles superiores requieren actividad documentada en la plataforma. Esto tiene dos efectos: incentiva el uso real del sistema, y crea una jerarquía de confianza interna que no depende de validación externa (SAG, INDAP, municipio).

### 6.5 O&Z como actor del registro, no como administrador invisible

O&Z inscribe sus propios apiarios como `api_residente`. Aparece en el mapa comunitario. Participa en las alertas. Esto es deliberado: la credibilidad del sistema depende de que quien lo opera también se somete a sus reglas. La ventaja operativa de O&Z no es la invisibilidad; es que controla la infraestructura mientras todos los demás sólo usan el servicio.

---

## 7. Relación con el ecosistema legal

### 7.1 Qué hace la Ordenanza Municipal (Capa A)

La ordenanza tipo (ver `docs/ordenanza_tipo_chiloe_v01.md` en los artefactos del proyecto) establece:
- Registro Municipal Apícola obligatorio para todos los actores
- Exigencia de declaración de trashumantes antes del ingreso
- Sistema de alertas fitosanitarias como obligación, no como buena práctica
- Habilitación para convenios con organismos técnicos para operar el registro

El Art. 9 en particular crea el mandato de un registro que el municipio no puede construir solo. Ese es el punto de entrada de O&Z.

### 7.2 Qué hace la Asociación Gremial (Capa B)

La AG (DL 2.757) le da personalidad jurídica al grupo para:
- Firmar el convenio con el municipio para operar el registro
- Ser interlocutor formal ante SAG, INDAP, universidades
- Presentar la ordenanza en otras comunas de Chiloé

O&Z opera como proveedor técnico de la AG. La AG es el cliente visible; Núcleo es la infraestructura invisible.

### 7.3 Qué hacen los Estatutos y la Cooperativa (Capa B+)

Una vez que la AG está funcionando y hay confianza en el sistema:
- Los estatutos definen la gobernanza interna del registro
- La cooperativa permite gestionar el acopio colectivo y la distribución de excedentes
- O&Z pasa de ser proveedor técnico a ser socio técnico con participación en la cooperativa

---

## 8. Datos que Núcleo tiene que los demás no tendrán nunca

Al final del proceso, O&Z tendrá acceso legítimo a:

| Dato | Por qué es valioso |
|---|---|
| Mapa de todos los apiarios en Chiloé (residentes + trashumantes) | Nadie más tiene este registro completo |
| Calendarios de floración por zona y temporada | Inteligencia para planificación productiva |
| Historial de aplicaciones de plaguicidas por predio | Trazabilidad real de riesgo sanitario |
| Red de predios facilitadores disponibles | Mercado interno de acceso a territorio |
| Producción declarada por actor y temporada | Base para precios de acopio y negociación |
| Relaciones entre actores (quién vende a quién, quién facilita a quién) | Grafo de confianza territorial |

Estos datos tienen valor comercial, científico e institucional. La posición de O&Z como operador técnico del registro es lo que hace posible acceder a ellos de forma legítima.

---

## 9. Lo que no se construye en Núcleo (y por qué)

| Qué | Por qué no |
|---|---|
| Integración directa con SIPEC/SAG | No existe API pública. El SAG sigue siendo externo. |
| App móvil para el campo | Campo (la app de POS) es para venta; el registro territorial es gestión. Si se necesita móvil, es PWA sobre Núcleo. |
| Sistema de pagos internos (cooperativa) | Requiere estructura legal previa. Se construye en Sprint 4+ cuando la AG esté operando. |
| Módulo de crédito o financiamiento | Fuera del alcance legal de una AG. Requiere una cooperativa de ahorro y crédito separada. |
| Trazabilidad de cera, propóleos, jalea real | Posible en Sprint 4+, pero no es el core del registro territorial. |

---

## 10. Próxima sesión de trabajo

Antes de Sprint 2 (mapa territorial), correr:

```bash
# 1. Aplicar migración en Supabase
# Desde el dashboard de Supabase → SQL Editor → pegar contenido de:
# packages/database/supabase/migrations/991_registro_territorial_apicola.sql

# 2. Regenerar tipos TypeScript
cd packages/database && pnpm db:typegen

# 3. Levantar dev para verificar visualmente
pnpm --filter @enjambre/nucleo dev
# → ir a /registro-territorial y probar inscripción de actor
```

---

*Documento de largo horizonte · Obrera y Zángano / Núcleo · Julio 2026*  
*Actualizar cuando cambie la arquitectura de tablas, el modelo de roles o la hoja de ruta.*
