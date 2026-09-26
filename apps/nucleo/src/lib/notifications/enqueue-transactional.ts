import type { SupabaseClient } from "@supabase/supabase-js";
import { formatCLP } from "@enjambre/ui";
import { sendNotificationEmail, type EmailContext } from "./email-sender";
import {
  parseNotificationPreferences,
  shouldSendNotification,
  sourceToNotificationCategory,
  type NotificationCategory,
  type NotificationPreferences,
} from "@enjambre/auth/notification-preferences";

export type TransactionalNotificationInput = {
  dedupeKey: string;
  source: string;
  email: string | null;
  userId?: string | null;
  subject: string;
  body: string;
  empresaId?: string | null;
  /** Encola email en notification_queue (default: true si hay email) */
  sendEmail?: boolean;
  /** Envía el email ya (fire-on-mutation); si falla, cae a la cola (cron es backstop). */
  immediate?: boolean;
  /** ISO timestamp: la cola no entrega este email antes de esa fecha (worker salta). */
  sendAfter?: string;
  /** Categoría explícita; si no, se infiere desde source */
  category?: NotificationCategory;
  /** Preferencias precargadas (evita round-trip en batch) */
  preferences?: NotificationPreferences;
  /** Variables para la plantilla del Centro de Correos (email_templates). */
  templateVars?: Record<string, string>;
  /** Idioma de la plantilla (variante key+locale; fallback 'es'). */
  locale?: string;
  /** Remitente explícito opcional */
  from?: string;
  /** Contexto de la app: territorio (registroapicolachiloe.me), tienda (obrerayzangano.cl), o sistema */
  context?: EmailContext;
  /** Encola además un push al usuario (worker lo entrega a sus equipos; sin suscripción se omite solo). */
  sendPush?: boolean;
  /** Título de la push (default: subject) */
  pushTitle?: string;
  /** URL de destino al tocar la push (default: "/") */
  pushUrl?: string;
  /** Entidad para la campana central (lote, producto, pos). Viaja en provider_response. */
  entity?: string;
};

export type TransactionalNotificationResult = {
  skipped: boolean;
  emailQueued: boolean;
  emailSentImmediately: boolean;
  inAppCreated: boolean;
  pushQueued: boolean;
  preferenceSkipped: boolean;
};

async function hasDedupeKey(
  admin: SupabaseClient,
  dedupeKey: string,
): Promise<boolean> {
  const { data } = await admin
    .from("notification_queue")
    .select("id")
    .filter("metadata->>dedupe_key", "eq", dedupeKey)
    .limit(1)
    .maybeSingle();

  return Boolean(data);
}

async function loadNotificationPreferences(
  admin: SupabaseClient,
  userId: string | null | undefined,
): Promise<NotificationPreferences | null> {
  if (!userId) return null;

  const { data, error } = await admin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("[enqueue-transactional] failed to load notification_preferences:", error.message);
    return null;
  }

  return parseNotificationPreferences(data?.notification_preferences);
}

type EmailTemplateRow = {
  key: string;
  locale: string;
  segment: string;
  subject_template: string;
  body_template: string;
  enabled: boolean;
  mode: "immediate" | "queue";
  send_after_hours: number;
};

/**
 * Plantilla del Centro de Correos para un source + idioma.
 * Fallback: variante 'es' → null (código).
 * El servicio no debe fallar por la tabla: cualquier error → null.
 */
async function loadEmailTemplate(
  admin: SupabaseClient,
  source: string,
  locale = "es",
): Promise<EmailTemplateRow | null> {
  const columns =
    "key, locale, segment, subject_template, body_template, enabled, mode, send_after_hours";
  try {
    if (locale !== "es") {
      const { data } = await admin
        .from("email_templates")
        .select(columns)
        .eq("key", source)
        .eq("locale", locale)
        .maybeSingle();
      if (data) return data as EmailTemplateRow;
    }
    const { data, error } = await admin
      .from("email_templates")
      .select(columns)
      .eq("key", source)
      .eq("locale", "es")
      .maybeSingle();
    if (error || !data) return null;
    return data as EmailTemplateRow;
  } catch {
    return null;
  }
}

