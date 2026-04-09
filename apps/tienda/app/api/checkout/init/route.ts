import { NextResponse } from 'next/server';

type InitBody = {
  total: number;
  returnUrl?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as InitBody;
    const total = Math.max(1, Math.round(Number(body.total || 0)));
    const returnUrl =
      body.returnUrl ||
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/resultado`;

    const buyOrder = `ORD-${Date.now()}`;
    const sessionId = `sess-${Date.now()}`;

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebpayPlus } = require('transbank-sdk');
    const tx = new WebpayPlus.Transaction();
    const response = await tx.create(buyOrder, sessionId, total, returnUrl);

    return NextResponse.json({
      url: response.url,
      token: response.token,
      buyOrder,
      sessionId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo iniciar checkout';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

