# Estudio RRSS — Ley de Formatos de Salida y Alcances de Movimiento
### Enjambre Legado · Chiloé 42°S · OBR (Obrera y el Zángano)

> **Clase: LEY.** Regla de salida del estudio. La comparten los dos motores: el
> generador de láminas (`/estudio-rrss`) y el generador audiovisual
> (`/estudio-audiovisual`). Ningún motor inventa un formato propio.
>
> **Relacionado:** [`RRSS_POSICION_PUBLICA.md`](./RRSS_POSICION_PUBLICA.md) ·
> [`ANTI_SLOP.md`](./ANTI_SLOP.md) · [`PLAN_MARKETING_MENSUAL_CARRUSELES.md`](./PLAN_MARKETING_MENSUAL_CARRUSELES.md) ·
> [`CARRUSEL_01_PRODUCCION.md`](./CARRUSEL_01_PRODUCCION.md) ·
> `../AGENTS.md` · `../system_invariants.md`

---

## 1. Principio

La pieza se construye entera desde dentro del estudio: modelo, color, movimiento
y salida. No hay plantilla ajena, ni generador externo, ni servicio de render.

Tres consecuencias:

1. **Una sola fuente de color.** El hex vive en `packages/ui/src/tokens.css`. Los
   motores Canvas lo leen en runtime (`@enjambre/ui/design-tokens`).
2. **Una sola fuente de movimiento.** El alcance decide; el compositor ejecuta.
3. **Una sola fuente de salida.** La tabla de formatos es ley, no preferencia.

---

## 2. Regla de formatos de salida

El operador elige. El estudio responde con lo que el equipo puede hacer, y
avisa con voz de casa cuando algo no está disponible.

| Formato | Familia | Uso | Pérdida | Alfa | Reproducible |
|---|---|---|---|---|---|
| **PNG** | imagen | Archivo de marca, feed, impresión | No | No | Sí |
| **JPG** | imagen | Mensajería, peso mínimo | Sí | No | Sí |
| **WebP** | imagen | Web, piezas flotantes | No | Sí | Sí |
| **MP4** | video | Reels, TikTok, Stories | Sí | — | Sí (cuadro a cuadro) |
| **WebM** | video | Web abierta, alternativa | Sí | — | Sí (cuadro a cuadro) |
| **Modelo** (JSON) | dato | Reabrir y seguir editando | — | — | Sí |
| **Receta** (JSON) | dato | Reproducir la pieza idéntica | — | — | Sí |

**Progressive enhancement del video** (obligatorio, en este orden):

1. `webcodecs` — cuadro a cuadro. El tiempo del archivo se respeta siempre y el
   resultado es reproducible. Códice según destino: H.264 para MP4, VP9 para WebM.
2. `mediarecorder` — grabación en vivo. Entra como respaldo: si el equipo no
   sostiene el ritmo, el video se estira. Se avisa al operador.
3. Sin video: solo imagen y modelo. Se avisa con la razón, sin jerga.

> **Por qué MP4 antes que WebM por defecto.** La grabación en vivo produce WebM en
> los navegadores de escritorio. Las redes no aceptan WebM. El camino cuadro a
> cuadro resuelve el códec y la extensión en el mismo paso.

**La receta** es la memoria de la pieza: alcance, proporción, semilla, duración,
índice de láminas y una suma de verificación. Con la receta, la pieza se vuelve
a generar idéntica. Sin ella, solo queda el archivo.

---

## 3. Los tres alcances de movimiento

No son tres estilos: son tres decisiones sobre cuánto se mueve la marca.

| | **Estático** | **Elegante** | **Rupturista** |
|---|---|---|---|
| Sublabel | Pieza de archivo | Lujo silencioso | Zona experimental |
| Transición | Corte (0 ms) | Disolvencia (700 ms) | Ruptura (260 ms) |
| Revelado | — | 28 bandas, retardo 26 ms | 12 bandas |
| Ken Burns | — | 5 % | 8 % |
| Sustrato | 0 % | 12 % | 20 % |
| Ruptura de grilla | — | — | 46 px, eje 0,46° |
| Glitch | — | — | 7 tiras, máximo 3 eventos |
| Imprimible | Sí | Sí | **No** |
| Movimiento reducido | Estático | Primera lámina | Primera lámina |

### 3.1 Ley del alcance rupturista

El efecto no puede cobrar su precio en la información.

- **El dato nunca se oculta.** El glitch ocurre solo en la transición; el cuerpo
  de la lámina no se deforma.
- **La lectura manda.** Ningún bloque sale del marco mientras sostiene un dato.
- **El copy no se relaja.** Lo que se publica en alcance rupturista pasa por la
  misma puerta de voz que el alcance estático (`checkBrandCompliance`).
- **Presupuesto.** Máximo 3 eventos de glitch por pieza. Más que eso es ruido,
  y ruido no es ruptura.
- **No se imprime.** El alcance rupturista no genera kit de mesa.

### 3.2 Ley del alcance elegante

- Máximo un acento por composición. El movimiento no añade color: mueve lo que
  ya está en la lámina.
