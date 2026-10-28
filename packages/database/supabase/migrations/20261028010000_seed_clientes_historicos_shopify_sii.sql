-- Migración: Carga de Clientes Históricos de Shopify y SII (Sin modificar productos)
-- Fecha: 2026-10-28
-- 1. Clientes D2C de Shopify (Órdenes pagadas)
-- 2. Clientes B2B Institucionales (Facturas SII)
-- 3. Prospectos de Carritos Abandonados (Shopify) en Clientes y CRM Leads

-- 1. Asegurar esquema y valores por defecto en tabla clientes
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS telefono TEXT,
  ADD COLUMN IF NOT EXISTS empresa TEXT,
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS vendedor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fuente TEXT,
  ADD COLUMN IF NOT EXISTS ultimo_contacto TIMESTAMPTZ;

-- Asegurar generación automática de ID si no viene definido
ALTER TABLE public.clientes ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;

-- Asegurar políticas RLS para administradores en clientes
DROP POLICY IF EXISTS "Admins and reps view all clientes" ON public.clientes;
CREATE POLICY "Admins and reps view all clientes" ON public.clientes
  FOR SELECT TO authenticated
  USING (
    public.is_admin() 
    OR auth.uid() = user_id 
    OR auth.uid() = vendedor_id
  );

DROP POLICY IF EXISTS "Admins manage all clientes" ON public.clientes;
CREATE POLICY "Admins manage all clientes" ON public.clientes
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Clientes D2C Pagados de Shopify
INSERT INTO public.clientes (
  name, email, telefono, direccion, type, status, fuente, total_spent, last_purchase, ultimo_contacto, notes
) VALUES
(
  'Javier Pina',
  'javier.pina@me.com',
  '+56992354130',
  'Luis Thayer Ojeda 947, 502, Providencia, Santiago',
  'D2C',
  'activo',
  'web',
  35149,
  '2025-05-11',
  '2025-05-11 08:16:52-04',
  'Venta online Shopify #1001 pagada vía Mercado Pago y despachada por Blue Express. 1x Fiordo Dulce ~ Hierbabuena con Stevia ($3.000), 4x Crema de Miel - Frasco Medio ($5.990).'
),
(
  'Tamara Gallardo Chacón',
  't.gallardo.ch@gmail.com',
  '+56933960116',
  'Francisca fuentes araos 1713, Puerto Natales, Magallanes',
  'D2C',
  'activo',
  'web',
  34953,
  '2025-05-23',
  '2025-05-23 20:08:52-04',
  'Venta online Shopify #1002 pagada vía Mercado Pago y despachada por Blue Express. 1x Sachets de Miel con Avellanas ~ Cofre de Energía ($14.990), 2x Miel con Avellanas ~ Frasco Medio ($5.990).'
),
(
  'Loreto Martínez',
  'loretosoledad@gmail.com',
  '+56991392329',
  'José Luis Araneda 330, 403, Ñuñoa, Santiago',
  'D2C',
  'activo',
  'web',
  45331,
  '2025-05-30',
  '2025-05-30 20:19:35-04',
  'Venta online Shopify #1003 pagada vía Mercado Pago y despachada por Blue Express. 1x Crema de Miel ~ Tesoro del Colmenar ~ Frasco Medio ($5.990), 1x Miel Tradicional ~ Reserva del Bosque ~ Frasco Mayor ($10.990), 2x Sachets Crema de Miel ~ Cofre Superior ($14.990).'
),
(
  'Cristian Lizama Pérez',
  'cristianliza60@gmail.com',
  '+56939659240',
  'Villa antumapu psj Jahuel 1114, Quillota, Valparaíso',
  'D2C',
  'activo',
  'web',
  27164,
  '2025-06-06',
  '2025-06-06 10:12:56-04',
  'Venta online Shopify #1004 pagada vía Mercado Pago y despachada por Blue Express. 1x Miel con Avellanas ~ Tesoro del colmenar ~ Frasco Medio ($5.990), 1x Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor ($19.990).'
),
(
  'Alexis Humeres',
  'alex.humeres@gmail.com',
  '+56994996666',
  'Dardignac 180, Dpto 322, Santiago Centro, Santiago',
  'D2C',
  'activo',
  'web',
  18057,
  '2025-06-15',
  '2025-06-15 10:57:21-04',
  'Venta online Shopify #1005 pagada vía Mercado Pago y despachada por Blue Express. 1x Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor ($14.990).'
),
(
  'José Antonio Pérez',
  'josantoperez@hotmail.com',
  '+56992651105',
  'Los Trigales 7713, Torre B, Depto. 901, Las Condes, Santiago',
  'D2C',
  'activo',
  'web',
  18057,
  '2025-06-17',
  '2025-06-17 16:52:34-04',
  'Venta online Shopify #1006 pagada vía Mercado Pago y despachada por Blue Express. 1x Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor ($14.990).'
),
(
  'Dayenu Vecilla',
  'dayenuv@gmail.com',
  '+56956460222',
  'Pontevedra 1227, Las Condes, Santiago',
  'D2C',
  'activo',
  'web',
  52310,
  '2025-06-20',
  '2025-06-20 10:27:44-04',
  'Venta online Shopify #1007 pagada vía Mercado Pago y despachada por Blue Express. 24x Sachets Miel con Polen ~ Gotas de Inmunidad ($990), 24x Sachets Miel con Avellanas ~ Gotas de Energía ($990).'
),
(
  'Gonzalo Pavez Paredes',
  'gonzalo.pavez@gmail.com',
  '+56942253419',
  'Antonia López de Bello 0130, Santiago Centro, Santiago',
  'D2C',
  'activo',
  'web',
  18057,
  '2025-07-02',
  '2025-07-02 10:07:02-04',
  'Venta online Shopify #1008 pagada vía Mercado Pago y despachada por Blue Express. 1x Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor ($14.990).'
),
(
  'María José Prieto',
  'mjprietou@gmail.com',
  NULL,
  'Camino La Fuente 1669, Las Condes, Santiago',
  'D2C',
  'activo',
  'web',
  33047,
  '2025-08-05',
  '2025-08-05 21:55:10-04',
  'Venta online Shopify #1009 pagada vía Mercado Pago y despachada por Blue Express. 1x Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor ($14.990), 1x Sachets de Miel con Polen ~ Cofre de Inmunidad ($14.990).'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Clientes B2B Institucionales (Facturas SII / RCV)
INSERT INTO public.clientes (
  name, empresa, type, status, fuente, total_spent, last_purchase, ultimo_contacto, notes
) VALUES
(
  'Street Machine Producciones S.A.',
  'Street Machine Producciones S.A.',
  'B2B',
  'activo',
  'otro',
  2228765,
  '2025-04-10',
  '2025-04-10',
  'Cliente corporativo institucional. Factura SII electrónica Folio 8 ($2.228.765 CLP). RUT: 77.929.090-5.'
),
(
  'Comercializadora y Procesadora Silvoagropecuarios',
  'Comercializadora y Procesadora de Productos Silvoagropecuarios y Afines',
  'B2B',
  'activo',
  'otro',
  277817,
  '2025-04-04',
  '2025-04-04',
  'Distribuidor mayorista de productos. Factura SII electrónica Folio 7 ($277.817 CLP). RUT: 76.513.716-0.'
),
(
  'Lorena Monserrat Mardones Ramírez',
  'Lorena Monserrat Mardones Ramírez',
  'B2B',
  'activo',
  'otro',
  245140,
  '2025-07-02',
  '2025-07-02',
  'Cliente comercial. Factura SII electrónica Folio 12 ($245.140 CLP). RUT: 18.461.982-2.'
),
(
  'La Casa Rosada SpA',
  'La Casa Rosada SpA',
  'B2B',
  'activo',
  'otro',
  48000,
  '2025-05-13',
  '2025-05-13',
  'Punto de venta y espacio gourmet. Factura SII electrónica Folio 9 ($48.000 CLP). RUT: 77.263.496-K.'
),
(
  'Corporación Cultural de Puerto Montt',
  'Corporación Cultural de Puerto Montt',
  'B2B',
  'activo',
  'otro',
  15000,
  '2025-09-02',
  '2025-09-02',
  'Entidad institucional y cultural. Factura SII electrónica Folio 15 ($15.000 CLP). RUT: 69.259.800-8.'
)
ON CONFLICT (id) DO NOTHING;

-- Registro en terceros para el módulo contable y fiscal
INSERT INTO public.terceros (
  empresa_id, tipo, rut, nombre, giro
) VALUES
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'cliente',
  '77929090-5',
  'Street Machine Producciones S.A.',
  'Producción de eventos y activaciones'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'cliente',
  '76513716-0',
  'Comercializadora y Procesadora de Productos Silvoagropecuarios y Afines',
  'Comercializadora de alimentos'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'cliente',
  '18461982-2',
  'Lorena Monserrat Mardones Ramírez',
  'Comercio minorista y distribución'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'cliente',
  '77263496-K',
  'La Casa Rosada SpA',
  'Espacio gourmet y cafetería'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'cliente',
  '69259800-8',
  'Corporación Cultural de Puerto Montt',
  'Actividades culturales y difusión'
)
ON CONFLICT (empresa_id, rut) DO NOTHING;

