import { CONTACTO_INSTITUCIONAL, lineaProveedor } from './contacto-institucional';
import { COMUNAS_CHILOE, type ComunaChiloeSlug } from './chiloe-comunas';

/**
 * Puerta B2G real: DIDECO (Dirección de Desarrollo Comunitario).
 * Solo correos y nombres publicados en ficha municipal o captura de la propia
 * dirección. Sin SIPEC inventado, sin “ya adoptado por N municipios”.
 */
export type DidecoVerificacion = 'ficha-publica' | 'web-municipal' | 'pendiente';

export type DidecoContacto = {
  slug: ComunaChiloeSlug;
  comuna: string;
  titular: string | null;
  saludo: 'Estimada' | 'Estimado';
  cargo: string;
  email: string | null;
  telefono: string | null;
  fuente: string;
  verificado: DidecoVerificacion;
};

export const TERRITORIO_PUBLIC_ORIGIN = 'https://www.registroapicolachiloe.me';

export const DIDECO_CHILOE: readonly DidecoContacto[] = [
  {
    slug: 'ancud',
    comuna: 'Ancud',
    titular: 'Maira Molina Ferrada',
    saludo: 'Estimada',
    cargo: 'Directora de Desarrollo Comunitario',
    email: 'maira.molina@muniancud.cl',
    telefono: '65 248 7687',
    fuente: 'https://www.muniancud.cl/portal/unidades-municipales/direccion-de-desarrollo-comunitario/',
    verificado: 'web-municipal',
  },
  {
    slug: 'castro',
    comuna: 'Castro',
    titular: 'Mauricio Jaque Gutiérrez',
    saludo: 'Estimado',
    cargo: 'Director de Desarrollo Comunitario (S)',
    email: 'mjaque@municipalidadcastro.cl',
    telefono: '65 253 0347',
    fuente: 'https://transparencia.municastro.cl/',
    verificado: 'web-municipal',
  },
  {
    slug: 'chonchi',
    comuna: 'Chonchi',
    titular: 'Eduardo Andrade G.',
    saludo: 'Estimado',
    cargo: 'Director de Desarrollo Comunitario',
    email: 'dideco@municipalidadchonchi.cl',
    telefono: null,
    fuente: 'https://municipalidadchonchi.cl/web/municipio/dideco/',
    verificado: 'ficha-publica',
  },
  {
    slug: 'curaco-de-velez',
    comuna: 'Curaco de Vélez',
    titular: 'Marcela Subiabre',
    saludo: 'Estimada',
    cargo: 'Directora de Desarrollo Comunitario',
    email: null,
    telefono: '65 266 7710',
    fuente: 'https://curacodevelez.cl/web/directorio-telefonico/',
    verificado: 'pendiente',
  },
  {
    slug: 'dalcahue',
    comuna: 'Dalcahue',
    titular: 'Paola Maldonado',
    saludo: 'Estimada',
    cargo: 'Directora de Desarrollo Comunitario',
    email: 'paola.maldonado@munidalcahue.cl',
    telefono: '65 244 2601',
    fuente: 'https://www.munidalcahue.cl/portal/oficinas-municipales/dideco/',
    verificado: 'web-municipal',
  },
  {
    slug: 'puqueldon',
    comuna: 'Puqueldón',
    titular: 'Eduardo Barría',
    saludo: 'Estimado',
    cargo: 'Director de Desarrollo Comunitario',
    email: null,
    telefono: '65 267 1552',
    fuente: 'https://munipuqueldon.cl/oficinas-municipales/',
    verificado: 'pendiente',
  },
  {
    slug: 'queilen',
    comuna: 'Queilén',
    titular: 'Cristina María Andrade Miranda',
    saludo: 'Estimada',
    cargo: 'Directora de Desarrollo Comunitario',
    email: 'dideco@muniqueilen.cl',
    telefono: '65 253 5355',
    fuente: 'https://muniqueilen.cl/',
    verificado: 'ficha-publica',
  },
  {
    slug: 'quellon',
    comuna: 'Quellón',
    titular: 'Jorge Bravo Morales',
    saludo: 'Estimado',
    cargo: 'Director de Desarrollo Comunitario',
    email: 'dideco@muniquellon.cl',
    telefono: '65 268 6816',
    fuente: 'https://muniquellon.cl/direccion-de-desarrollo-comunal/',
    verificado: 'web-municipal',
  },
  {
    slug: 'quemchi',
    comuna: 'Quemchi',
    titular: 'Carolina Barría Boldrini',
    saludo: 'Estimada',
    cargo: 'Directora de Desarrollo Comunitario',
    email: 'cbarria@muniquemchi.cl',
    telefono: '65 269 6510',
    fuente: 'https://www.muniquemchi.cl/direccion-desarrollo-comunitario/',
    verificado: 'web-municipal',
  },
  {
    slug: 'quinchao',
    comuna: 'Quinchao',
    titular: 'Mónica Bustamante',
    saludo: 'Estimada',
    cargo: 'DIDECO',
    email: 'dideco@municipalidadquinchao.cl',
    telefono: '65 266 1175',
    fuente: 'https://www.municipalidadquinchao.cl/cquinchao/directorio-telefonico-municipalidad/',
    verificado: 'web-municipal',
  },
] as const;