- La fotografía respira; el texto no tiembla.
- Nada parpadea. Si un efecto necesita parpadear, es rupturista.

---

## 4. Arquitectura

```
packages/ui/src/tokens.css              ← única fuente de hex (editorial incluido)
packages/ui/src/lib/design-tokens.ts    ← lector runtime para Canvas 2D

apps/nucleo/src/components/marketing/
  export-targets.ts     ← LA REGLA: tabla de formatos + detección de equipo
  slide-motion.ts       ← los 3 alcances, curvas de marca, línea de tiempo
  slide-effects.ts      ← registro extensible de efectos (layer / frame)
  slide-compositor.ts   ← compone lámina + sustrato + efectos en un cuadro
  slide-sequence.ts     ← recorre la pieza cuadro a cuadro, cachea láminas
  slide-video-export.ts ← WebCodecs (Mediabunny) + respaldo MediaRecorder
  slide-export-service.ts ← salida única: imagen, video, modelo, receta
  substrate-field.ts    ← campo de curl (libre de divergencia) + disco de Poisson
  prng.ts               ← aleatoriedad reproducible (mulberry32 + hash FNV-1a)
  SlideExportPanel.tsx  ← selector de alcance y formato

circulacion/rrss/instagram/tokens.py    ← la misma paleta para la oficina
```

**Flujo de un cuadro:**

```
SlideData ──► renderSlideToCanvas()  ──► lienzo de lámina (cacheado por índice)
                                             │
sustrato (lienzo transparente) ───────────►  ├──► composeFrame()
                                             │      ├─ 1. lámina (máscara/transform)
                                             │      ├─ 2. sustrato encima (12–20 %)
                                             │      └─ 3. efectos de cuadro
                                             │
                                             └──► PNG/JPG/WebP  ·  MP4/WebM  ·  JSON
```

**Por qué la lámina se cachea.** El movimiento se compone sobre la capa, no
sobre el texto. Exportar video no cuesta N veces el costo de exportar la imagen.

**Por qué el sustrato va encima.** La lámina es opaca: si el sustrato va debajo,
no se ve. Por eso el sustrato se arma en lienzo transparente (solo la vida, sin
fondo) y se compone sobre la pieza con opacidad baja. La atmósfera manda sobre
la paleta del sustrato: el tema `tierra` usa el sustrato `cobre`, `selva` usa
`selva`, `marfil` usa `marfil`.

---

## 5. Determinismo

La pieza se publica, se audita y se reproduce. Por eso el estudio no usa azar
irrepetible.

- **Semilla.** Derivada del contenido de la pieza (índices, títulos, alcance).
  Visible en el panel de salida.
- **Flujos separados.** Campo, partículas y tinta tienen secuencias propias:
  cambiar una paleta no reubica todo lo demás.
- **Sustrato.** `IdentitySubstrateSimulation` dejó de usar `Math.random()`: la
  misma semilla produce la misma pieza.
- **Efectos.** El glitch y la ruptura de grilla se calculan con su propio flujo,
  derivado de la semilla y del instante de la transición.

---

## 6. Estado del arte (2026) y qué se hizo con él

Investigación de referencia usada para decidir, no para vitrine.

| Hallazgo | Estado | Decisión en el estudio |
|---|---|---|
| **GSAP 3.13+**: todos los plugins son libres (SplitText, MorphSVG, DrawSVG, CustomEase) | Ya instalado (`gsap@3.15`) | **No se usa todavía.** El compositor dibuja en Canvas 2D, no en DOM: `SplitText` no aplica. Queda disponible para las vistas de la tienda. |
| **WebCodecs `VideoEncoder`** + **Mediabunny** (sucesor de `mp4-muxer`, ya deprecado) | Chrome 94+, Firefox 130+, Safari 16.4+ (video), completo en Safari 26 | **Adoptado.** MP4/WebM cuadro a cuadro, reproducible, con el códec que pide el destino. `mediabunny` es la única dependencia nueva: 17 kB con tree-shaking, cero cómputo de servidor. |
| **MediaRecorder** | Universal | **Degradado a respaldo.** Produce WebM en escritorio y se estira si el equipo no sostiene el ritmo. |
| **Curl noise** (campo libre de divergencia) | Práctica de referencia | **Adoptado.** `substrate-field.ts`: potencial escalar con ruido de gradiente 3D sembrado, campo por rotación del gradiente. La divergencia medida es 0,00000 contra 0,05153 de un sumidero radial: el flujo no tiene fuentes ni sumideros. |
| **Flujos de azar separados** (campo / partículas / tinta) | Disciplina de arte generativo | **Adoptado.** `prng.ts` abre un flujo por etiqueta. |
| **Blue noise** (distancia mínima, Bridson) | Práctica de referencia | **Adoptado.** La colocación inicial del sustrato usa disco de Poisson: distancia mínima garantizada. El azar puro se ve como azar; el azar con distancia mínima se ve como decisión. |
| **Control de calidad adaptativo** (monitoreo de frame time) | Práctica de referencia | **Adoptado.** El motor mide el costo del cuadro y baja calidad en dos escalones (menos capas del campo, luego menos vida) antes de que la pieza vaya a tirones. El nivel aparece en pantalla. |
| **Pausa cuando nadie mira** | Disciplina de rendimiento | **Adoptado.** El sustrato no avanza si la pestaña está oculta o el lienzo salió de pantalla. |
| **Advección en worker con buffers transferibles** | Práctica de referencia | **Descartado con medición.** El campo cuesta 1,24 ms cada 6 cuadros → 0,21 ms por cuadro, **1,2 %** del presupuesto de 16,67 ms. El cuadro completo mide **1,3 ms (7,8 %)**. Un worker compraría 1,2 % a cambio de asincronía, un camino de respaldo y complexity. No se agrega. |
| **Remotion / Rive / Lottie** | Alternativas | **Descartados.** No son code-first, no son auditables contra tokens, y Remotion exige render en Chromium (fuera del presupuesto de plataforma). |
| **Canva API / Figma API** | Alternativas | **Descartadas.** Rompen la regla de una sola fuente de color y la puerta de voz. |

