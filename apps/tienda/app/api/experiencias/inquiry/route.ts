import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/utils/supabase/admin';
import { createRateLimiter } from '@/lib/ratelimit';

const InquirySchema = z.object({
  format: z.string().trim().min(1).max(100),
  experienceName: z.string().trim().min(1).max(200),
  name: z.string().trim().max(100).optional().default(''),
  organization: z.string().trim().max(150).optional().default(''),
  email: z.string().trim().email('Correo inválido').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(50).optional().default(''),
  attendees: z.string().trim().max(100).optional().default(''),
  timeframe: z.string().trim().max(100).optional().default(''),
  notes: z.string().trim().max(3000).optional().default(''),
  honeypot: z.string().optional().default(''),
});

const inquiryLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 6,
});

export async function POST(request: Request) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
    const rateCheck = inquiryLimiter(ip);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera unos momentos.' },
        { status: 429 },
      );
    }

    const raw = (await request.json().catch(() => ({}))) as unknown;
    const parsed = InquirySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos de solicitud inválidos' },
        { status: 400 },
      );
    }

    const {
      format,
      experienceName,
      name,
      organization,
      email,
      phone,
      attendees,
      timeframe,
      notes,
      honeypot,
    } = parsed.data;

    // Trampa anti-bot
    if (honeypot && honeypot.length > 0) {
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Servicio de agenda temporalmente no disponible' },
        { status: 503 },
      );
    }

    const contactName = name || organization || 'Solicitud de Experiencia';
    const clientType = organization ? 'B2B' : 'Particular';

    // 1. Obtener empresa y administrador para la interacción
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

    // 2. Resguardar o actualizar lead en clientes
    let clienteId: string | null = null;
    if (email) {
      const { data: existing } = await admin
        .from('clientes')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      if (existing) clienteId = existing.id;
    }

    const inquirySummary = [
      `Experiencia: ${experienceName}`,
      `Modalidad: ${format}`,
      `Organización / Anfitrión: ${organization || name || 'No especificado'}`,
      `Asistentes estimados: ${attendees}`,
      `Fecha/mes: ${timeframe || 'Por coordinar'}`,
      `Contacto: ${phone || 'Sin teléfono'} | ${email || 'Sin correo'}`,
      notes ? `Notas: ${notes}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    if (!clienteId) {
      const { data: newClient } = await admin
        .from('clientes')
        .insert({
          user_id: adminId || null,
          name: contactName,
          empresa: organization || null,
          email: email || null,
          telefono: phone || null,
          type: clientType,
          status: 'prospecto',
          fuente: 'web',
          notes: `Solicitud experiencia: ${experienceName} (${format})`,
        })
        .select('id')
        .maybeSingle();

      if (newClient) clienteId = newClient.id;
    } else {
      await admin
        .from('clientes')
        .update({
          empresa: organization || undefined,
          telefono: phone || undefined,
          ultimo_contacto: new Date().toISOString(),
        })
        .eq('id', clienteId);
    }

    // 3. Registrar interacción en CRM
    if (empresaId && adminId && clienteId) {
      await admin.from('interacciones').insert({
        cliente_id: clienteId,
        rep_id: adminId,
        empresa_id: empresaId,
        tipo: 'whatsapp',
        notas: inquirySummary,
        resultado: 'pendiente',
      });
    }

    return NextResponse.json({
      ok: true,
      message: 'Solicitud respaldada en agenda institucional.',
    });
  } catch (err) {
    console.error('[experiencias/inquiry] Error procesando solicitud:', err);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar tu solicitud.' },
      { status: 500 },
    );
  }
}