export function didecoDeComuna(slug: ComunaChiloeSlug): DidecoContacto | undefined {
  return DIDECO_CHILOE.find((d) => d.slug === slug);
}

export function didecosConCorreo(): DidecoContacto[] {
  return DIDECO_CHILOE.filter((d) => Boolean(d.email));
}

export function asuntoCorreoDideco(comuna: string): string {
  return `Piloto 90 días — DIDECO ${comuna}: Ley 21.489 y registro comunal`;
}

export function cuerpoCorreoDideco(d: DidecoContacto): string {
  const tratamiento = d.titular ? `${d.saludo} ${d.titular}` : `${d.saludo} dirección`;

  return `${tratamiento},
${d.cargo}
Ilustre Municipalidad de ${d.comuna}

Junto con saludar, le escribo como apicultor de la provincia, tesista de la Universidad Austral de Chile y coordinador de infraestructura territorial.

La Ley N° 21.489 (y los D.S. N° 20, 21 y 22/2024 del MINAGRI) obliga al apicultor ante el SAG: SIPEC, declaración de existencias, distancias de pecoreo y avisos de plaguicidas. No convierte al municipio en registrador nacional. Lo que sí ocurre, en la práctica, es que la comuna queda mal parada si no hace nada: cuando hay trashumancia, mortandad por fitosanitarios o un conflicto de pecoreo, DIDECO no tiene mapa local.

Por eso proponemos un piloto de 90 días, no un recambio del SIPEC:

1. Censo asistido en terreno (línea base comunal).
2. Panel municipal y mapa con geomáscara (sin publicar GPS exacto).
3. Borrador de ordenanza para revisión de Jurídica y Concejo.
4. Informe técnico de cierre.

No sustituye al SAG ni al SIPEC. No hay interoperabilidad automática con el registro nacional. Las distancias que muestra el sistema son geodésicas (Haversine) y quedan sujetas a revisión humana.

El piloto se cotiza entre $2.400.000 y $3.600.000 + IVA según la comuna (bajo 100 UTM). La vía habitual es Compra Ágil (Ley N° 21.634): no es trato directo; requiere al menos tres cotizaciones y primer llamado a Empresa de Menor Tamaño. El proveedor es ${lineaProveedor()}, sociedad constituida en Queilén; el inicio de actividades ante el SII y la habilitación en ChileProveedores están en trámite.

¿Es posible agendar 25 minutos para revisar el modelo y el informe de ${d.comuna}?

Documentación:
${TERRITORIO_PUBLIC_ORIGIN}/municipalidades/kit

Informe provisorio de ${d.comuna}:
${TERRITORIO_PUBLIC_ORIGIN}/comuna/${d.slug}

Atentamente,

Gabriel Cuevas
Apicultor · tesista UACh · coordinador de infraestructura territorial
${lineaProveedor()}
${CONTACTO_INSTITUCIONAL.whatsappDisplay}
${CONTACTO_INSTITUCIONAL.email}
${TERRITORIO_PUBLIC_ORIGIN}/municipalidades
`;
}

export function mailtoDideco(d: DidecoContacto): string | null {
  if (!d.email) return null;
  return `mailto:${d.email}?subject=${encodeURIComponent(asuntoCorreoDideco(d.comuna))}&body=${encodeURIComponent(cuerpoCorreoDideco(d))}`;
}

export function cubreDiezComunas(): boolean {
  const slugs = new Set(DIDECO_CHILOE.map((d) => d.slug));
  return COMUNAS_CHILOE.every((c) => slugs.has(c.slug));
}
