import {
  isAgriRol,
  isComercialRol,
  isPredioRol,
  isTecnicoRol,
  resolveTerritorialMenuFamily,
} from './territorial-rol';

export type TerritorialWriteGateResult =
  | { allow: true }
  | {
      allow: false;
      code: 'territorial_family_restricted';
      message: string;
    };

const FAMILY_RESTRICTED_MESSAGE =
  'Tu sub-rol territorial aún no tiene escrituras habilitadas (oleada 2b). Completa la inscripción o pide promoción de rol.';

/**
 * Gate de escrituras del Registro Territorial (server-side).
 *
 * Oleada 2a: familias api|institucion escriben; `minimo` (2b) solo inscripción.
 * Carve-outs 2b: la acción central de un sub-rol se habilita con el rol
 * declarado en actores_registro — emitir alertas (agri_*) y registrar predios
 * (prop_facilitador). Confirmar una alerta es acuse de cualquier actor
 * inscrito; la ruta exige ownership propio. Los candados finos (censo
 * completo, actor propio) viven en cada ruta, no aquí.
 *
 * Fail-closed: sin sub-rol resuelto → familia minimo → bloqueado.
 */
export function resolveTerritorialWriteGate(
  method: string,
  pathname: string,
  rol: string | null | undefined,
): TerritorialWriteGateResult {
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return { allow: true };
  }

  if (method === 'POST') {
    // Inscripción / auto-registro: siempre permitido para territorial.
    if (pathname.endsWith('/actores')) return { allow: true };
    // Acuse de recepción: cualquier actor inscrito (ownership en la ruta).
    if (pathname.endsWith('/confirmar')) return { allow: true };
    // Carve-outs por sub-rol (la acción ES el propósito del rol).
    if (pathname.endsWith('/alertas') && isAgriRol(rol)) return { allow: true };
    if (pathname.endsWith('/predios') && isPredioRol(rol)) return { allow: true };
    // Técnicos/inspectores: su monitoreo sanitario se traduce en emitir
    // alertas de brotes detectados en terreno (auditoría 2026-08-23).
    if (pathname.endsWith('/alertas') && isTecnicoRol(rol)) return { allow: true };
    // Comercializadores: declarar intención de acopio por temporada.
    if (pathname.endsWith('/acopio') && isComercialRol(rol)) return { allow: true };
    // Recalcular credencial propia: cualquiera con censo completo.
    if (pathname.endsWith('/recalcular-credencial')) return { allow: true };
    // Registrar presentación SAG: el PDF se vuelve trazable.
    if (pathname.endsWith('/declaraciones-sag') && !pathname.includes('/sag/')) return { allow: true };
    // Derecho ARCO: la solicitud de supresión es un derecho del titular,
    // no una escritura territorial — siempre permitida para autenticados.
    if (pathname.endsWith('/arco/solicitar-eliminacion')) return { allow: true };
  }

  const family = resolveTerritorialMenuFamily(rol);
  // Escritura habilitada solo para familias con capacidad real. agri/predio
  // llegan aquí solo si NO usaron su carve-out (p.ej. agri intentando
  // registrar predios) → se bloquean. tecnico/comercial → minimo bloqueado.
  if (family !== 'api' && family !== 'institucion') {
    return {
      allow: false,
      code: 'territorial_family_restricted',
      message: FAMILY_RESTRICTED_MESSAGE,
    };
  }
  return { allow: true };
}