/** Reemplaza {{ campo }} con templateVars (o '' si falta). */
export function renderEmailTemplate(
  template: string,
  vars: Record<string, string> | undefined,
): string {
  if (!vars || Object.keys(vars).length === 0) return template;
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, name: string) => {
    return vars[name] ?? '';
  });
}

async function recordPreferenceSkip(
  admin: SupabaseClient,
  input: {
    dedupeKey: string;
    source: string;
    userId?: string | null;
    email: string | null;
    subject: string;
    body: string;
    empresaId?: string | null;
  },
): Promise<void> {
  const { error } = await admin.from("notification_queue").insert({
    empresa_id: input.empresaId ?? null,
    channel: "system",
    recipient: input.email ?? input.userId ?? "skipped",
    subject: input.subject,
    body: input.body,
    status: "sent",
    metadata: {
      dedupe_key: input.dedupeKey,
      source: input.source,
      skipped_preferences: true,
      user_id: input.userId ?? null,
    },
  });

  if (error) {
    throw new Error(`notification_queue preference skip failed: ${error.message}`);
  }
}

/**
 * Encola email (worker) + crea notification_events in_app de forma idempotente.
 * Patrón compartido: welcome, checkout confirmado, despacho.
 */
export async function enqueueTransactionalNotification(
  admin: SupabaseClient,
  input: TransactionalNotificationInput,
): Promise<TransactionalNotificationResult> {
  const result: TransactionalNotificationResult = {
    skipped: false,
    emailQueued: false,
    emailSentImmediately: false,
    inAppCreated: false,
    pushQueued: false,
    preferenceSkipped: false,
  };

  if (await hasDedupeKey(admin, input.dedupeKey)) {
    result.skipped = true;
    return result;
  }

  const category = input.category ?? sourceToNotificationCategory(input.source);
  const preferences =
    input.preferences ?? (await loadNotificationPreferences(admin, input.userId));

  const allowEmail =
    preferences === null
      ? true
      : shouldSendNotification(preferences, category, "email");
  const allowInApp =
    preferences === null
      ? true
      : shouldSendNotification(preferences, category, "in_app");

  if (!allowEmail && !allowInApp) {
    await recordPreferenceSkip(admin, input);
    result.preferenceSkipped = true;
    return result;
  }

  const resolvedContext: EmailContext =
    input.context ??
    (category === "territorio" || input.source.includes("alerta_fitosanitaria")
      ? "territorio"
      : category === "pedidos" ||
        input.source.includes("checkout") ||
        input.source.includes("shipment") ||
        input.source.includes("cart_abandonment")
      ? "tienda"
      : "sistema");

  const baseMetadata = {
    dedupe_key: input.dedupeKey,
    source: input.source,
    category,
    context: resolvedContext,
    ...(input.from ? { from: input.from } : {}),
    ...(input.entity ? { entity: input.entity } : {}),
  };

  const shouldEmail =
    allowEmail && input.sendEmail !== false && Boolean(input.email);

  if (shouldEmail && input.email) {
    // Centro de Correos: la plantilla de email_templates (si existe y está
    // habilitada) reemplaza subject/body/modo/diferido del código.
    const tpl = await loadEmailTemplate(admin, input.source, input.locale ?? "es");
    const tplEnabled = tpl?.enabled !== false;
    const effectiveSubject = tpl
      ? renderEmailTemplate(tpl.subject_template, input.templateVars)
      : input.subject;
    const effectiveBody = tpl
      ? renderEmailTemplate(tpl.body_template, input.templateVars)
      : input.body;
    const effectiveImmediate = tpl ? tpl.mode === "immediate" : Boolean(input.immediate);
    const effectiveSendAfter =
      tpl && tpl.send_after_hours > 0
        ? new Date(Date.now() + tpl.send_after_hours * 60 * 60 * 1000).toISOString()
        : input.sendAfter;

    if (tpl && !tplEnabled) {
      // Tipo apagado desde el Centro de Correos: sin email (in_app sigue abajo).
      result.preferenceSkipped = true;
    } else if (effectiveImmediate) {
      try {
        const sent = await sendNotificationEmail(input.email, effectiveSubject, effectiveBody, {
          from: input.from,
          context: resolvedContext,
        });
        const { error: sentError } = await admin.from("notification_queue").insert({
          empresa_id: input.empresaId ?? null,
          channel: "email",
          recipient: input.email,
          subject: effectiveSubject,
          body: effectiveBody,
          status: "sent",
          metadata: {
            ...baseMetadata,
            immediate: true,
            provider_response: sent.response,
          },
        });
        if (sentError) throw sentError;
        result.emailSentImmediately = true;
      } catch (err) {
        // Fire-on-mutation fallido → la cola (cron diario) es el backstop.
        console.error(
          "[enqueue-transactional] immediate send failed, falling back to queue:",
          err instanceof Error ? err.message : err,
        );
        const { error: queueError } = await admin.from("notification_queue").insert({
          empresa_id: input.empresaId ?? null,
          channel: "email",
          recipient: input.email,
          subject: effectiveSubject,
          body: effectiveBody,
          status: "pending",
          metadata: baseMetadata,
        });
        if (queueError) {
          throw new Error(`notification_queue insert failed: ${queueError.message}`, { cause: err });
        }
        result.emailQueued = true;
      }
    } else {
      const { error: queueError } = await admin.from("notification_queue").insert({
        empresa_id: input.empresaId ?? null,
        channel: "email",
        recipient: input.email,
        subject: effectiveSubject,
        body: effectiveBody,
        status: "pending",
        metadata: {
          ...baseMetadata,
          ...(effectiveSendAfter ? { send_after: effectiveSendAfter } : {}),
        },
      });

      if (queueError) {
        throw new Error(`notification_queue insert failed: ${queueError.message}`);
      }
      result.emailQueued = true;
    }
  } else if (input.userId && allowInApp) {
    // Sin email o email deshabilitado: cola system para auditoría/retry in_app vía worker
    const { error: queueError } = await admin.from("notification_queue").insert({
      empresa_id: input.empresaId ?? null,
      channel: "system",
      recipient: input.email ?? input.userId,
      subject: input.subject,
      body: input.body,
      status: "pending",
      metadata: {
        ...baseMetadata,
        user_id: input.userId,
        in_app: true,
      },
    });

    if (queueError) {
      throw new Error(`notification_queue insert failed: ${queueError.message}`);
    }
  } else if (allowEmail || allowInApp) {
    // Dedupe sin envío activo (ej. sin userId ni email pero canal habilitado)
    await recordPreferenceSkip(admin, input);
    result.preferenceSkipped = true;
    return result;
  }

  if (input.userId && allowInApp) {
    const { data: existingInApp } = await admin
      .from("notification_events")
      .select("id")
      .eq("channel", "in_app")
      .eq("recipient_user_id", input.userId)
      .eq("subject", input.subject)
      .limit(1)
      .maybeSingle();

    if (!existingInApp) {
      const { error: eventError } = await admin.from("notification_events").insert({
        channel: "in_app",
        recipient: input.email,
        recipient_user_id: input.userId,
        subject: input.subject,
        body: input.body,
        status: "sent",
        created_by: input.userId,
        provider_response: {
          source: input.source,
          dedupe_key: input.dedupeKey,
          category,
          ...(input.entity ? { entity: input.entity } : {}),
        },
      });

      if (eventError) {
        throw new Error(`notification_events insert failed: ${eventError.message}`);
      }
      result.inAppCreated = true;
    }
  }

  // Push web al equipo del usuario (el worker omite si no hay suscripción).
  // Respeta la misma preferencia de categoría que el email/in_app.
  if (input.sendPush && input.userId && (allowEmail || allowInApp)) {
    const { error: pushError } = await admin.from("notification_queue").insert({
      empresa_id: input.empresaId ?? null,
      channel: "push",
      recipient: input.userId,
      subject: input.pushTitle ?? input.subject,
      body: input.body,
      status: "pending",
      metadata: {
        ...baseMetadata,
        dedupe_key: `${input.dedupeKey}:push`,
        push_url: input.pushUrl ?? "/",
      },
    });
    if (pushError) {
      console.warn("[enqueue-transactional] push enqueue failed:", pushError.message);
    } else {
      result.pushQueued = true;
    }
  }

  return result;
}

