# Documentacion — Enjambre Legado

> Sistema operativo para la regeneracion biocultural.

## Indice

| Archivo | Proposito | Tiempo |
|---|---|---|
| [`00_EMPEZA_AQUI.md`](./00_EMPEZA_AQUI.md) | Punto de entrada. Mapa de la documentacion y primeros pasos | 5 min |
| [`CONSTITUTION.md`](./CONSTITUTION.md) | Principios inviolables. Vision, filosofia, mandamientos | 5 min |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Topologia del monorepo, flujo de datos, integraciones, apps y paquetes | 15 min |
| [`AGENT_INSTRUCTIONS.md`](./AGENT_INSTRUCTIONS.md) | Reglas para agentes de IA. Convenciones, stack, workflow, anti-patrones | 10 min |
| [`DATABASE_SCHEMA.md`](./DATABASE_SCHEMA.md) | Esquema canonico completo. 20+ tablas, RLS, relaciones | 15 min |
| [`PROMPT_LIBRARY.md`](./PROMPT_LIBRARY.md) | Prompts pre-construidos para dirigir agentes con precision | 10 min |
| [`FRONTEND_ROADMAP.md`](./FRONTEND_ROADMAP.md) | Vision de producto por aplicacion. Pendientes y mejoras | 10 min |
| [`TECHNICAL_DEBT.md`](./TECHNICAL_DEBT.md) | Deuda tecnica priorizada. Critico, alto, medio, bajo | 5 min |
| [`VERCEL.md`](./VERCEL.md) | Checklist especifico para despliegue en Vercel | 5 min |
| [`../DEPLOY.md`](../DEPLOY.md) | Guia de despliegue multi-plataforma completa | 10 min |

## Lectura por Rol

### Agente de IA (Primera vez)
1. `00_EMPEZA_AQUI.md` → `CONSTITUTION.md` → `AGENT_INSTRUCTIONS.md` → `ARCHITECTURE.md`

### Desarrollador Frontend
1. `00_EMPEZA_AQUI.md` → `ARCHITECTURE.md` → `FRONTEND_ROADMAP.md`

### Desarrollador Backend
1. `00_EMPEZA_AQUI.md` → `DATABASE_SCHEMA.md` → `ARCHITECTURE.md` (seccion API)

### DevOps
1. `00_EMPEZA_AQUI.md` → `DEPLOY.md` → `VERCEL.md`

### Product Owner
1. `CONSTITUTION.md` → `FRONTEND_ROADMAP.md`

---

*Ultima actualizacion: Mayo 2026*
