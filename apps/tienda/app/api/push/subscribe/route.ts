import { NextRequest, NextResponse } from 'next/server';
import { saveWebPushSubscription } from '@/app/actions/web-push';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userAgent = req.headers.get('user-agent') || undefined;

    const result = await saveWebPushSubscription({
      endpoint: body.endpoint,
      p256dh: body.keys.p256dh,
      auth: body.keys.auth,
      topics: body.topics,
      userAgent,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
