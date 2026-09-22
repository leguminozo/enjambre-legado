-- Centralizar copy stock_critico: destino por entidad (Lotes vs Inventario).
UPDATE public.email_templates
SET body_template = '{{ cuerpo }}
Revisa el detalle en Núcleo (Lotes para granel, Inventario para productos).'
WHERE key = 'stock_critico' AND locale = 'es';
