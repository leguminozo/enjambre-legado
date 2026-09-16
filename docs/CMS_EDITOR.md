# CMS_EDITOR.md — Especificación Canónica del Editor de Tienda

> **Invariante Canónica de Arquitectura**:
> El auto-guardado es la **única** forma canónica de operar el Editor de Tienda (`/editor-tienda` en Núcleo).
> Toda mutación (edición de campos, switches, subida de fotos simple o masiva, reordenamiento) se persiste de forma directa en `site_content.content` con `draft_content: null` y dispara la revalidación ISR en vivo hacia la Tienda pública. No existe el paso forzado de "publicar actualización" para que los cambios surtan efecto.

---

## 1. Modelo de Persistencia y Auto-guardado Canónico

1. **Un solo plano de verdad (`content` vivo)**:
   - Todas las secciones del CMS (`CMS_SECTION_KEYS` en `apps/nucleo/src/lib/editor-tienda-sections.ts`) pertenecen a `AUTO_PUBLISH_SECTIONS`.
   - `POST /api/cms/items`: Inserta el ítem directamente con `content: input.content`, `draft_content: null`, e invoca `revalidateTiendaCms()`.
   - `PATCH /api/cms/items/:id`: Actualiza `content: input.content`, limpia `draft_content: null` (reconciliando cualquier residuo histórico), e invoca `revalidateTiendaCms()`.
   - `POST /api/cms/reorder`: Actualiza `item_order` e invoca `revalidateTiendaCms()`.
   - `DELETE /api/cms/items/:id`: Elimina la fila, limpia imágenes huérfanas asociadas e invoca `revalidateTiendaCms()`.
2. **Revalidación Inmediata de Tienda (ISR)**:
   - Cada cambio guardado en Núcleo contacta el endpoint de revalidación de la Tienda (`POST /api/cms/revalidate` o `/api/revalidate`), purgando el caché de Next.js (`site_content` tag) sin demora.
   - El iframe del Editor de Núcleo recibe un mensaje `CMS_UPDATE` o refresca su estado para mostrar el contenido idéntico a la producción.

---

## 2. Pipeline de Optimización de Imágenes WebP en Cliente

El procesamiento de imágenes antes de su subida a Supabase Storage se ejecuta en el navegador del operador (`apps/nucleo/src/lib/process-image.ts`), asegurando cero impacto en la cuota de CPU/memoria del servidor y nulo consumo de transformaciones de Vercel (conforme a las reglas de presupuesto Vercel Hobby en `AGENTS.md`).

### Especificaciones Técnicas del Optimizador:
1. **Resolución de Alta Fidelidad (Retina-Ready)**:
   - **Lado más largo máximo**: `1600px` (frente al antiguo 1200px), garantizando nitidez perfecta en pantallas Retina de MacBooks (3024×1964) y monitores 4K sin sobrecargar el peso en bytes.
   - Favicons: `512px`.
   - Logos de marca: `1600px` (preservando formato PNG / SVG con canal alfa).
2. **Calidad de Compresión WebP (`quality: 0.88`)**:
   - Compresión a 88% de calidad para WebP lossy en fotos de catálogo, galería, portadas y banners.
   - **Prevención de Banding**: Resuelve la posterización y artefactos en degradados oscuros/ámbar característicos de la identidad visual de Enjambre Legado.
   - **Peso promedio por imagen**: Entre 120 KB y 280 KB (más de 80% más ligera que el original JPEG/PNG).
3. **Multi-Step Downsampling (Reducción por Etapas)**:
   - Al redimensionar fotos de cámaras de alta resolución (24 MP, 48 MP o capturas de smartphone de 6000×4000px) a 1600px, el canvas reduce iterativamente por pasos sucesivos de 50% (half-sizing) antes del renderizado final con `imageSmoothingQuality = 'high'`.
   - **Resultado**: Cero moiré en panales de abejas, texturas de madera y detalles botánicos; eliminación completa de bordes dentados (aliasing bilineal).
4. **Preservación de Transparencia (`preserveAlpha`)**:
   - Campos de marca (`logo_url`, `logo_footer_url`, `logo_src`, `favicon_url`, `icon`): Mantienen formato PNG transparente o vector SVG sin compresión lossy.
5. **Caché Inmutable en CDN**:
   - Cada archivo se sube a `storage.from('cms')` con ruta `cms/{seccion}/{uuid}.webp` y cabecera `cacheControl: '31536000'` (1 año de caché inmutable en CDN).

---

## 3. Experiencia de Carga Múltiple (`galeria`)

- **Subida Masiva Segura**:
  - En la sección `galeria`, el botón `Subir varias` permite seleccionar decenas de fotos simultáneamente.
  - El procesamiento es **secuencial en cliente**: evita saturación de memoria RAM y caídas por Out-Of-Memory (OOM).
  - **Feedback Interactivo**: El botón se bloquea durante la subida, mostrando un spinner de carga y el progreso exacto (`Subiendo 3/15...`).
  - Al completar, un toast de confirmación informa la cantidad de fotos optimizadas a WebP y guardadas en vivo.