export type CheckoutConfirmedNotificationInput = {
  buyOrder: string;
  ventaId: string;
  total: number;
  trackingCode: string;
  email: string | null;
  userId?: string | null;
  empresaId?: string | null;
};

export async function notifyCheckoutConfirmed(
  admin: SupabaseClient,
  input: CheckoutConfirmedNotificationInput,
): Promise<TransactionalNotificationResult> {
  const subject = `Pedido confirmado — ${input.buyOrder}`;
  const body = [
    "Tu pago fue procesado correctamente.",
    `Orden: ${input.buyOrder}`,
    `Total: ${formatCLP(input.total)}`,
    `Seguimiento: ${input.trackingCode}`,
    "Puedes ver el estado en tu perfil de pedidos.",
  ].join("\n");

  return enqueueTransactionalNotification(admin, {
    dedupeKey: `checkout_paid:${input.buyOrder}`,
    source: "checkout_paid",
    email: input.email,
    userId: input.userId,
    subject,
    body,
    empresaId: input.empresaId,
    category: "pedidos",
    immediate: true,
    templateVars: {
      buyOrder: input.buyOrder,
      total: formatCLP(input.total),
      trackingCode: input.trackingCode,
    },
  });
}

const SHIPPED_STATUSES = new Set([
  "enviado",
  "Enviado",
  "en_transito",
  "En tránsito",
  "En Tránsito",
]);