-- 4. Prospectos de Carritos Abandonados de Shopify en clientes
INSERT INTO public.clientes (
  name, email, telefono, direccion, type, status, fuente, total_spent, ultimo_contacto, notes
) VALUES
(
  'Yeniffert Gajardo Palma',
  'yeniffertgajardop@gmail.com',
  '+56939341491',
  'Alonso de Ercilla 808, Chillán, Ñuble',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-05-19 14:00:06-04',
  'Carrito abandonado Shopify (#36789980201212). Dejó pendiente: 2x Miel Tradicional ~ Frasco Mayor ($10.990). Monto total cotizado: $26.518 CLP.'
),
(
  'María Eujenia Taibo Grossi',
  'mariaugeniataibo@gmail.com',
  '+56975867794',
  'Amapolas 5565, Depto 1304, Ñuñoa, Santiago',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-06-17 08:45:37-04',
  'Carrito abandonado Shopify (#37067778752764). Dejó pendiente: 1x Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor ($14.990). Monto total cotizado: $18.057 CLP.'
),
(
  'Maria O’shea',
  'maosheag@gmail.com',
  NULL,
  'Cerro Sombrero 247, Las Condes, Santiago',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-06-17 09:51:09-04',
  'Carrito abandonado Shopify (#37068131827964). Dejó pendiente: 1x Miel con Avellanas ~ Tesoro del colmenar ~ Frasco Medio ($5.990). Monto total cotizado: $8.595 CLP.'
),
(
  'Carmen Castro',
  'carmencastroperez1973@gmail.com',
  '+56963326011',
  'San Ignacio de Loyola 450, Arica, Arica y Parinacota',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-06-18 07:49:31-04',
  'Carrito abandonado Shopify (#37075160367356). Dejó pendiente: 2x Miel Virgen ~ Panal del Bosque ($2.990) + 1x Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor ($14.990). Monto total cotizado: $27.945 CLP.'
),
(
  'Sylvia Guzmán Ticardi',
  'ricatdi7@gmail.com',
  '+56993197824',
  'Ingeniero Álvarez Albornoz 6275, Vitacura, Santiago',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-06-23 22:53:38-04',
  'Carrito abandonado Shopify (#37118962401532). Dejó pendiente: 2x Crema de Miel ~ Tesoro del Colmenar ~ Frasco Medio ($5.990). Monto total cotizado: $15.047 CLP.'
),
(
  'Jaime Andrés Rodríguez Chala',
  'jaime.rodriguezchala@gmail.com',
  '+56973490313',
  'Teniente Jiménez 297, Graneros, O’Higgins',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-07-02 19:07:02-04',
  'Carrito abandonado Shopify (#37181555212540). Dejó pendiente: 1x Crema de Miel ~ Reserva del Bosque ~ Frasco Mayor ($14.990). Monto total cotizado: $19.024 CLP.'
),
(
  'Giselle Glaus',
  NULL,
  '+56959282143',
  'Recreo 250, Departamento 608, Santiago',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-07-03 17:25:38-04',
  'Carrito abandonado Shopify (#37187423895804). Dejó pendiente: 1x Miel Tradicional ~ Frasco Mayor ($10.990) + 1x Crema de Miel ~ Frasco Medio ($5.990). Monto total cotizado: $16.980 CLP.'
),
(
  'Felipe Bastián Barrales Arancibia',
  'felipebarrales2@gmail.com',
  '+56935689347',
  'Cerro Ladrilleros 01955, Punta Arenas, Magallanes',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-07-07 17:34:36-04',
  'Carrito abandonado Shopify (#37215081693436). Dejó pendiente: 1x Miel con Avellanas ~ Frasco Medio ($5.990) + 2x Miel Virgen ~ Panal del Bosque ($2.990). Monto total cotizado: $19.953 CLP.'
),
(
  'César Céspedes',
  'cesarcepe50@gmail.com',
  NULL,
  NULL,
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-07-09 02:03:06-04',
  'Carrito abandonado Shopify (#37224181039356). Dejó pendiente: 1x Miel Tradicional ~ Reserva del Bosque ~ Frasco Mayor ($10.990). Monto total cotizado: $10.990 CLP.'
),
(
  'Ignacia Bonilla',
  'ignacia.bonillart@gmail.com',
  NULL,
  'El convento 791, Santiago',
  'D2C',
  'prospecto',
  'web',
  0,
  '2025-08-08 21:24:31-04',
  'Carrito abandonado Shopify (#37319851049212). Dejó pendiente: 1x Crema de Miel ~ Tesoro del Colmenar ~ Frasco Medio ($5.990). Monto total cotizado: $5.990 CLP.'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Cargar Prospectos de Carritos Abandonados en crm_leads (Pipeline de Ventas)
INSERT INTO public.crm_leads (
  empresa_id, nombre, email, telefono, origen, estado, etapa_pipeline, valor_estimado, probabilidad_cierre, notas, created_at
) VALUES
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'Yeniffert Gajardo Palma',
  'yeniffertgajardop@gmail.com',
  '+56939341491',
  'web',
  'nuevo',
  'prospecto',
  26518,
  30,
  'Carrito abandonado Shopify. Interesada en 2x Miel Tradicional ~ Frasco Mayor (Chillán).',
  '2025-05-19 14:00:06-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'María Eujenia Taibo Grossi',
  'mariaugeniataibo@gmail.com',
  '+56975867794',
  'web',
  'nuevo',
  'prospecto',
  18057,
  30,
  'Carrito abandonado Shopify. Interesada en Crema de Miel Reserva del Bosque Frasco Mayor (Ñuñoa).',
  '2025-06-17 08:45:37-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'Maria O’shea',
  'maosheag@gmail.com',
  NULL,
  'web',
  'nuevo',
  'prospecto',
  8595,
  30,
  'Carrito abandonado Shopify. Interesada en Miel con Avellanas Frasco Medio (Las Condes).',
  '2025-06-17 09:51:09-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'Carmen Castro',
  'carmencastroperez1973@gmail.com',
  '+56963326011',
  'web',
  'nuevo',
  'prospecto',
  27945,
  30,
  'Carrito abandonado Shopify. Interesada en Miel Virgen Panal + Crema de Miel Frasco Mayor (Arica).',
  '2025-06-18 07:49:31-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'Sylvia Guzmán Ticardi',
  'ricatdi7@gmail.com',
  '+56993197824',
  'web',
  'nuevo',
  'prospecto',
  15047,
  30,
  'Carrito abandonado Shopify. Interesada en 2x Crema de Miel Frasco Medio (Vitacura).',
  '2025-06-23 22:53:38-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'Jaime Andrés Rodríguez Chala',
  'jaime.rodriguezchala@gmail.com',
  '+56973490313',
  'web',
  'nuevo',
  'prospecto',
  19024,
  30,
  'Carrito abandonado Shopify. Interesada en Crema de Miel Frasco Mayor (Graneros).',
  '2025-07-02 19:07:02-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'Giselle Glaus',
  NULL,
  '+56959282143',
  'web',
  'nuevo',
  'prospecto',
  16980,
  30,
  'Carrito abandonado Shopify. Interesada en Miel Tradicional Frasco Mayor + Crema de Miel Frasco Medio (Santiago).',
  '2025-07-03 17:25:38-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'Felipe Bastián Barrales Arancibia',
  'felipebarrales2@gmail.com',
  '+56935689347',
  'web',
  'nuevo',
  'prospecto',
  19953,
  30,
  'Carrito abandonado Shopify. Interesado en Miel con Avellanas + Miel Virgen Panal (Punta Arenas).',
  '2025-07-07 17:34:36-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'César Céspedes',
  'cesarcepe50@gmail.com',
  NULL,
  'web',
  'nuevo',
  'prospecto',
  10990,
  30,
  'Carrito abandonado Shopify. Interesado en Miel Tradicional Reserva del Bosque Frasco Mayor.',
  '2025-07-09 02:03:06-04'
),
(
  'b1e2f3a4-5678-9abc-def0-1234567890ab',
  'Ignacia Bonilla',
  'ignacia.bonillart@gmail.com',
  NULL,
  'web',
  'nuevo',
  'prospecto',
  5990,
  30,
  'Carrito abandonado Shopify. Interesada en Crema de Miel Frasco Medio (Santiago).',
  '2025-08-08 21:24:31-04'
);
