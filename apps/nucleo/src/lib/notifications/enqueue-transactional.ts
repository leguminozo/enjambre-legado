import type { SupabaseClient } from "@supabase/supabase-js";
import { formatCLP } from "@enjambre/ui";
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
  /** Categoría explícita; si no, se infiere desde source */
  category?: NotificationCategory;
  /** Preferencias precargadas (evita round-trip en batch) */
  preferences?: NotificationPreferences;
};

export type TransactionalNotificationResult = {
  skipped: boolean;
  emailQueued: boolean;
  inAppCreated: boolean;
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
    inAppCreated: false,
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

  const baseMetadata = {
    dedupe_key: input.dedupeKey,
    source: input.source,
    category,
  };

  const shouldEmail =
    allowEmail && input.sendEmail !== false && Boolean(input.email);

  if (shouldEmail && input.email) {
    const { error: queueError } = await admin.from("notification_queue").insert({
      empresa_id: input.empresaId ?? null,
      channel: "email",
      recipient: input.email,
      subject: input.subject,
      body: input.body,
      status: "pending",
      metadata: baseMetadata,
    });

    if (queueError) {
      throw new Error(`notification_queue insert failed: ${queueError.message}`);
    }
    result.emailQueued = true;
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
      .eq("created_by", input.userId)
      .eq("subject", input.subject)
      .limit(1)
      .maybeSingle();

    if (!existingInApp) {
      const { error: eventError } = await admin.from("notification_events").insert({
        channel: "in_app",
        recipient: input.email,
        subject: input.subject,
        body: input.body,
        status: "sent",
        created_by: input.userId,
        provider_response: { source: input.source, dedupe_key: input.dedupeKey, category },
      });

      if (eventError) {
        throw new Error(`notification_events insert failed: ${eventError.message}`);
      }
      result.inAppCreated = true;
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

  return enqueueTransactionalNotification(admin, {
    dedupeKey: `caf_alert_low:${input.empresaId}:${input.tipoDte}:${input.cafId}`,
    source: "caf_low_folios",
    email: input.email,
    userId: input.userId,
    subject,
    body,
    empresaId: input.empresaId,
    category: "sistema",
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
  });
}