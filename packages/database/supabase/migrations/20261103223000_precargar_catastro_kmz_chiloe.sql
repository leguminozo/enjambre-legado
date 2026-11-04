-- Migration: Precarga Catastro Territorial KMZ Chiloé 2026
-- Inserta 78 titulares históricos (user_id IS NULL) y 141 apiarios georreferenciados.
-- Idempotente: UUIDs deterministas v5 y ON CONFLICT DO NOTHING.

-- =============================================================================
-- 1. ACTORES TERRITORIALES (PRE-CARGADOS SIN RECLAMAR)
-- =============================================================================

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'c9dec6bf-e72b-5981-bd60-eb52821d1132',
  NULL,
  'api_residente',
  'VICTOR ARIEL OJEDA ALMONACID',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 4 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '9f270adc-5194-51b9-ad95-91f30d713942',
  NULL,
  'api_residente',
  'PEREZ VASQUEZ PATRICIO ALEJANDRO',
  'Quinchao',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'bac60596-1dce-58a4-8f94-e770b17fa084',
  NULL,
  'api_residente',
  'NIDIA BELÉN BARRIENTOS CARCAMO',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '5df22058-68a0-50a5-949d-e49ef8e2410e',
  NULL,
  'api_residente',
  'MARIA AGUILA NAPOLI',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '28a18cbe-f6d8-54d8-b943-5b3589813781',
  NULL,
  'api_residente',
  'MARCOS ESTEBAN FERNANDEZ DONOSO',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '9e2d3261-5a07-5002-9498-45a4187e682e',
  NULL,
  'api_residente',
  'LUIS YAÑEZ NAVARRO',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'da4bb595-05bc-59c9-8714-effc58c38e1f',
  NULL,
  'api_residente',
  'JUAN MANSILLA ULLOA',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '2f6bda36-3aed-5c6a-9e42-49b48fe84953',
  NULL,
  'api_residente',
  'JOSE VICTOR NAVARRO BAHAMONDE',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'fb341a04-ba67-5512-9ca6-5cbcbabf3bdc',
  NULL,
  'api_residente',
  'JAIME IVAN ROGEL BARRIENTOS',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 3 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '2784cf75-e00b-57dd-8030-02b4ff59178f',
  NULL,
  'api_residente',
  'GONZALO ALMONACID ZAMORA',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'e01aa93f-e577-51ff-8bd6-74b611abaf3f',
  NULL,
  'api_residente',
  'FRANCISCO NAGUIL NAGUIL',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 7 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  NULL,
  'api_residente',
  'FERNANDO ALEX MAÑAO BAHAMONDE',
  'Quinchao',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 9 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'a231bff2-eaee-58d6-b37c-548daaa37041',
  NULL,
  'api_residente',
  'CONSMITO POZA CORREA',
  'Quemchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'c20d90af-8912-53ba-aa21-9a703bd08475',
  NULL,
  'api_residente',
  'HORACIO BLANCO PAVÉZ',
  'Quellón',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '866ba5dd-8847-517e-a08f-4095ada2f129',
  NULL,
  'api_residente',
  'CARLOS OMAR AGUILA MONTIEL',
  'Quellón',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'e7610b7d-b9e1-506c-b255-653147343a70',
  NULL,
  'api_residente',
  'REINHARD FITZEK',
  'Queilén',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'e88aecc6-b0a3-51d6-b072-48c3b7de9243',
  NULL,
  'api_residente',
  'MICHAEL SCHNEIDER SERZOW',
  'Queilén',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 4 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'c0e53082-1785-5a79-a981-3a7d87dc49c2',
  NULL,
  'api_residente',
  'JOCELYN AGUILAR BARRIA',
  'Queilén',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '468d0831-15f3-5559-b27d-2a22cec9fb92',
  NULL,
  'api_residente',
  'JUANA DE LOURDES CARDENAS CARDENAS',
  'Puqueldón',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'c7fe35e2-6479-5ab8-ab1d-0af1e83d4f7b',
  NULL,
  'api_residente',
  'SOLEDAD REYES SIERRA',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '26286cb9-e566-5b48-82cd-5552fccea85b',
  NULL,
  'api_residente',
  'NICOLAS ESTEBAN LEVIÑANCO CADIN',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'c47e5c21-bc03-5476-a3b6-329f69d0a72d',
  NULL,
  'api_residente',
  'CESAR MUÑOZ GARCIA',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '62988a54-982f-5bd5-98a5-d716d8418b90',
  NULL,
  'api_residente',
  'BERNARDINO FABIAN MALDONADO GARRIDO',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 3 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'a047e55c-163d-51ae-904b-3566481a4c9c',
  NULL,
  'api_residente',
  'ANA DEL CARMEN GOMEZ ROCHA',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'a8bae23a-f206-5000-91a5-6ec06e83038f',
  NULL,
  'api_residente',
  'APICOLA BEEKEMAN',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'fd341e3e-16fe-5490-819a-d6d35018da98',
  NULL,
  'api_residente',
  'YASSIR ESSEN SAA CASTILLO',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'b960a245-16c8-5eaf-b2fe-ab13c45006db',
  NULL,
  'api_residente',
  'WALDO ANTONIO VALENZUELA CACERES',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'fc787395-7901-5d03-9c36-a0f125396e29',
  NULL,
  'api_residente',
  'ROLANDO SALVADOR GÓMEZ CHODIL',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'b880ee6e-1848-562c-8be4-a29dccb0376d',
  NULL,
  'api_residente',
  'NELLY ALEJANDRA CHODIL CHODIL TELLEZ',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '2e99fc53-32a1-59ab-92b7-7b3be0beeaa4',
  NULL,
  'api_residente',
  'MARIO CERNA CERNA',
  'Puqueldón',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '159bf1c8-9809-5011-9192-88bd9ecfbbf1',
  NULL,
  'api_residente',
  'MARCELA MORALES CARDENAS',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'f9e06898-32c2-53af-af06-8f52f5a1028c',
  NULL,
  'api_residente',
  'LUIS ARMANDO GORMAZ SEPULVEDA',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '517f2967-0ed0-5b3b-806c-1453fbf93484',
  NULL,
  'api_residente',
  'ARTURO ELADIO VELASQUEZ ALVARADO',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '72125432-54c2-50b1-8109-9ff00c07fdef',
  NULL,
  'api_residente',
  'ARSENIO GONZALEZ NUÑEZ',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '0b31d360-0c52-5faf-a884-900d3a16583e',
  NULL,
  'api_residente',
  'APICOLA ELIZABETH LUEGMAYER',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 4 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '72d9d2f3-3fdc-5be3-b400-b89cdb6c91a7',
  NULL,
  'api_residente',
  'ANTONIO SALVADOR MANCILLA VEGA',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 3 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '4459a647-92bd-5cab-96f3-d4d3ac22ad78',
  NULL,
  'api_residente',
  'TRIVÑO SIXTO JUVENAL TRIVIÑO TRIVIÑO',
  'Castro',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'e76215f8-ff1e-5c8b-9ede-d1b3cd32e162',
  NULL,
  'api_residente',
  'RONNY MUNOZ HARRISON',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'f425b3b4-e64d-5634-9ba3-3d23190dbcf2',
  NULL,
  'api_residente',
  'PABLO DE LA BARRA AHUMADA',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 7 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '4b4dba68-19d9-5bbf-bc6d-5bc2516c1b61',
  NULL,
  'api_residente',
  'JUAN BELTRAN OYARCE',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'cbffe0a2-920b-5298-a6cb-b673f722f700',
  NULL,
  'api_residente',
  'JUAN ALIRO ALIRO MACIAS',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '45358c7c-0c90-54e5-b5c2-53cd06be2940',
  NULL,
  'api_residente',
  'JORGE ARTURO CAMPODONICO PELUCHONNEAU',
  'Castro',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'd1441ef9-8a8c-52da-8d71-23f0a5ddc8a5',
  NULL,
  'api_residente',
  'DANIELA BELEN DE LA BARRA LUEGMAYER',
  'Chonchi',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'f1ef1a52-9b4c-55c0-bfda-99d881647ffd',
  NULL,
  'api_residente',
  'CESAR MENA M',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '9a38056f-6889-5e45-8f6f-17866c3e8c54',
  NULL,
  'api_residente',
  'CESAR ANTONIO MANRIQUEZ LEVICOY',
  'Castro',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '6833e77c-4339-5927-b211-f6c008958f8e',
  NULL,
  'api_residente',
  'CAROLINA GARCES AHUMADA',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'e97ccb59-55ab-5df1-8564-bab3504c4480',
  NULL,
  'api_residente',
  'ALEJANDRA INES LEIGHTON NARANJO',
  'Castro',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'a0c959c4-7731-5b62-97cc-4050d999916d',
  NULL,
  'api_residente',
  'VERONICA MAGDALENA VALDEBENITO FUICANom',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '662c508c-7629-564d-bd76-a1e85e1b06b2',
  NULL,
  'api_residente',
  'SARA DEL PILAR CARCAMO CARCAMO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '8fa40893-d8a3-51a1-886c-023b0a60d0b2',
  NULL,
  'api_residente',
  'SANDRA YEANETTE HUENUL CARDENAS',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '2236547d-9fc4-5610-8dee-8df07d5ac3e5',
  NULL,
  'api_residente',
  'SANDRA ELIZABETH ALMONACID SILVA',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '71cec68d-fb91-5c0b-9c58-673422b9ffb8',
  NULL,
  'api_residente',
  'ROSA ELENA GALINDO MILLALONCO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'c3c880e3-1fdd-5dea-b8be-5da43e92ed61',
  NULL,
  'api_residente',
  'RODRIGO BARDI ALVARADO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 3 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '3f66b615-a116-5897-b314-372aa9bc72a4',
  NULL,
  'api_residente',
  'RICHARD TENORIO PEREZ',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '6e24b255-7c76-558a-ac81-c559db72dca2',
  NULL,
  'api_residente',
  'RENATO ALBERTO CARDENAS GALINDO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '2e38b08d-ac65-577e-8511-f806ea197b88',
  NULL,
  'api_residente',
  'NICOLE VALESKA RIOS PEÑA',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'b17455fe-b52e-5927-8bfb-810893567813',
  NULL,
  'api_residente',
  'NEMESIO HERNAN GUERRA GUERRA',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'c3dff26d-8f82-52ba-844f-156556ff44bc',
  NULL,
  'api_residente',
  'NELLY MARINA BALLE GALLARDO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '520aa558-7335-51b0-bbad-31bd8f1bff38',
  NULL,
  'api_residente',
  'NATALIE LISSETTE ESCOBAR MUÑOZ',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'fba14f93-39d6-53b4-bd9a-fdeeecf416e7',
  NULL,
  'api_residente',
  'LUIS HERIBERTO GUINEO ALTAMIRANO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '98a670c7-1661-556d-b523-34c011d663d8',
  NULL,
  'api_residente',
  'LUIS ALBERTO VILLARROEL HERRERA',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '3237e15e-1612-50da-8d2e-7962dfb06a04',
  NULL,
  'api_residente',
  'LIPSKI MELO OSCAR ROBERTO JUNIOR LIPSKI MELO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '101e108c-3e8f-597a-9cba-1d9bb871cd6a',
  NULL,
  'api_residente',
  'KATIA ALEXIA VEGA VEGA',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'ddeedcbc-31d9-5207-8930-8f5b7895384d',
  NULL,
  'api_residente',
  'JULIO CÉSAR CAICHEO BAHAMONDE',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 5 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '57163f59-4c11-5693-bddd-6a2b2d76a875',
  NULL,
  'api_residente',
  'JOSE ELIVORIO ANTECAO LEMU',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '22041d03-ee31-5fdc-a5bd-46e775989e2f',
  NULL,
  'api_residente',
  'HÉCTOR OSVALDO YAÑEZ ALVARADO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'dd33018b-2d8f-57b8-a4e1-7aa46a0556dc',
  NULL,
  'api_residente',
  'GERMAN GILBERTO GODOY BAÑARES',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '128ffb63-3c0c-5eef-80d4-f24f7273076e',
  NULL,
  'api_residente',
  'FRANCISCO BERNARDO GUILLERMO MUCKE BUCHNER',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '11b4ef5c-0b2e-5c13-a528-ccbeeec0be0c',
  NULL,
  'api_residente',
  'EDUARDO JAVIER OVALLE VARGAS',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 3 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '94d2b77a-68d8-58cd-ab2c-abd59d363136',
  NULL,
  'api_residente',
  'EDUARDO ALVAREZ GOMEZ',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '9c5923be-35e2-521c-8b89-b004f2988fee',
  NULL,
  'api_residente',
  'CESAR TEODORO CARDENAS GONZALEZ',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'ba2e0ca1-16d8-5bcd-9c02-f0d1b96cfc7b',
  NULL,
  'api_residente',
  'CARLOS GUSTAVO SEGOVIA ROSS',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '129edb5d-3b0c-543f-9501-8ab0d69a5dd8',
  NULL,
  'api_residente',
  'CARDENAS GALINDO FRANCISCO RICARDO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '399d1845-0e35-5329-86c4-ced19381c401',
  NULL,
  'api_residente',
  'ALEJANDRO LUCIANO VILLARROEL VARGAS',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'c7ffef3e-d838-59b2-89ab-aa478b5336c7',
  NULL,
  'api_residente',
  'ALBERTO FERNANDO GARCIA PACHECO',
  'Ancud',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 2 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  'd55d1784-1a85-5b95-8e95-7d8130ae2d38',
  NULL,
  'api_residente',
  'RAMON EDUARDO SOTO VILLARROEL',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '4ae19c0a-3829-5389-86dd-d9bd6ea50bcf',
  NULL,
  'api_residente',
  'GLADYS SOLEDAD VILLARROEL BUSTAMANTE',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 7 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.actores_registro (
  id, user_id, rol, nombre_actor, comuna, region, estado, nivel_acreditacion, consentimientos, acepta_carta, acepta_politica_datos, declaracion_existencia_animal, completo, observaciones
) VALUES (
  '5a509621-b993-5742-9099-25ba212c5576',
  NULL,
  'api_residente',
  'FELIPE GABRIEL SOTO VILLARROEL',
  'Dalcahue',
  'Los Lagos',
  'activo',
  'base',
  '{"mapa_comunitario": false, "alertas_fitosanitarias": true, "catalogo_infraestructura": false, "acopio_cooperativo": false}'::jsonb,
  false,
  false,
  false,
  false,
  'Catastro territorial SAG Chiloé 2026 · 1 apiarios identificados'
) ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- 2. APIARIOS REGISTRADOS GEORREFERENCIADOS
-- =============================================================================

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '39fdf5a7-0551-5547-aa26-336fa4bc307f',
  'c9dec6bf-e72b-5981-bd60-eb52821d1132',
  'APIARIO NUMERO 5',
  'Ancud',
  'Ancud / Sector rural',
  -42.02916748579113,
  -73.48971020042069,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 12/12/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '9b4f4f9a-f7dd-5745-876b-c6a95ec918ab',
  'c9dec6bf-e72b-5981-bd60-eb52821d1132',
  'APIARIO 8',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.10594362073804,
  -73.44639312927906,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 6/2/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '39d460af-007e-5946-9f4d-8d58eac30843',
  '9f270adc-5194-51b9-ad95-91f30d713942',
  'SIN NOMBRE',
  'Quinchao',
  'Quinchao / Sector rural',
  -42.31797058779936,
  -73.40561971151658,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 27/5/2022 · Antigüedad: 4 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '79197957-51b7-5cb8-8aae-6f901e17787b',
  'bac60596-1dce-58a4-8f94-e770b17fa084',
  'COLMENARES MATTEO',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.2957543096241,
  -73.26253017623668,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 20/7/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '54b460d3-627f-5c67-95bf-52cb40c81c48',
  '5df22058-68a0-50a5-949d-e49ef8e2410e',
  'GALPON',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.16347289708862,
  -73.37858860990809,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 14/10/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '6a561d76-2e4e-50d5-9c9d-d666f3112994',
  '28a18cbe-f6d8-54d8-b943-5b3589813781',
  'APIARIO CAPACITACION',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.08870671398326,
  -73.44313820688585,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 9/12/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '0750dbb0-808b-56b8-b8ab-cd05fee8c23b',
  '9e2d3261-5a07-5002-9498-45a4187e682e',
  'LA COLMENA',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.09582496957348,
  -73.48578339967638,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 21/12/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '167af440-8b8e-543e-8aaa-4125f27bac6d',
  'da4bb595-05bc-59c9-8714-effc58c38e1f',
  'SOL Y MIEL',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.15121867212837,
  -73.5068419838691,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 22/5/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '396686e4-f8fa-569a-b9e6-8dc9bdfadcef',
  '2f6bda36-3aed-5c6a-9e42-49b48fe84953',
  'TUBILDAD',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.10549421606908,
  -73.50061067309517,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 3/10/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'cb09260c-f416-5609-88d0-1675aa44a602',
  'fb341a04-ba67-5512-9ca6-5cbcbabf3bdc',
  'LAS CHACRAS',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.13972212020968,
  -73.47974013759881,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 25/10/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '45a95ffc-6a8f-5afd-8129-6fa6e065d90a',
  'fb341a04-ba67-5512-9ca6-5cbcbabf3bdc',
  'CONCHEO',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.14032376891207,
  -73.51675457686694,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 25/10/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd1ab1c49-1729-5d6f-83ca-0fdb6f3a27cb',
  'fb341a04-ba67-5512-9ca6-5cbcbabf3bdc',
  'COCHELA',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.12429056796793,
  -73.49789306241941,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/6/2019 · Antigüedad: 7 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '1cfe8287-66f0-5c6e-9b0e-cfc208edf089',
  '2784cf75-e00b-57dd-8030-02b4ff59178f',
  'PCH',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.29469625238866,
  -73.47624812594808,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 24/5/2022 · Antigüedad: 4 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c9dad497-b1b7-5634-8250-1e394da75e39',
  'e01aa93f-e577-51ff-8bd6-74b611abaf3f',
  'QUEUDE',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.21097987157629,
  -73.41337770432483,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/8/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '957d9302-df74-5d15-84a1-9a03412eabff',
  'e01aa93f-e577-51ff-8bd6-74b611abaf3f',
  'PEDRO BARRIA',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.18280524312301,
  -73.48981220010819,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/8/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'b06efe66-37ba-55ac-b9b3-65f29a92070f',
  'e01aa93f-e577-51ff-8bd6-74b611abaf3f',
  'GUARDIAMO',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.17089424767259,
  -73.45695947672871,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/8/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '52a35d2b-906f-512d-8f8f-11a31366cbf6',
  'e01aa93f-e577-51ff-8bd6-74b611abaf3f',
  'DELFINA ULLOA',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.22482144008757,
  -73.52184214451988,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 24/1/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'b4f6f760-343c-59fe-a79c-a6b1710fd790',
  'e01aa93f-e577-51ff-8bd6-74b611abaf3f',
  'BETTY PEREZ',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.17890843146288,
  -73.44752600457277,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 2/11/2022 · Antigüedad: 4 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '3df46a08-afd4-56c0-9b01-9eff3bd5c3fe',
  'e01aa93f-e577-51ff-8bd6-74b611abaf3f',
  'AUCAR MONTAÑA GALLARDO',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.19991697283724,
  -73.50771851077963,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 10/1/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '68e8f1f3-761b-58bb-8c08-74cddbf8744d',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '09 PAOLA',
  'Quinchao',
  'Quinchao / Sector rural',
  -42.31227442693498,
  -73.37007809156322,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'db43dc49-18ff-548e-8dde-87728e5f9b80',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '08 Rigo',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.28397755270431,
  -73.47883514919917,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'ca6180f3-16d3-52fb-8e5c-d1c245cee078',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '07 TALY',
  'Quinchao',
  'Quinchao / Sector rural',
  -42.31695370739326,
  -73.37743226677512,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '553f7f1f-725a-5d17-9d19-b94e8f91765b',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '06 CASCADA',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.30470540616598,
  -73.42979458794319,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '167560c5-66ac-5171-8955-0c9738fd08ac',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '05 NANA',
  'Quinchao',
  'Quinchao / Sector rural',
  -42.31327253182498,
  -73.39808178722237,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '9fdb1231-6830-5e0f-83bb-135802da5553',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '04 Tono',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.29724426088571,
  -73.44600494107998,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '2ba038c6-b932-59c6-8758-340424db88be',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '03 JOSELO',
  'Quinchao',
  'Quinchao / Sector rural',
  -42.3239486214794,
  -73.37915784736222,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '9470e0eb-ba55-55fe-ba7e-04bde745f92a',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '02 Los Molinos',
  'Quinchao',
  'Quinchao / Sector rural',
  -42.31831841011134,
  -73.37459402950383,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '8930e649-003d-5f5f-9c9a-d36283c9a780',
  '58a478c2-2c65-52c6-9953-2e3799d83a35',
  '01 TALLO',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.29611972370927,
  -73.37464353109395,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'ceebb550-a857-5dff-bcbb-98d2ea42a0ff',
  'a231bff2-eaee-58d6-b37c-548daaa37041',
  'CERRITO',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.14873510445219,
  -73.49048933416755,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 17/1/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '6b4a9218-f429-56b5-897e-151e7538bae7',
  'c20d90af-8912-53ba-aa21-9a703bd08475',
  'APIYALDAD',
  'Quellón',
  'Quellón / Sector rural',
  -43.11014100634843,
  -73.70875094707554,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 26/11/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'f057d841-1599-5039-9929-40b0ec6b89c0',
  '866ba5dd-8847-517e-a08f-4095ada2f129',
  'APIARIO AMELIA 1',
  'Quellón',
  'Quellón / Sector rural',
  -43.12476480586375,
  -73.64643563781453,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 11/6/2023 · Antigüedad: 3 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '6c9a48cd-9a32-5c2f-b8b7-1f2e944e4cc2',
  '866ba5dd-8847-517e-a08f-4095ada2f129',
  'APIARIO AMELIA',
  'Quellón',
  'Quellón / Sector rural',
  -43.20760544651067,
  -73.5991319424738,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/10/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'befd4c05-f7fb-52f6-ab1f-9bf705683670',
  'e7610b7d-b9e1-506c-b255-653147343a70',
  'EL PILKEN',
  'Queilén',
  'Queilén / Sector rural',
  -42.84463713006659,
  -73.62959855286692,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/11/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c5304d87-60e5-5ec4-99ef-135468d4ea84',
  'e88aecc6-b0a3-51d6-b072-48c3b7de9243',
  'APIARIO MARTUCA',
  'Queilén',
  'Queilén / Sector rural',
  -42.94988655834234,
  -73.51956280252426,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 23/7/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c88448af-e790-5be7-9bc9-d9372615d876',
  'e88aecc6-b0a3-51d6-b072-48c3b7de9243',
  'APIARIO LEUTEPU',
  'Queilén',
  'Queilén / Sector rural',
  -42.94573376491723,
  -73.56972241642072,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 23/7/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd39483cf-5467-54f3-9288-4820d9a6df56',
  'e88aecc6-b0a3-51d6-b072-48c3b7de9243',
  'APIARIO ESPERANZA',
  'Queilén',
  'Queilén / Sector rural',
  -42.94553945878262,
  -73.55425785278567,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 12/12/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '70b961dc-72b1-5759-b6f7-7945a8d51403',
  'e88aecc6-b0a3-51d6-b072-48c3b7de9243',
  'APIARIO CORCOVADO',
  'Queilén',
  'Queilén / Sector rural',
  -42.95308989636213,
  -73.56676923839417,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 23/7/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '4e672857-a745-54db-98a3-4ad3a63d0495',
  'c0e53082-1785-5a79-a981-3a7d87dc49c2',
  'LOS ARRAYANES',
  'Queilén',
  'Queilén / Sector rural',
  -42.81506145231008,
  -73.60698704036173,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 17/6/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '4bea7817-2669-564a-b97a-a2879bbe56b1',
  '468d0831-15f3-5559-b27d-2a22cec9fb92',
  'DANIEL',
  'Puqueldón',
  'Puqueldón / Sector rural',
  -42.61526042672065,
  -73.69493215368588,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 25/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '4e5c2ca5-71ac-5372-986f-e5214f5f1fce',
  'c7fe35e2-6479-5ab8-ab1d-0af1e83d4f7b',
  'CHILOBEE',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.40988049297791,
  -73.67245066793895,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 22/5/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '551f4fad-9fa2-56e1-be47-191b5a186fd4',
  '26286cb9-e566-5b48-82cd-5552fccea85b',
  'PINDAPULLI NICOLAS',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.30769928476447,
  -73.72234371569348,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 21/7/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '9315b5cb-7506-5950-a582-6c093c67351f',
  'c47e5c21-bc03-5476-a3b6-329f69d0a72d',
  'ABEJITAS TEGUEL',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.3648380002837,
  -73.62847880562609,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 17/12/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '92489fc3-9771-531c-aa7a-936972284d35',
  '62988a54-982f-5bd5-98a5-d716d8418b90',
  'JANO PATO',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.31471884144717,
  -73.52393829676484,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 18/3/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '61c8f5df-853b-5fba-b656-12d5cfce5420',
  '62988a54-982f-5bd5-98a5-d716d8418b90',
  'HECTOR VIDAL',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.28929953949634,
  -73.57120614617757,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 18/3/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '076fc127-9b83-56ef-b071-117d25ad5c0e',
  '62988a54-982f-5bd5-98a5-d716d8418b90',
  'ELISEO LEGUE',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.33761176932941,
  -73.52954510295649,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 18/3/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '10ce0cea-24cc-506b-be47-47889c782515',
  'a047e55c-163d-51ae-904b-3566481a4c9c',
  'APIHONEY',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.37881055088133,
  -73.66084939181701,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 2/10/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'cf329960-b163-5ec4-9344-dc3076408ca8',
  'a8bae23a-f206-5000-91a5-6ec06e83038f',
  'ANAIN',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.28245972334022,
  -73.70825148894625,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 21/3/2023 · Antigüedad: 3 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '4eaa15a5-8f09-5ae2-b6af-21c88fbfbc3d',
  'fd341e3e-16fe-5490-819a-d6d35018da98',
  'PULPITO',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.7801131707389,
  -73.74901761160297,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 24/1/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'a922dff7-c1ad-5e80-91e1-e99ebbaa0b16',
  'b960a245-16c8-5eaf-b2fe-ab13c45006db',
  'POSTA NOTUE',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.6191306267826,
  -73.92342905989659,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 26/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '57927434-7e73-57c1-9a33-e9fedd8c3948',
  'fc787395-7901-5d03-9c36-a0f125396e29',
  'CHIYI CUCAO-QUILQUE',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.64650530154374,
  -74.08139547011974,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 17/12/2020 · Antigüedad: 6 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd1c276f5-6186-5725-aefe-09d64f2b6459',
  'b880ee6e-1848-562c-8be4-a29dccb0376d',
  'EL CHUCAO',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.67731997291811,
  -74.11194209431505,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/12/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'ea49ca89-6b60-590a-88aa-efbcb81401cd',
  '2e99fc53-32a1-59ab-92b7-7b3be0beeaa4',
  'HUICHA',
  'Puqueldón',
  'Puqueldón / Sector rural',
  -42.65536293547247,
  -73.7482882447523,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 17/2/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '1c698e6b-ef6a-51a7-a487-090f82384ac1',
  '159bf1c8-9809-5011-9192-88bd9ecfbbf1',
  'QUIAO',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.65080291636878,
  -73.94960016939422,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 22/7/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '4226baed-b9ae-52d3-b548-2aa9b0963a77',
  '159bf1c8-9809-5011-9192-88bd9ecfbbf1',
  'AMARANTU',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.80132254517298,
  -73.84342733101732,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/9/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '3ae44bbd-581e-5e20-af7b-c9f74f5e14ed',
  'f9e06898-32c2-53af-af06-8f52f5a1028c',
  '1',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.69202944655011,
  -73.8474718530561,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 20/1/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '5baa2230-d7ad-5cd5-b03c-a3d762666b96',
  '517f2967-0ed0-5b3b-806c-1453fbf93484',
  '01.-APIARIO LA ESPERANZA',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.5630554700143,
  -73.85948534328112,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 25/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c5485107-3e69-57f2-b134-78b5582a951f',
  '72125432-54c2-50b1-8109-9ff00c07fdef',
  'COLMENARES HUICHA',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.66858314390551,
  -73.75906675309287,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 10/2/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '314f8334-6675-5694-b32c-11c332ee6547',
  '0b31d360-0c52-5faf-a884-900d3a16583e',
  'PETANES BAJO',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.62093883193356,
  -73.91178940154336,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 28/5/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'e14db599-eab3-508c-9f24-66f57d5bde3d',
  '0b31d360-0c52-5faf-a884-900d3a16583e',
  'PALLACAR',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.60062368642865,
  -73.87373286263688,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 17/12/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '2ab00616-360e-5dcc-8d1b-096fd871a9a8',
  '0b31d360-0c52-5faf-a884-900d3a16583e',
  'GRANJA',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.60442214431882,
  -73.85177018246488,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '29d62377-d0af-5242-82ef-f4e06ef20750',
  '0b31d360-0c52-5faf-a884-900d3a16583e',
  'CAMPO',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.59373812824686,
  -73.87778155975882,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '13d49275-e17f-59ba-a2ad-316d76b7801b',
  '72d9d2f3-3fdc-5be3-b400-b89cdb6c91a7',
  'QUIAO',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.62182533247396,
  -73.90653055176996,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/2/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'bbdae22f-b813-5aa1-8448-377206ba6e9c',
  '72d9d2f3-3fdc-5be3-b400-b89cdb6c91a7',
  'PETANES',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.627368700179,
  -73.89298237748318,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c146e6bc-d5f2-5163-a32e-2f044a9cc78b',
  '4459a647-92bd-5cab-96f3-d4d3ac22ad78',
  'TRICAL',
  'Castro',
  'Castro / Sector rural',
  -42.52846147117966,
  -73.8332186871178,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 20/12/2023 · Antigüedad: 3 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'cf34f3ee-6b76-5bda-bae9-aad3b945ce8e',
  'e76215f8-ff1e-5c8b-9ede-d1b3cd32e162',
  'PIRUQUINA',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.38748905330718,
  -73.79273048239871,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/1/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '0b22f4c5-6b9d-5828-96e8-ca4f874725cf',
  'f425b3b4-e64d-5634-9ba3-3d23190dbcf2',
  'MONTAÑA',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.59607167918778,
  -73.93255339772107,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '9dd05def-c046-58c0-87a8-4146aeec5bc3',
  'f425b3b4-e64d-5634-9ba3-3d23190dbcf2',
  'IGLESIA',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.5957381586062,
  -73.9162137855166,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c2724ff1-612e-5774-a0e1-0cf7d60da5a0',
  'f425b3b4-e64d-5634-9ba3-3d23190dbcf2',
  'BAEZ',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.58910270704332,
  -73.90314178163261,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 13/12/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '812d5e19-81d6-5e6b-a63d-1f71a6f82f39',
  'f425b3b4-e64d-5634-9ba3-3d23190dbcf2',
  'BAEZ',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.58888345858005,
  -73.90281656230884,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 14/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'b633d1b0-e1c8-580a-9b28-23c1547443e8',
  '4b4dba68-19d9-5bbf-bc6d-5bc2516c1b61',
  'COIHUINCO1',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.42852229388316,
  -73.82416986822885,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 27/12/2022 · Antigüedad: 4 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '5ef3b704-6c92-5ee1-91fa-1e490393c85c',
  '4b4dba68-19d9-5bbf-bc6d-5bc2516c1b61',
  'COIHUINCO 2',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.42865914341368,
  -73.82258697564679,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 12/1/2023 · Antigüedad: 3 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd1f6b603-7374-5fe5-8fd1-83b84cd2fd47',
  'cbffe0a2-920b-5298-a6cb-b673f722f700',
  'APIMAQCHILOE',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.55395660681859,
  -73.82091634671815,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 21/2/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd3a7755f-954f-5500-bab7-b72f56e65bac',
  '45358c7c-0c90-54e5-b5c2-53cd06be2940',
  'LOS ARRAYANES',
  'Castro',
  'Castro / Sector rural',
  -42.49110289052449,
  -73.81016046365929,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 28/10/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd5eb65c4-2c97-54a5-a877-a9260d4a065b',
  '45358c7c-0c90-54e5-b5c2-53cd06be2940',
  'ARRAYANES DEL BOSQUE',
  'Castro',
  'Castro / Sector rural',
  -42.49112115105778,
  -73.8101844545214,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/10/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '697b2239-1463-583c-9f67-497920fdbfae',
  '2784cf75-e00b-57dd-8030-02b4ff59178f',
  'RLN',
  'Puqueldón',
  'Puqueldón / Sector rural',
  -42.52341181926977,
  -73.65821541431755,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/8/2021 · Antigüedad: 5 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '2d8a2a0b-bd84-547e-8303-31025e2fd190',
  'd1441ef9-8a8c-52da-8d71-23f0a5ddc8a5',
  'JUAN',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.57879228034399,
  -73.88922381066222,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '44fcfa86-c0b2-54a9-9365-f6b177a393e9',
  'd1441ef9-8a8c-52da-8d71-23f0a5ddc8a5',
  'EVA',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.57806760383356,
  -73.8878597199066,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '2019a638-0c81-5aeb-a240-b44151999c49',
  'f1ef1a52-9b4c-55c0-bfda-99d881647ffd',
  'QUILQUICO',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.44270071569235,
  -73.70500080164408,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 6/12/2022 · Antigüedad: 4 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'daf671a1-f02e-5831-8283-4c8c29360944',
  'f1ef1a52-9b4c-55c0-bfda-99d881647ffd',
  'BODEGA',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.41153913747119,
  -73.80259943290409,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 10/3/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd51b47e9-1a9b-5fb7-b2c8-4e21043885e7',
  '9a38056f-6889-5e45-8f6f-17866c3e8c54',
  'FELICIDAD',
  'Castro',
  'Castro / Sector rural',
  -42.47224760818229,
  -73.78297651212675,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/4/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c3175f7d-c868-54ef-b413-70dd9fe261be',
  '6833e77c-4339-5927-b211-f6c008958f8e',
  'ENSUEÑOS DE MIEL - CHILOÉ',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.40237829258477,
  -73.78530005109063,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 14/6/2022 · Antigüedad: 4 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'b7d12992-e6a3-5c4b-bee3-4075110f5b95',
  '72d9d2f3-3fdc-5be3-b400-b89cdb6c91a7',
  'VILUPULLI',
  'Chonchi',
  'Chonchi / Sector rural',
  -42.58217778278743,
  -73.85081364108144,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/3/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'b4e1cba9-8e9b-5e23-8a08-068628b33387',
  'e97ccb59-55ab-5df1-8564-bab3504c4480',
  'COIGÜES DE LLICALDAD',
  'Castro',
  'Castro / Sector rural',
  -42.50528668644223,
  -73.807542439297,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/10/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'a45cd5c2-b625-5423-81ab-d2f03db486b4',
  'c9dec6bf-e72b-5981-bd60-eb52821d1132',
  'APIARIO NUMERO 4',
  'Ancud',
  'Ancud / Sector rural',
  -42.01266074935754,
  -73.492588645518,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 2/6/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c4be3973-6a0f-509d-a1dd-04f6c23a72f5',
  'c9dec6bf-e72b-5981-bd60-eb52821d1132',
  'APIARIO NUMERO 2',
  'Ancud',
  'Ancud / Sector rural',
  -42.00154063844208,
  -73.52608044519606,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 2/6/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'c7a51511-211c-589e-acc2-ff82f8dc3c69',
  'a0c959c4-7731-5b62-97cc-4050d999916d',
  'VERITUS',
  'Ancud',
  'Ancud / Sector rural',
  -41.9271381384411,
  -73.81103830518562,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 16/11/2022 · Antigüedad: 4 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'b7c3bca9-159d-51e6-b946-e96a539b94c2',
  '662c508c-7629-564d-bd76-a1e85e1b06b2',
  'SIN NOMBRE',
  'Ancud',
  'Ancud / Sector rural',
  -41.84816334861507,
  -74.00367014860902,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 26/9/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'eb6a3e46-eda3-5d03-af00-17628281215d',
  '8fa40893-d8a3-51a1-886c-023b0a60d0b2',
  'CHANITA',
  'Ancud',
  'Ancud / Sector rural',
  -41.87614466620019,
  -73.63847298350501,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/10/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'cb4e2942-bd89-5347-9e1f-933d36777883',
  '2236547d-9fc4-5610-8dee-8df07d5ac3e5',
  'COIPOMO',
  'Ancud',
  'Ancud / Sector rural',
  -42.03829319720759,
  -73.8769037510958,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 21/8/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'a4dd02dd-400a-5b2b-b3a0-3896cea72a39',
  '71cec68d-fb91-5c0b-9c58-673422b9ffb8',
  'PERLA DE OBRERA',
  'Ancud',
  'Ancud / Sector rural',
  -42.00578836408197,
  -73.83173345642071,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 19/5/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '885b78fa-e1b7-5053-b4bf-60f27bb110d7',
  'c3c880e3-1fdd-5dea-b8be-5da43e92ed61',
  'KÜME MIEL PLAYA',
  'Ancud',
  'Ancud / Sector rural',
  -41.8076654329403,
  -74.02425750153427,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 18/11/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '798b8cb4-9209-5a73-bdd2-84b1e587cc04',
  'c3c880e3-1fdd-5dea-b8be-5da43e92ed61',
  'KÜME MIEL MONTE',
  'Ancud',
  'Ancud / Sector rural',
  -41.79502276658214,
  -74.01090882495878,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 18/11/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '5f2f5a5e-dd45-5b77-ad72-6dbb85b108e9',
  'c3c880e3-1fdd-5dea-b8be-5da43e92ed61',
  'APIARIO CALLE',
  'Ancud',
  'Ancud / Sector rural',
  -41.84509287906999,
  -74.01630518571196,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 24/12/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'fe309e94-f56b-570f-b67a-c8636592f4db',
  '3f66b615-a116-5897-b314-372aa9bc72a4',
  'LA PALOMA',
  'Ancud',
  'Ancud / Sector rural',
  -42.07368541864187,
  -73.79665349398752,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 9/4/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '8a2e223a-0120-56ad-9db1-73c0e79dd0e4',
  '6e24b255-7c76-558a-ac81-c559db72dca2',
  'RENATO Y CG',
  'Ancud',
  'Ancud / Sector rural',
  -42.13447003150242,
  -73.80710722416491,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 11/11/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'be4ef744-125f-5269-9f11-b30bfcc22dd5',
  'f425b3b4-e64d-5634-9ba3-3d23190dbcf2',
  'CHEPU CARRETERA',
  'Ancud',
  'Ancud / Sector rural',
  -41.97167741358767,
  -73.85373145493035,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 1/2/2020 · Antigüedad: 6 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '9122c650-b74a-543c-aee1-fce4fefea3f9',
  'f425b3b4-e64d-5634-9ba3-3d23190dbcf2',
  'CHEPU 2',
  'Ancud',
  'Ancud / Sector rural',
  -42.01430810532429,
  -73.90382322831863,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 1/2/2020 · Antigüedad: 6 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '3e0d8334-a684-5049-acf8-6f8b9e42b99b',
  'f425b3b4-e64d-5634-9ba3-3d23190dbcf2',
  'CHEPU 1',
  'Ancud',
  'Ancud / Sector rural',
  -41.94050943857577,
  -73.82469880107693,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 1/2/2020 · Antigüedad: 6 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '7fa482b2-7bed-58ce-a707-7bdfef59c491',
  '2e38b08d-ac65-577e-8511-f806ea197b88',
  'COIPOMO',
  'Ancud',
  'Ancud / Sector rural',
  -42.02527092133294,
  -73.84613763263472,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 24/11/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '40a975ad-33a7-534b-876e-28fef960c763',
  'b17455fe-b52e-5927-8bfb-810893567813',
  'LOS MAÑIOS',
  'Ancud',
  'Ancud / Sector rural',
  -41.97102229632013,
  -73.60127325949763,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 16/8/2021 · Antigüedad: 5 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '0ab0a28c-a447-59b8-b5dc-18ae6abcfa93',
  'c3dff26d-8f82-52ba-844f-156556ff44bc',
  'HUICHA',
  'Ancud',
  'Ancud / Sector rural',
  -41.85527404023092,
  -73.74417143477928,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 21/1/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '91ac0033-c09f-5a23-88ba-4603ba73c7f4',
  '520aa558-7335-51b0-bbad-31bd8f1bff38',
  'MAHUIDA',
  'Ancud',
  'Ancud / Sector rural',
  -42.01061828081819,
  -73.88819922187437,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 27/11/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '0436043a-fe62-5c8b-b6e3-b859df8a16af',
  '520aa558-7335-51b0-bbad-31bd8f1bff38',
  'LA CASA',
  'Ancud',
  'Ancud / Sector rural',
  -42.01060845710882,
  -73.88811485753476,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 6/1/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '5bf27658-6033-591f-8c10-1b48dc3cef79',
  'fba14f93-39d6-53b4-bd9a-fdeeecf416e7',
  'TEHUACO',
  'Ancud',
  'Ancud / Sector rural',
  -41.91495231838991,
  -73.9856415848812,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 15/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '63bdee2b-4ac0-58a0-9291-abf9894c22c6',
  'fba14f93-39d6-53b4-bd9a-fdeeecf416e7',
  'PUMILLAHUE',
  'Ancud',
  'Ancud / Sector rural',
  -41.94808658796663,
  -74.01446991264575,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 15/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '6e04fa09-e8fd-5f7e-bbda-2582eaa28e33',
  '98a670c7-1661-556d-b523-34c011d663d8',
  'PUGUEÑUN',
  'Ancud',
  'Ancud / Sector rural',
  -41.82135985454715,
  -73.66631661404782,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 11/6/2021 · Antigüedad: 5 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '143f6d32-f18f-5272-8961-443077cb03af',
  '3237e15e-1612-50da-8d2e-7962dfb06a04',
  'APIARIO SAN JUAN',
  'Ancud',
  'Ancud / Sector rural',
  -41.8971942282428,
  -73.68101394625748,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 28/1/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '3f0a1eba-26f5-5b25-917d-933e30d07dac',
  '101e108c-3e8f-597a-9cba-1d9bb871cd6a',
  'SIN NOMBRE',
  'Ancud',
  'Ancud / Sector rural',
  -41.94510739909586,
  -73.7377530725678,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 24/4/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'be220fa6-8620-59d4-834d-fc3d82c9a7c7',
  'ddeedcbc-31d9-5207-8930-8f5b7895384d',
  'MONTAÑA LOS PATO',
  'Ancud',
  'Ancud / Sector rural',
  -41.88802508851295,
  -73.57543546794385,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 5/10/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'a59c3cca-5cd3-50ef-b13c-605c5cdeb0c7',
  'ddeedcbc-31d9-5207-8930-8f5b7895384d',
  'LA SEDE',
  'Ancud',
  'Ancud / Sector rural',
  -41.90891667863939,
  -73.51474568229511,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 26/11/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'bdae0abe-9e9e-5777-8042-876cc1404b86',
  'ddeedcbc-31d9-5207-8930-8f5b7895384d',
  'LA CAPILLA',
  'Ancud',
  'Ancud / Sector rural',
  -41.90557167225396,
  -73.51586008621251,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 26/11/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd3530a0a-de8a-504e-8df2-e4114d29deb1',
  'ddeedcbc-31d9-5207-8930-8f5b7895384d',
  'HUEIHUE 2',
  'Ancud',
  'Ancud / Sector rural',
  -41.9001403540852,
  -73.54965678384079,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 26/11/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '97ded039-a66a-50b0-9338-04c86c4b5c28',
  'ddeedcbc-31d9-5207-8930-8f5b7895384d',
  'HUEIHUE 1',
  'Ancud',
  'Ancud / Sector rural',
  -41.90099755460339,
  -73.54978205015703,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 26/11/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '04e4667b-6dd8-5041-95c6-4b458023b654',
  '57163f59-4c11-5693-bddd-6a2b2d76a875',
  'BUTAMANGA',
  'Ancud',
  'Ancud / Sector rural',
  -41.84240218701262,
  -73.57506294021897,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 10/1/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '3495f9bd-04b6-5220-81cc-8e3f99e1998a',
  '22041d03-ee31-5fdc-a5bd-46e775989e2f',
  'SIN NOMBRE',
  'Ancud',
  'Ancud / Sector rural',
  -41.87636833086503,
  -73.66287162276349,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 24/9/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'edc73323-825b-51e7-8c6c-d3eba510d4bc',
  'dd33018b-2d8f-57b8-a4e1-7aa46a0556dc',
  'PUPELDE',
  'Ancud',
  'Ancud / Sector rural',
  -41.90605205965269,
  -73.77574179826043,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 7/11/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd6af1469-bb47-50b0-8154-e3f3809a1b93',
  'dd33018b-2d8f-57b8-a4e1-7aa46a0556dc',
  'CHEPU',
  'Ancud',
  'Ancud / Sector rural',
  -42.0599875892335,
  -74.00449874689774,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 7/11/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '4802aa0c-b096-5b04-8d8d-7e9518171d96',
  'e01aa93f-e577-51ff-8bd6-74b611abaf3f',
  'TANTAUCO',
  'Quemchi',
  'Quemchi / Sector rural',
  -42.10039709984784,
  -73.71837546203369,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/8/2017 · Antigüedad: 9 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'dee848af-707e-5ddd-8f8c-2b7c3a12966e',
  '128ffb63-3c0c-5eef-80d4-f24f7273076e',
  'SIN NOMBRE',
  'Ancud',
  'Ancud / Sector rural',
  -41.88982158445321,
  -73.78416390226384,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 24/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '1f4f2e77-b2ae-5c43-bc95-b0fa4cd1d4a1',
  '11b4ef5c-0b2e-5c13-a528-ccbeeec0be0c',
  'JAVIER',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.17658678320232,
  -73.77835857341192,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 3/11/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '20069159-7ef8-5711-a1df-9734b0a0fbf9',
  '11b4ef5c-0b2e-5c13-a528-ccbeeec0be0c',
  'EDUARDO',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.17901268823227,
  -73.77866301889833,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 3/11/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '957eebc5-9e4a-56a0-815b-8f54c39a4383',
  '11b4ef5c-0b2e-5c13-a528-ccbeeec0be0c',
  'ABEJITAS FELICES',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.17961391611432,
  -73.77845771052529,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/5/2020 · Antigüedad: 6 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'a44e4313-d37c-507b-8616-2610a48f5d5b',
  '94d2b77a-68d8-58cd-ab2c-abd59d363136',
  'PALOMAR',
  'Ancud',
  'Ancud / Sector rural',
  -42.06699655444955,
  -73.78495862487607,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 6/10/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'a883cd92-c3a0-5e08-a90d-1a5866ae3245',
  '94d2b77a-68d8-58cd-ab2c-abd59d363136',
  'EL PORVENIR',
  'Ancud',
  'Ancud / Sector rural',
  -41.97061531573589,
  -73.81216105356836,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 6/10/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '541cfaf0-d7bc-58fb-b308-b3352c6052d2',
  '9c5923be-35e2-521c-8b89-b004f2988fee',
  'SANTI',
  'Ancud',
  'Ancud / Sector rural',
  -41.8921990363625,
  -73.60955196147891,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 30/10/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '6b9a71d8-7b5e-54f7-8ebb-53bc164b166a',
  'ba2e0ca1-16d8-5bcd-9c02-f0d1b96cfc7b',
  'GABY',
  'Ancud',
  'Ancud / Sector rural',
  -41.86673353594003,
  -73.74692333627131,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 22/10/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'e697b79e-524e-569e-ad16-568e618e7d6e',
  '129edb5d-3b0c-543f-9501-8ab0d69a5dd8',
  'LOS TEPUALES',
  'Ancud',
  'Ancud / Sector rural',
  -42.14989382958601,
  -73.81280857262244,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 18/10/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'b8eda2a3-68ed-5776-a3ad-5ff8c0f01d30',
  '129edb5d-3b0c-543f-9501-8ab0d69a5dd8',
  'LOS EUCALIPTUS',
  'Ancud',
  'Ancud / Sector rural',
  -42.14914566793505,
  -73.8110071397171,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 18/10/2024 · Antigüedad: 2 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'dfd867ed-5268-5c8d-a33e-d7a20f39a455',
  'a8bae23a-f206-5000-91a5-6ec06e83038f',
  'LOS PERROS',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.18511838082528,
  -73.71513963866705,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/1/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '41d3b76c-7052-5c50-a625-c9a8ae273aae',
  '399d1845-0e35-5329-86c4-ced19381c401',
  'COLEMNAS CHAUMAN',
  'Ancud',
  'Ancud / Sector rural',
  -41.80571789017172,
  -73.95837919505799,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 10/10/2025 · Antigüedad: 1 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '88b24a6d-7241-56b6-90a5-3ab4ae96e3af',
  'c7ffef3e-d838-59b2-89ab-aa478b5336c7',
  'PUMANZANO',
  'Ancud',
  'Ancud / Sector rural',
  -41.9775629869515,
  -73.66962803763047,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 4/2/2020 · Antigüedad: 6 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '9d6595da-a4fc-5d94-8e45-175fbb231152',
  'c7ffef3e-d838-59b2-89ab-aa478b5336c7',
  'COIPOMO',
  'Ancud',
  'Ancud / Sector rural',
  -42.03944945793826,
  -73.87817615701456,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 26/10/2016 · Antigüedad: 10 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'e0adc8b5-011c-5b06-8b72-a629bf040b51',
  'd55d1784-1a85-5b95-8e95-7d8130ae2d38',
  'CASERIO',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.43639970023628,
  -73.57256150789166,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 3/6/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '16484a0c-de26-5f45-bb88-15837d00cab1',
  '4ae19c0a-3829-5389-86dd-d9bd6ea50bcf',
  'TOLKIEN',
  'Quinchao',
  'Quinchao / Sector rural',
  -42.45077452722147,
  -73.54903269456157,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'f739596c-1b87-5f53-8ad4-9f2f5bc79a10',
  '4ae19c0a-3829-5389-86dd-d9bd6ea50bcf',
  'RAMON SOTOMAYOR',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.44459193162746,
  -73.56655116085501,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'fe73b729-720a-5cbe-af98-12180ae18f71',
  '4ae19c0a-3829-5389-86dd-d9bd6ea50bcf',
  'PALQUI',
  'Quinchao',
  'Quinchao / Sector rural',
  -42.45633513657275,
  -73.52466614385062,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/11/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '4e2a5b63-d2fb-5952-b9cc-864ec3472bdb',
  '4ae19c0a-3829-5389-86dd-d9bd6ea50bcf',
  'MONCHO',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.43621472030963,
  -73.5728939666493,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '3e8c8db3-9964-5f04-8f37-2deec484cc74',
  '4ae19c0a-3829-5389-86dd-d9bd6ea50bcf',
  'ABUELA 2',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.43547029616782,
  -73.57603537066599,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd61fde4b-2892-59e4-8687-b21c72057728',
  '4ae19c0a-3829-5389-86dd-d9bd6ea50bcf',
  'GABRIEL SOTOMAYOR',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.43254507713845,
  -73.59293914030654,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 29/11/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  '9e157c6c-3cff-5c15-afb1-73bae58a70fc',
  '4ae19c0a-3829-5389-86dd-d9bd6ea50bcf',
  'ARMANDO',
  'Curaco de Vélez',
  'Curaco de Vélez / Sector rural',
  -42.45889951621514,
  -73.56275858825909,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 8/1/2018 · Antigüedad: 8 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.apiarios_registro (
  id, actor_id, nombre, comuna, zona, lat_aproximada, lng_aproximada, n_colmenas, categoria, activo, observaciones
) VALUES (
  'd7b8b93a-49f0-58ce-bafd-8cbad3554202',
  '5a509621-b993-5742-9099-25ba212c5576',
  'FELIPE2',
  'Dalcahue',
  'Dalcahue / Sector rural',
  -42.42614568547143,
  -73.56203630760035,
  10,
  'produccion',
  true,
  'Catastro SAG KMZ 2026 · Inicio: 4/6/2026 · Antigüedad: 0 años · Colmenas estimadas por confirmar en censo'
) ON CONFLICT (id) DO NOTHING;
