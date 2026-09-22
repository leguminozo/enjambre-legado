import { NextResponse } from 'next/server';
import { getVapidPublicKeyAction } from '@/app/actions/web-push';

export const dynamic = 'force-dynamic';

export async function GET() {
  const publicKey = await getVapidPublicKeyAction();
  return NextResponse.json({ publicKey });
}
