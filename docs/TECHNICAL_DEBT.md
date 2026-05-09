# Manifiesto de Deuda Técnica — Enjambre Legado

Este documento identifica los puntos de fricción, redundancia y fragilidad técnica que deben ser resueltos para asegurar la longevidad del ecosistema.

## 1. Redundancia en el Monorepo (Crucial)
### Problema: Carpetas "Copia de..."
Existen múltiples directorios como `apps/nucleo/Copia de Cafeteria Eureka!`, `Copia de Verano Eccomerce?`, etc.
- **Impacto**: Confusión en el rastro de git, desperdicio de espacio y riesgo de importar lógica de carpetas obsoletas.
- **Acción**: Realizar una purga total tras verificar que no existan assets únicos en esas carpetas.

### Problema: Aplicaciones en la raíz vs `apps/`
Hay componentes como `components/shop` en la raíz del proyecto mientras que otros están en `apps/tienda/components`.
- **Impacto**: Rompe la convención de monorepo y dificulta la reutilización.
- **Acción**: Migrar todos los componentes compartidos a `packages/ui` y los específicos a su respectiva aplicación.

---

## 2. Fragilidad en el Tipado y Versiones
### Problema: Versión de Next.js (Futurista/Inestable)
El proyecto declara `next: ^16.2.1`. Esta versión es experimental o mal declarada, lo que causa errores de compatibilidad con herramientas de linting y TypeScript (como el error de `null-check` en el Canvas).
- **Impacto**: Errores silenciosos en el build y dificultad para actualizar dependencias.
- **Acción**: Downgrade a una versión estable de Next.js (15.x) o fijar la versión exacta tras un test de regresión completo.

### Problema: "Stubs" en Paquetes Compartidos
Paquetes como `packages/ai` o `packages/maps` están prácticamente vacíos o tienen solo la estructura inicial.
- **Impacto**: Falsa sensación de modularidad. La lógica está actualmente "atrapada" dentro de las aplicaciones.
- **Acción**: Extraer la lógica de cálculo y geolocalización a estos paquetes.

---

## 3. Deuda de Datos y Seguridad
### Problema: Auditoría de RLS Incompleta
Aunque las políticas base existen, nuevas tablas (como `pedidos_cliente` o `marketing_posts`) necesitan una revisión exhaustiva para asegurar que no haya filtraciones de datos entre diferentes apicultores o clientes.
- **Impacto**: Riesgo de privacidad y cumplimiento legal.
- **Acción**: Ejecutar el prompt de "Auditoría de Seguridad" de la `PROMPT_LIBRARY.md`.

### Problema: Hardcoding de Contenido (Resuelto)
Gran parte de la landing page (Servicios, Talleres) tenía los textos "quemados" en el código.
- **Acción**: Se implementó una tabla `site_content` en Supabase y un sistema de fetching en `page.tsx` para dinamizar estos textos.
- **Estado**: Finalizado.

---

## 4. Infraestructura y DevOps
### Problema: Falta de Tests Automatizados
No existen unit tests ni tests de integración para el flujo crítico de checkout y pagos (Transbank).
- **Impacto**: Riesgo extremo de rotura en producción tras una actualización de dependencias.
- **Acción**: Implementar Playwright para el flujo de compra y Vitest para el paquete `@enjambre/contable`.

### Problema: Service Worker Desactualizado
Hay un `RegisterServiceWorker` pero la lógica de caché offline para el apicultor en terreno no está probada.
- **Impacto**: Pérdida de datos en el bosque de Chiloé (zona con baja señal).
- **Acción**: Refactorizar la lógica de `offline-sync` en `packages/offline`.
