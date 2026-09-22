import { NextRequest, NextResponse } from 'next/server';
import { removeWebPushSubscription } from '@/app/actions/web-push';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.endpoint) {
      return NextResponse.json({ success: false, error: 'Endpoint requerido' }, { status: 400 });
    }

    const result = await removeWebPushSubscription(body.endpoint);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
