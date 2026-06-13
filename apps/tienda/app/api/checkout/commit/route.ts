import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const nucleoBffUrl = process.env.NUCLEO_BFF_URL;

    if (!nucleoBffUrl) {
      console.error('Missing NUCLEO_BFF_URL environment variable');
      return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 });
    }

    const response = await fetch(`${nucleoBffUrl}/api/checkout/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(raw),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo confirmar pago proxy';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