export function isShippedStatus(status: string): boolean {
  return SHIPPED_STATUSES.has(status);
}

export type ShipmentDispatchedNotificationInput = {
  envioId: string;
  trackingCode: string;
  destino: string;
  status: string;
  email: string | null;
  userId?: string | null;
  buyOrder?: string | null;
  empresaId?: string | null;
};

const DTE_TIPO_LABELS: Record<number, string> = {
  33: "Factura electrónica",
  34: "Factura exenta",
  39: "Boleta electrónica",
  41: "Boleta exenta",
  46: "Factura de compra",
  52: "Guía de despacho",
  56: "Nota de débito",
  61: "Nota de crédito",
};

export type CafLowFoliosNotificationInput = {
  empresaId: string;
  empresaNombre: string;
  tipoDte: number;
  foliosRestantes: number;
  folioDesde: number;
  folioHasta: number;
  cafId: string;
  email: string;
  userId?: string | null;
};

export async function notifyCafLowFolios(
  admin: SupabaseClient,
  input: CafLowFoliosNotificationInput,
): Promise<TransactionalNotificationResult> {
  const tipoLabel = DTE_TIPO_LABELS[input.tipoDte] ?? `DTE ${input.tipoDte}`;
  const minFolios = Number(process.env.SII_CAF_MIN_FOLIOS ?? 10);
  const critico = input.foliosRestantes < minFolios;
  const subject = critico
    ? `Urgente: CAF ${tipoLabel} sin folios operativos`
    : `Alerta CAF: quedan ${input.foliosRestantes} folios (${tipoLabel})`;

  const body = [
    `Empresa: ${input.empresaNombre}`,
    `Documento: ${tipoLabel} (tipo ${input.tipoDte})`,
    `Rango CAF: ${input.folioDesde}–${input.folioHasta}`,
    `Folios restantes: ${input.foliosRestantes}`,
    critico
      ? `La emisión está bloqueada hasta cargar un nuevo CAF (mínimo operativo: ${minFolios}).`
      : "Sube un nuevo CAF en Núcleo → SII antes de quedar sin folios.",
    "Este aviso es idempotente por lote CAF activo.",
  ].join("\n");

  const titulo = critico
    ? `Urgente: CAF ${tipoLabel} sin folios operativos`
    : `Alerta CAF: quedan ${input.foliosRestantes} folios (${tipoLabel})`;
  const cuerpo = critico
    ? `La emisión está bloqueada hasta cargar un nuevo CAF (mínimo operativo: ${minFolios}).`
    : "Sube un nuevo CAF en Núcleo → SII antes de quedar sin folios.";

  return enqueueTransactionalNotification(admin, {
    dedupeKey: `caf_alert_low:${input.empresaId}:${input.tipoDte}:${input.cafId}`,
    source: "caf_low_folios",
    email: input.email,
    userId: input.userId,
    subject,
    body,
    empresaId: input.empresaId,
    category: "sistema",
    templateVars: {
      titulo,
      empresaNombre: input.empresaNombre,
      tipoLabel,
      tipoDte: String(input.tipoDte),
      folioDesde: String(input.folioDesde),
      folioHasta: String(input.folioHasta),
      foliosRestantes: String(input.foliosRestantes),
      cuerpo,
    },
  });
}

