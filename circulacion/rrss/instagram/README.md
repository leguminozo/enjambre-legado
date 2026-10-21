# Generadores de oficina — piezas ya publicadas

Estos scripts arman carruseles **fuera del navegador**, con Pillow, para piezas
que ya se publicaron o que se arman en la oficina sin depender del estudio.

## Regla

La verdad del color vive en `packages/ui/src/tokens.css`. `tokens.py` la lee y
la entrega en RGB para Pillow. **No se escribe un hex en los scripts**: si
cambia la paleta de marca, cambia en los tokens y los dos caminos (oficina y
navegador) se mueven juntos.

```bash
cd circulacion/rrss/instagram
python3 generar_carrusel.py        # carrusel 01 · manifiesto
python3 generar_carrusel_oyz.py    # manifiesto científico
```

Salida en `assets/`. Las imágenes se regeneran byte a byte idénticas mientras
los tokens no cambien.

## Relación con el Estudio Editorial

| | Oficina (Pillow) | Estudio (`/estudio-rrss`) |
|---|---|---|
| Cuándo | pieza histórica, trabajo sin navegador | pieza nueva, con video o alcance de movimiento |
| Color | `tokens.py` → `tokens.css` | `@enjambre/ui/design-tokens` → `tokens.css` |
| Movimiento | no | tres alcances: estático, elegante, rupturista |
| Salida | PNG | PNG, JPG, WebP, MP4, WebM, modelo, receta |

**Para piezas nuevas: el estudio.** Esta carpeta queda para lo que ya salió y
para lo que se necesita en la oficina sin navegador. No se abren aquí
capacidades nuevas: el movimiento vive en el estudio.
