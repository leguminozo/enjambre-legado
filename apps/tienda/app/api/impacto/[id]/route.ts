import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { resolveProfileRole } from '@/lib/shop/resolve-profile-role';
import { isNucleoStaffRole } from '@/lib/shop/staff-roles';
import { friendlySupabaseError } from '@enjambre/ui';

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ code: 'auth_required', message: 'Sesión requerida' }, { status: 401 });
  }

  const role = await resolveProfileRole(supabase, user, { forceDb: true });
  if (!isNucleoStaffRole(role)) {
    return NextResponse.json({ code: 'forbidden', message: 'Solo staff' }, { status: 403 });
  }

  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) {
    return NextResponse.json({ code: 'bad_id' }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) {
    return NextResponse.json({ code: 'admin_unavailable' }, { status: 500 });
  }
  const { error } = await admin.from('impacto_publico').delete().eq('id', numId);
  if (error) {
    return NextResponse.json({ code: 'snapshot_delete_failed', message: friendlySupabaseError(error) }, { status: 500 });
  }
  return NextResponse.json({ data: { deleted: numId } });
}