export async function notifyShipmentDispatched(
  admin: SupabaseClient,
  input: ShipmentDispatchedNotificationInput,
): Promise<TransactionalNotificationResult> {
  const orderRef = input.buyOrder ? ` (${input.buyOrder})` : "";
  const subject = `Despacho en camino${orderRef}`;
  const body = [
    "Tu pedido salió hacia destino.",
    `Destino: ${input.destino}`,
    `Seguimiento: ${input.trackingCode}`,
    `Estado: ${input.status}`,
    "Revisa el detalle en tu perfil de pedidos.",
  ].join("\n");

  return enqueueTransactionalNotification(admin, {
    dedupeKey: `shipment_dispatched:${input.envioId}:${input.status}`,
    source: "shipment_dispatched",
    email: input.email,
    userId: input.userId,
    subject,
    body,
    empresaId: input.empresaId,
    category: "pedidos",
    immediate: true,
    sendPush: true,
    pushUrl: "/perfil/pedidos",
    templateVars: {
      orderRef,
      destino: input.destino,
      trackingCode: input.trackingCode,
      status: input.status,
    },
  });
}

export type StockCriticoNotificationInput = {
  lotes?: Array<{ id: string; nombre_lote?: string | null; kg_total?: number | null }>;
  productos?: Array<{ id: string; nombre?: string | null; stock?: number | null }>;
  items?: Array<{
    id: string;
    nombre?: string | null;
    clase?: string | null;
    stock?: number | null;
    stock_minimo?: number | null;
    unidad?: string | null;
  }>;
  userId: string;
  email: string | null;
  empresaId?: string | null;
  /** Fecha ISO (YYYY-MM-DD) para dedupe diario: 1 alerta por entidad por día */
  today: string;
};

/**
 * Alertas operativas de inventario → notificaciones centrales (campana + Voz de la Colmena).
 * Idempotente por (entidad, día): un lote, producto o ítem crítico alerta una vez al día, no en cada fetch.
 */
