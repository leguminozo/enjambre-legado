-- 2026: Entrelazado bidireccional apiario operativo (vivo) <-> registro territorial (ley).
-- Un apiario declarado en el Registro puede nacer del apiario operativo del
-- apicultor, y el operativo conoce su declaración. Las coordenadas del registro
-- se degradan a ~1 km en la capa de aplicación (no aquí) para no exponer la
-- ubicación exacta de las colmenas (ver docs/CONSTITUTION.md § privacidad).

ALTER TABLE public.apiarios_registro
  ADD COLUMN IF NOT EXISTS apiario_origen_id UUID
    REFERENCES public.apiarios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sincronizado_en TIMESTAMPTZ;

ALTER TABLE public.apiarios
  ADD COLUMN IF NOT EXISTS apiario_registro_id UUID
    REFERENCES public.apiarios_registro(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS apiarios_registro_origen_idx
  ON public.apiarios_registro (apiario_origen_id);
CREATE INDEX IF NOT EXISTS apiarios_registro_id_idx
  ON public.apiarios (apiario_registro_id);

-- La RLS de apiarios_registro ya protege por actor_id (dueño) y visibilidad
-- comunitaria (consentimiento mapa_comunitario). El origen operativo no abre
-- nueva vía de lectura: el dueño sigue siendo el actor.
