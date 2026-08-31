# Blindaje Socio-Técnico y Criptográfico (Bitácora de Patio)

> **Documento de Arquitectura y Gobernanza**
> Define los protocolos de seguridad, el modelo de libro mayor (ledger) inmutable, las mitigaciones de IA y el respeto antropológico por el oficio apícola para el sistema de dictado de Enjambre Legado.

## 1. Modelo de Amenazas (Threat Model)

Esta sección mapea los riesgos operativos y sistémicos frente a la naturaleza probabilística de la IA y el trabajo en terreno.

| Código | Amenaza | Vector de Ataque / Origen | Mitigación Arquitectónica |
| :--- | :--- | :--- | :--- |
| **T1** | **Alucinación Semántica (IA)** | El modelo LLM (Groq/Llama) confunde unidades de medida (ej. 20g en vez de 2.0g) o clasifica mal una actividad. | **Embudo Determinista:** Tipado estricto en Zod + Constrains duros en Postgres (Invariantes Biológicos). Protocolo *Readback* para confirmación humana en eventos de riesgo. |
| **T2** | **Divergencia de Estado (CQRS Drift)** | La proyección de lectura ("Estado Actual de la Colmena") se desincroniza de la sumatoria de eventos de la bitácora debido a errores de red o race conditions. | **Reconciliación Nocturna:** Cron diario (08 UTC) en `apps/nucleo` que reconstruye el estado desde el evento cero y notifica si hay desviación. |
| **T3** | **Fraude Orgánico / Alteración de Trazabilidad** | Un actor (interno o vulnerabilidad) intenta modificar la fecha o borrar un tratamiento sanitario para evadir periodos de carencia y certificar miel. | **Ledger Criptográfico:** RLS estricto (`INSERT ONLY`). Encadenamiento de Hashes (Hash-Chaining) por colmena. Imposibilidad matemática de alterar el pasado sin romper la cadena futura. |
| **T4** | **Asfixia del Oficio (Socio-Técnica)** | El esquema es tan rígido que el apicultor no puede registrar conocimiento tácito local (ej. "clima raro, abejas nerviosas"), generando fricción, abandono o registros vacíos. | **Válvula Cualitativa & Override:** Campo `notas_de_oficio` incondicional en todo evento. Sistema de "Decisión bajo Responsabilidad" (`override_reason`) para permitir que el humano sobreescriba la lógica si la realidad de campo lo exige. |
| **T5** | **Duplicidad de Eventos (Red Inestable)** | El apicultor dicta en el campo sin internet. Al volver a la señal, la app `Campo` envía el evento dos veces, duplicando dosis o cosechas. | **Idempotency Keys:** Generación de `UUIDv7` en el cliente (PWA). El BFF y Postgres rechazan silenciosamente cualquier UUID repetido. |

---

## 2. Invariantes Biológicos Operativos

Reglas de negocio duras que actuarán como "barandillas" (guardrails) en la capa de Zod (Hono BFF) y Postgres `CHECK` constraints. Si el LLM extrae datos fuera de estos rangos, la transacción aborta automáticamente.

*   **Límites Físicos de Población:**
    *   Una colmena/alza no puede tener $< 0$ o $> 10$ cuadros (Langstroth estándar).
    *   Si el evento indica "Formación de Núcleo", la población inicial no puede ser $> 5$ cuadros. 
    *   Si la población llega a $\ge 6$, se activa el trigger de conversión automática a "Colmena".
*   **Límites de Dosis Sanitaria:**
    *   Ejemplo: Ácido Oxálico máximo $5g/L$ por colmena.
    *   *Carencia*: Ningún evento de `Cosecha` puede ser procesado si la colmena tiene una `carencia_hasta` (Timestamp) mayor a `now()`.
*   **Cronología Geográfica:**
    *   Distancia GPS: Si el dispositivo reporta un dictado a $> 50km$ del registro maestro del apiario, se levanta bandera de discrepancia (el evento se guarda pero entra en estado `QUARANTINE`).

---

## 3. Diseño del Ledger Criptográfico (Esquema Postgres)

Para garantizar la cadena de custodia y la inmutabilidad financiera, la base de datos se modela bajo un patrón **Append-Only con Hash-Chaining**.

### Tabla: `bitacora_eventos`
```sql
CREATE TABLE bitacora_eventos (
  id UUID PRIMARY KEY, -- UUIDv7 generado en cliente (Idempotency)
  colmena_id UUID NOT NULL REFERENCES colmenas(id),
  apiario_id UUID NOT NULL REFERENCES apiarios(id),
  schema_version INT DEFAULT 1, -- Para evolución futura del DSL
  
  -- Jerarquía del Evento
  tipo_accion VARCHAR(50) NOT NULL, -- Ej: 'INSPECCION', 'TRATAMIENTO', 'COSECHA'
  payload JSONB NOT NULL, -- Los datos extraídos por la IA validados por Zod
  
  -- Escape Cualitativo (Socio-Técnico)
  notas_oficio TEXT, -- Lo que la IA no pudo clasificar o contexto tácito
  override_reason TEXT, -- Justificación si el humano forzó un límite
  
  -- Cadena de Custodia
  audio_path TEXT, -- URL en Supabase Storage (Inmutable)
  raw_transcript TEXT NOT NULL, -- Texto crudo extraído por Groq Whisper
  
  -- Criptografía y Confianza (Zero Trust)
  lat_lng geometry(Point, 4326),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Hash Chaining (Merkle Log por Colmena)
  prev_hash TEXT, -- Hash del último evento de esta colmena
  event_hash TEXT NOT NULL -- SHA256(prev_hash + payload + id + created_at)
);
```

### Reglas de Seguridad (RLS)
1.  **Impedir Mutaciones:** `REVOKE UPDATE, DELETE ON bitacora_eventos FROM authenticated, anon;`
2.  **Asegurar Continuidad:** Un *Trigger Function* `before_insert` verifica que `prev_hash` coincida exactamente con el `event_hash` de la última fila de esa `colmena_id`. Si no coincide (alguien borró o alteró la historia), la inserción falla de forma irrevocable.

---

## 4. Política de Evolución y Gobernanza

1.  **Nunca reescribir la historia:** Si en 2028 cambiamos la forma en que medimos la población de la colmena (ej. por sensores de peso en vez de conteo de cuadros), se incrementa el `schema_version` a `2`. Los eventos antiguos mantienen su `schema_version = 1`.
2.  **Correcciones Administrativas (Eventos Compensatorios):** Si un dato entró mal (ej. el apicultor confirmó accidentalmente el readback), **no se hace un `UPDATE`**. Se dicta/crea un nuevo evento de tipo `COMPENSACION` que invierte el cálculo numérico del evento erróneo, manteniendo el rastro de quién y por qué corrigió.
3.  **Apertura del Código:** El esquema de Zod (gramática apícola) debe tratarse como un estándar abierto del oficio en Chiloé, no como un secreto de software, permitiendo a la comunidad adaptarlo a los cambios climáticos o nuevas plagas.
