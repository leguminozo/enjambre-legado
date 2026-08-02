import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { path, type } = body;

    if (path) {
      if (type === 'page' || type === 'layout') {
        revalidatePath(path, type);
      } else {
        revalidatePath(path);
      }
      return NextResponse.json({ revalidated: true, now: Date.now(), path, type });
    }
    
    return NextResponse.json({ error: 'Missing path to revalidate' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Error revalidating', details: err.message }, { status: 500 });
  }
}
