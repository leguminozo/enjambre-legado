# IA en Núcleo — Groq (neocloud)

**Alcance v1:** solo `apps/nucleo` (BFF Hono).  
**Proveedor:** [Groq](https://groq.com/) (neocloud de inferencia rápida; API OpenAI-compatible).  
**Principio:** la IA **no ve datos de otros usuarios**. Todo prompt/contexto se arma desde el `user_id` autenticado (registro propio: colmenas, bitácora, actor territorial).

No se expone en Tienda ni Campo en v1.

---

## 1. Arquitectura

```
Cliente (UI Núcleo)
    │  Bearer JWT
    ▼
BFF /api/ai/*  ── requireProfileRole ── user JWT Supabase
    │
    ├─► loadUserRegistryScope(userId)   // solo filas del usuario
    │
    └─► Groq API (server-only)
           GROQ_API_KEY
           https://api.groq.com/openai/v1
```

| Capa | Regla |
|------|--------|
| Cliente | Nunca `GROQ_API_KEY` / `NEXT_PUBLIC_GROQ_*` |
| BFF | Auth + rol; rate limit; scope por `auth.uid()` |
| Groq | Chat (Llama) + Speech-to-Text (Whisper) |
| RLS | Sigue aplicando en lecturas Supabase con JWT usuario |

---

## 2. Variables de entorno (solo nucleo)

| Variable | Requerida | Default | Uso |
|----------|-----------|---------|-----|
| `GROQ_API_KEY` | para usar IA | — | Server-only |
| `GROQ_CHAT_MODEL` | no | `llama-3.3-70b-versatile` | Chat / enriquecer |
| `GROQ_STT_MODEL` | no | `whisper-large-v3-turbo` | Audio → texto |
| `AI_ENABLED` | no | `true` si hay key | Kill-switch |

Agregar en Vercel **solo** proyecto Núcleo (no tienda/campo).

---

## 3. Endpoints v1

| Método | Ruta | Roles | Función |
|--------|------|-------|---------|
| `GET` | `/api/ai/status` | autenticado | Si Groq está configurado (sin filtrar key) |
| `POST` | `/api/ai/bitacora/transcribe` | admin, apicultor | STT de una captura **propia** → `transcript_raw` |
| `POST` | `/api/ai/registry/ask` | admin, apicultor, territorial | Pregunta acotada al **registro del usuario** |
| UI | `RegistryAskPanel` en inicio patio + territorial | mismos roles | Cierra el gap FE del endpoint |

### 3.1 Transcribir bitácora

```json
{ "captura_id": "uuid" }
```

1. Carga `voice_inspection_captures` con `user_id = auth.uid()` (o admin dueño vía RLS/BFF).  
2. Lee audio de storage `bitacora-audio` (path del usuario).  
3. Llama Groq Whisper.  
4. Guarda `transcript_raw` + `estado = transcrito`.  
5. Sigue el flujo existente: `POST /api/bitacora/capturas/:id/procesar` → curaduría.

### 3.2 Preguntar al registro

```json
{ "question": "¿Cuántas colmenas tengo sin inspección reciente?" }
```

El servidor inyecta un **contexto JSON solo del usuario** (colmenas, últimas inspecciones, actor territorial si aplica). El modelo no recibe IDs ajenos ni se le pide inventar datos fuera del contexto.

---

## 4. Scope “registro de cada usuario”

| Rol | Datos en contexto |
|-----|-------------------|
| `apicultor` | Sus colmenas, apiarios, últimas capturas/inspecciones |
| `territorial` | Su `actores_registro`, apiarios_registro propios, alertas de zona (si ya modelado) |
| `admin` | Contexto de **su** perfil + resumen ops acotado; no dump multi-tenant global en v1 |

**Prohibido en v1:**

- Cross-user RAG  
- Enviar service-role dumps completos a Groq  
- Tools que muten DB sin confirmación humana (solo lectura en ask; writes solo en transcribe de captura propia)

---

## 5. Relación con STT / plan bitácora

| Path | Estado |
|------|--------|
| Transcript **manual** | Ya en patio (PR6) |
| Transcript **Groq Whisper** | Este módulo (`/ai/bitacora/transcribe`) |
| Parseo local `parseTranscripcion` | Sin LLM (sigue siendo canónico) |
| LLM opcional para enriquecer parse | Horizon (no v1) |

---

## 6. Código

| Archivo | Rol |
|---------|-----|
| `apps/nucleo/src/api/lib/ai/groq.ts` | Cliente chat + STT |
| `apps/nucleo/src/api/lib/ai/user-registry-scope.ts` | Carga contexto user-scoped |
| `apps/nucleo/src/api/routes/ai.ts` | Rutas Hono |
| Montaje | `app/api/[[...routes]]/route.ts` → `/api/ai` |

---

## 7. Costos y privacidad

- Whisper y chat se facturan en cuenta Groq.  
- Audio y texto salen del perímetro Supabase hacia Groq (revisar política de datos / consentimiento si aplica).  
- Preferir `whisper-large-v3-turbo` + idioma `es` para latencia/costo en patio Chiloé.

---

## 8. Horizon (no v1)

- RAG vectorial multi-documento  
- Tools con escritura automática en colmenas  
- IA en Campo/Tienda  
- Multi-tenant “admin ve todos los apicultores en un solo prompt” (solo con diseño explícito de privacidad)

---

## 9. Notas de implementación (auditoría)

- `colmenas` **no** tiene `updated_at` — el scope ordena por `created_at`.  
- `audio_url` del sync es path relativo `userId/uuid.ext`; `resolveBitacoraStoragePath` tolera URLs con `/bitacora-audio/`.  
- Curaduría UI: solo muestra `capturado` **con** audio y sin transcript (STT), o estados de revisión con texto.  
- Errores STT/procesar se muestran con toast (no solo `console.error`).  
- Tras sync de audio, **auto-STT** best-effort (`NEXT_PUBLIC_BITACORA_AUTO_STT` ≠ `false`); si falla, queda el botón en curaduría.
