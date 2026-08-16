# Constricción anti-slop (superficie pública)

El promedio visual de 2025–26 (hero centrado + orbe + Inter/Geist + 3 cards + Lucide Sparkles) no es la marca. Esta página es la checklist de PR para Tienda y Núcleo **públicos**.

## Prohibido en landing / marketing

- `Sparkles` de lucide-react
- Orbe `blur-[80px]` o mayor como atmósfera
- Dot-grid de fondo que no sea mapa o dato
- `group-hover:translate-x` en todas las flechas de un mismo viewport
- Texto relleno de gradiente
- Púrpura-violeta de acento
- Inter / Geist / Space Grotesk / Outfit / Sora / Plus Jakarta como familia de marca

## Permitido

- Lucide en **app** (carrito, forms, dashboard)
- Cormorant Garamond display + Source Sans 3 body (default CMS)
- Un acento (oro miel), máximo ~3 usos por pantalla
- Radius: no mezclar `rounded-3xl` + `rounded-full` + `rounded-2xl` en la misma vista de landing
- Hex solo en `packages/ui/src/tokens.css`

## CMS

`show_grain`, `show_custom_cursor`, `show_bee_canvas` default **false**. El editor los etiqueta como ornamento.

## Legal

Footer territorial debe linkear `/privacidad` y `/terminos` del censo (no el TOS de tienda).

Ver plan de oleada: hero = mapa, planes ≠ trío Stripe, loading isomorfo.
