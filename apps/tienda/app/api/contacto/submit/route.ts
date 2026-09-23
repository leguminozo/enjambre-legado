import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { createRateLimiter } from '@/lib/ratelimit';

const ContactoSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  apellido: z.string().trim().max(100).optional().default(''),
  email: z.string().trim().email('Correo electrónico inválido').max(255),
  telefono: z.string().trim().max(50).optional().default(''),
  mensaje: z.string().trim().min(1, 'El mensaje es obligatorio').max(3000),
  honeypot: z.string().optional().default(''),
});

const contactoLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 5,
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const rateCheck = contactoLimiter(ip);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera unos minutos.' },
        { status: 429 },
      );
    }

    const raw = (await request.json().catch(() => ({}))) as unknown;
    const parsed = ContactoSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos de contacto inválidos' },
        { status: 400 },
      );
    }

    const { nombre, apellido, email, telefono, mensaje, honeypot } = parsed.data;

    // Trampa anti-bot: retorno silencioso si completaron el campo oculto
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Servicio de contacto temporalmente no disponible' },
        { status: 503 },
      );
    }

    const fullName = `${nombre} ${apellido}`.trim();

    // 1. Obtener empresa y administrador para vincular la interacción
    const { data: empresa } = await admin
      .from('empresas')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const { data: adminProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    const empresaId = empresa?.id;
    const adminId = adminProfile?.id;

    // 2. Resguardar lead en clientes
    const { data: existingClient } = await admin
      .from('clientes')
      .select('id, notes')
      .eq('email', email)
      .maybeSingle();

    let clienteId = existingClient?.id;

    if (!clienteId) {
      const { data: newClient, error: clientErr } = await admin
        .from('clientes')
        .insert({
          user_id: adminId || null,
          name: fullName || email.split('@')[0],
          email,
          telefono: telefono || null,
          type: 'Particular',
          status: 'prospecto',
          fuente: 'web',
          notes: `Contacto web: ${mensaje.slice(0, 160)}${mensaje.length > 160 ? '...' : ''}`,
        })
        .select('id')
        .single();

      if (!clientErr && newClient) {
        clienteId = newClient.id;
      }
    } else {
      // Actualizar teléfono si no lo tenía y anexar nota
      await admin
        .from('clientes')
        .update({
          telefono: telefono || undefined,
          ultimo_contacto: new Date().toISOString(),
        })
        .eq('id', clienteId);
    }

    // 3. Registrar interacción en CRM de Núcleo
    if (empresaId && adminId && clienteId) {
      await admin.from('interacciones').insert({
        cliente_id: clienteId,
        rep_id: adminId,
        empresa_id: empresaId,
        tipo: 'email',
        notas: `Mensaje desde formulario de contacto:\n\n${mensaje}`,
        resultado: 'pendiente',
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'Tu mensaje ha sido recibido por la coordinación territorial.',
    });
  } catch (err) {
    console.error('[contacto/submit] Error procesando mensaje:', err);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar tu mensaje. Intenta nuevamente.' },
      { status: 500 },
    );
  }
}