export async function notifyStockCritico(
  admin: SupabaseClient,
  input: StockCriticoNotificationInput,
): Promise<void> {
  if (input.lotes) {
    for (const lote of input.lotes) {
      const codigo = lote.nombre_lote?.trim() || lote.id.slice(0, 8).toUpperCase();
      await enqueueTransactionalNotification(admin, {
        dedupeKey: `stock_critico_lote:${lote.id}:${input.today}`,
        source: "stock_critico",
        entity: "lote",
        email: input.email,
        userId: input.userId,
        subject: `Lote crítico: ${codigo}`,
        body: `El lote ${codigo} está bajo el umbral operativo (${Number(lote.kg_total ?? 0)} kg < 50 kg).`,
        empresaId: input.empresaId,
        category: "sistema",
        templateVars: {
          titulo: `Lote crítico: ${codigo}`,
          cuerpo: `El lote ${codigo} está bajo el umbral operativo (${Number(lote.kg_total ?? 0)} kg < 50 kg).`,
        },
      });
    }
  }

  if (input.productos) {
    for (const producto of input.productos) {
      const nombre = producto.nombre?.trim() || "Producto";
      await enqueueTransactionalNotification(admin, {
        dedupeKey: `stock_critico_producto:${producto.id}:${input.today}`,
        source: "stock_critico",
        entity: "producto",
        email: input.email,
        userId: input.userId,
        subject: `Riesgo de quiebre: ${nombre}`,
        body: `${nombre} tiene ${Number(producto.stock ?? 0)} unidades (< 10).`,
        empresaId: input.empresaId,
        category: "sistema",
        templateVars: {
          titulo: `Riesgo de quiebre: ${nombre}`,
          cuerpo: `${nombre} tiene ${Number(producto.stock ?? 0)} unidades (< 10).`,
        },
      });
    }
  }

  if (input.items) {
    for (const item of input.items) {
      const nombre = item.nombre?.trim() || "Ítem de inventario";
      const claseLabel = item.clase
        ? item.clase.charAt(0).toUpperCase() + item.clase.slice(1)
        : "Inventario";
      await enqueueTransactionalNotification(admin, {
        dedupeKey: `stock_critico_item:${item.id}:${input.today}`,
        source: "stock_critico",
        entity: "inventario_item",
        email: input.email,
        userId: input.userId,
        subject: `Alerta de reposición: ${nombre}`,
        body: `${nombre} (${claseLabel}) está en o bajo el mínimo operativo: ${Number(item.stock ?? 0)} ${item.unidad || 'un.'} (mínimo ${Number(item.stock_minimo ?? 0)}).`,
        empresaId: input.empresaId,
        category: "sistema",
        templateVars: {
          titulo: `Alerta de reposición: ${nombre}`,
          cuerpo: `${nombre} (${claseLabel}) está en o bajo el mínimo operativo: ${Number(item.stock ?? 0)} ${item.unidad || 'un.'} (mínimo ${Number(item.stock_minimo ?? 0)}).`,
        },
      });
    }
  }
}

export type ReviewInvitationNotificationInput = {
  ventaId: string;
  email: string | null;
  userId?: string | null;
  productIds: string[];
};

/**
 * Invitación de reseña post-compra (guardian, compra verificada).
 * In-app inmediato + email diferido (sendAfter): el email no debe competir
 * con el "pedido confirmado" ni llegar antes de que el cliente pruebe la miel.
 */
export async function notifyReviewInvitation(
  admin: SupabaseClient,
  input: ReviewInvitationNotificationInput,
): Promise<TransactionalNotificationResult> {
  const ids = input.productIds.slice(0, 10);
  const { data: productos } = await admin
    .from("productos")
    .select("id, nombre, slug")
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const items = (productos ?? [])
    .slice(0, 5)
    .map((p) => {
      const nombre = typeof p.nombre === "string" ? p.nombre : "Miel del bosque";
      return { nombre };
    });

  const subject = "¿Cómo estuvo tu miel?";
  const body = [
    "Tu pedido llegó y queremos saber cómo lo viviste.",
    "",
    items.length
      ? items.map((i) => `· ${i.nombre}`).join("\n")
      : "Cuéntanos qué tal estuvo.",
    "",
    "Tu opinión verificada alimenta el territorio: reseñas que se pueden rastrear hasta el apiario.",
    "Puedes dejar tu huella desde tu perfil en la tienda.",
  ].join("\n");

  return enqueueTransactionalNotification(admin, {
    dedupeKey: `review_invite:${input.ventaId}`,
    source: "review_invitation",
    email: input.email,
    userId: input.userId,
    subject,
    body,
    category: "pedidos",
    sendAfter: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    templateVars: {
      productos: items.length
        ? items.map((i) => `· ${i.nombre}`).join("\n")
        : "Cuéntanos qué tal estuvo.",
    },
  });
}