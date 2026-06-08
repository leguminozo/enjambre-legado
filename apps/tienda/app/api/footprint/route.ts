import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ventaId = searchParams.get('venta_id');

  if (!ventaId) {
    const { data: footprints } = await supabase
      .from('order_regenerative_footprint')
      .select('venta_id, co2_evitado_kg, bosque_m2_protegido, azucar_sustituida_g, irr_score')
      .in(
        'venta_id',
        (
          await supabase
            .from('ventas')
            .select('id')
            .eq('buyer_id', user.id)
            .limit(20)
        ).data?.map((v) => v.id) ?? [],
      );

    const totals = (footprints ?? []).reduce(
      (acc, f) => ({
        co2_evitado_kg: acc.co2_evitado_kg + Number(f.co2_evitado_kg),
        bosque_m2_protegido:
          acc.bosque_m2_protegido + Number(f.bosque_m2_protegido),
        azucar_sustituida_g:
          acc.azucar_sustituida_g + Number(f.azucar_sustituida_g),
      }),
      { co2_evitado_kg: 0, bosque_m2_protegido: 0, azucar_sustituida_g: 0 },
    );

    return NextResponse.json({
      user_id: user.id,
      ...totals,
      orders: footprints ?? [],
    });
  }

  const { data: venta } = await supabase
    .from('ventas')
    .select('id, buyer_id')
    .eq('id', ventaId)
    .maybeSingle();

  if (!venta || venta.buyer_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: footprint } = await supabase
    .from('order_regenerative_footprint')
    .select('*')
    .eq('venta_id', ventaId)
    .maybeSingle();

  return NextResponse.json(
    footprint ?? {
      venta_id: ventaId,
      co2_evitado_kg: 0,
      bosque_m2_protegido: 0,
      azucar_sustituida_g: 0,
      irr_score: null,
    },
  );
}