### 6.1 Lo que se amplió

- **Video reproducible.** Antes el video se grababa en vivo: tiempo impreciso y
  no comparable entre equipos. Ahora se arma cuadro a cuadro.
- **MP4 en escritorio.** Antes, desde el navegador de trabajo, la salida era
  WebM — no publicable.
- **Alcance como parámetro de primera clase.** El movimiento dejó de estar
  reservado al motor audiovisual.
- **Composición real de tres capas.** La lámina y el sustrato dejaron de ser dos
  estudios separados con un puente de tres cadenas.
- **Flujo que se lee como fluido.** El campo de curl elimina las acumulaciones y
  los vacíos del flujo trigonométrico anterior.
- **La oficina lee los mismos tokens.** `circulacion/rrss/instagram/tokens.py`
  toma la paleta de `tokens.css`; las imágenes se regeneran byte a byte idénticas.

### 6.2 Lo que se modificó

- **El color.** Las tres tablas de hex (láminas, acentos, sustrato) dejaron de
  ser código y pasaron a `tokens.css`. El valor no cambió: no hay regresión
  visual.
- **El azar.** `Math.random()` saiu del motor de sustrato.
- **La colocación.** El sustrato ya no reparte la vida al azar: la reparte con
  distancia mínima.
- **La grabación.** El motor audiovisual dejó de grabar en vivo y ahora usa el
  camino cuadro a cuadro, con el respaldo intacto.
- **El compositor.** No dibuja el texto: compone capas. Así el alcance cambia el
  cuadro sin reescribir el motor de lámina.
- **La carga.** El sustrato ya no se anima a ciegas: espera a que alguien lo mire.

### 6.3 Lo que se mejoró

- **Una salida, dos motores.** El generador de láminas y el audiovisual
  comparten la tabla de formatos, la detección de equipo y los nombres de
  archivo.
- **Progreso real.** El operador ve el porcentaje de la pieza en armado.
- **Sin jerga.** Ninguna razón de disponibilidad menciona códecs, API ni
  plataforma.
- **Reproductibilidad.** La receta convierte una publicación efímera en un
  activo auditable.
- **Se puede medir.** El motor expone el costo del cuadro y el nivel de calidad
  activo; hay una prueba E2E que vigila el presupuesto.

---

## 7. Límites conocidos

| Límite | Mitigación actual |
|---|---|
| Sin WebCodecs (iOS 15.4–16.3) el video se graba en vivo | Se avisa al operador; la imagen y la receta siempre están |
| El campo de curl se recalcula cada 6 cuadros, no cada cuadro | La interpolación bilineal hace que el flujo se lea continuo |
| El glitch es por tiras, no por bloque | Suficiente para la transición; no compite con el dato |
| El alcance rupturista no se imprime | Por ley |
| El sustrato no usa worker | Medido: no valía la pena (1,2 % del presupuesto) |


---

## 8. Verificación

```bash
pnpm --filter @enjambre/nucleo test      # reglas de alcance, formatos, determinismo
pnpm --filter @enjambre/nucleo build     # incluye compat-audit (Safari/iOS 15.4+)
pnpm --filter @enjambre/nucleo exec playwright test e2e/estudio-rrss.spec.ts
```

Reglas con prueba automática:

- `export-targets.test.ts` — la tabla de formatos y el plan de salida.
- `slide-motion.test.ts` — los alcances, las curvas y la línea de tiempo.
- `prng.test.ts` — la reproducibilidad de la semilla.
- `substrate-field.test.ts` — la divergencia del campo de curl frente a un
  sumidero radial, la determinismo del ruido y la distancia mínima de la
  colocación.
- `e2e/estudio-rrss.spec.ts` — la cadena completa en navegador real: el PNG sale
  con las medidas pedidas (1080 × 1350 en 4:5), el MP4 sale con cabecera válida,
  y el modelo y la receta se pueden volver a abrir.
- `e2e/estudio-audiovisual.spec.ts` — el presupuesto del cuadro y el modo de
  campo de curl.
