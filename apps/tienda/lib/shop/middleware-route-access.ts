import type { SupabaseClient } from '@supabase/supabase-js';
import { getParticipacionActiva } from './participacion';
import { getNucleoStaffEntryUrl } from './nucleo-app-url';
import { resolveProfileRole } from './resolve-profile-role';
import { isNucleoStaffRole } from './staff-roles';
import {
  evaluateRouteAccess,
  requiresParticipacionCheck,
  requiresStaffRoleCheck,
  type RouteAccessResult,
} from './store-routes';

type MiddlewareUser = {
  id: string;
  app_metadata?: Record<string, unknown>;
} | null;

export async function resolveRouteAccessForMiddleware(
  pathname: string,
  user: MiddlewareUser,
  supabase: SupabaseClient,
): Promise<RouteAccessResult> {
  const needsParticipacion = Boolean(user && requiresParticipacionCheck(pathname));
  const needsStaffRole = Boolean(user && requiresStaffRoleCheck(pathname));

  const [participacion, staffRole] = await Promise.all([
    needsParticipacion ? getParticipacionActiva(supabase, user!.id) : undefined,
    needsStaffRole ? resolveProfileRole(supabase, user!) : undefined,
  ]);

  return evaluateRouteAccess(pathname, {
    isAuthenticated: Boolean(user),
    participacion,
    isNucleoStaff: staffRole ? isNucleoStaffRole(staffRole) : false,
    nucleoStaffEntryUrl: getNucleoStaffEntryUrl(),
  });
}