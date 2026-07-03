import { getInternalApiSecret } from '@enjambre/auth/internal-api-secret';
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { getNucleoApiUrl } from '@/lib/shop/nucleo-url';
import { guardMutation } from '@/lib/api-guard';

const DEFAULT_SUBJECT = 'Bienvenido al Legado';
const DEFAULT_BODY =
  'Gracias por unirte. Explora tus alertas de floración y el impacto de tu colmena.';

export async function POST(request: NextRequest) {
  const csrfBlock = guardMutation(request);
  if (csrfBlock) return csrfBlock;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nucleoUrl = getNucleoApiUrl();
  const internalKey = getInternalApiSecret();

  if (!nucleoUrl || !internalKey) {
    console.error('[notifications/welcome] Nucleo URL or internal key not configured');
    return NextResponse.json({ error: 'Notifications not configured' }, { status: 503 });
  }

  let res: Response;
  try {
    res = await fetch(`${nucleoUrl}/api/notifications/internal/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-key': internalKey,
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
        subject: DEFAULT_SUBJECT,
        body: DEFAULT_BODY,
        source: 'tienda_signup',
      }),
    });
  } catch (error) {
    console.error('[notifications/welcome] nucleo fetch failed:', error);
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.error('[notifications/welcome] nucleo error:', res.status, detail);
    return NextResponse.json({ error: 'Failed to enqueue welcome' }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}