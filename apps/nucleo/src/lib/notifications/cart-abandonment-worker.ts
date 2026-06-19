import { createAdminClient } from "@enjambre/auth/browser";
import {
  parseNotificationPreferences,
  shouldSendNotification,
} from "@enjambre/auth/notification-preferences";
import { formatCLP } from "@enjambre/ui";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getUrlTienda } from "@/lib/publicUrls";
import { sendNotificationEmail } from "./email-sender";

export const CART_ABANDONMENT_GRACE_MINUTES = 30;
export const CART_ABANDONMENT_BATCH_LIMIT = 10;

type AbandonmentCartItem = {
  producto_id?: string;
  nombre?: string;
  precio?: number;
  slug?: string;
  cantidad?: number;
};

type AbandonmentEventRow = {
  id: string;
  user_id: string | null;
  email: string | null;
  cart_items: unknown;
  cart_total: number | null;
  created_at: string;
};

function parseCartItems(raw: unknown): AbandonmentCartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is AbandonmentCartItem => typeof item === "object" && item !== null);
}

export function buildCartAbandonmentEmail(event: AbandonmentEventRow): {
  subject: string;
  body: string;
} {
  const items = parseCartItems(event.cart_items);
  const lines = items
    .map((item) => {
      const qty = item.cantidad ?? 1;
      const name = item.nombre ?? "Producto";
      const price = item.precio ?? 0;
      return `• ${qty}× ${name} — ${formatCLP(price * qty)}`;
    })
    .join("<br/>");

  const total = event.cart_total ?? items.reduce((sum, item) => {
    const qty = item.cantidad ?? 1;
    const price = item.precio ?? 0;
    return sum + price * qty;
  }, 0);

  const tiendaBase = getUrlTienda() || "https://tienda.enjambrelegado.cl";
  const checkoutUrl = `${tiendaBase.replace(/\/$/, "")}/checkout`;

  const subject = "Tu carrito te espera en Enjambre Legado";
  const body = [
    "<p>Dejaste productos en tu carrito. Aún están disponibles para completar tu pedido.</p>",
    lines ? `<p>${lines}</p>` : "",
    `<p><strong>Total estimado:</strong> ${formatCLP(total)}</p>`,
    `<p><a href="${checkoutUrl}">Retomar mi compra</a></p>`,
    "<p>Solo recibirás este recordatorio una vez por abandono.</p>",
  ]
    .filter(Boolean)
    .join("");

  return { subject, body };
}

export function isAbandonmentEligible(createdAt: string, now = Date.now()): boolean {
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) return false;
  const graceMs = CART_ABANDONMENT_GRACE_MINUTES * 60 * 1000;
  return now - createdMs >= graceMs;
}

async function resolveRecipientEmail(
  admin: SupabaseClient,
  event: AbandonmentEventRow,
): Promise<string | null> {
  if (event.email?.trim()) return event.email.trim();
  if (!event.user_id) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", event.user_id)
    .maybeSingle();

  return profile?.email?.trim() ?? null;
}

async function shouldSendAbandonmentEmail(
  admin: SupabaseClient,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return true;

  const { data: profile } = await admin
    .from("profiles")
    .select("notification_preferences")
    .eq("id", userId)
    .maybeSingle();

  const prefs = parseNotificationPreferences(profile?.notification_preferences);
  return shouldSendNotification(prefs, "pedidos", "email");
}

export async function markCartAbandonmentConverted(
  admin: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await admin
    .from("cart_abandonment_events")
    .update({ converted: true })
    .eq("user_id", userId)
    .eq("converted", false);

  if (error) {
    console.error("[cart-abandonment] mark converted failed:", error.message);
  }
}

export async function processCartAbandonmentEmails(): Promise<{
  scannedCount: number;
  sentCount: number;
  skippedCount: number;
}> {
  const admin = createAdminClient();
  if (!admin) {
    console.error("[cart-abandonment] admin client unavailable");
    return { scannedCount: 0, sentCount: 0, skippedCount: 0 };
  }

  const graceCutoff = new Date(
    Date.now() - CART_ABANDONMENT_GRACE_MINUTES * 60 * 1000,
  ).toISOString();

  const { data: pending, error } = await admin
    .from("cart_abandonment_events")
    .select("id, user_id, email, cart_items, cart_total, created_at")
    .is("email_sent_at", null)
    .eq("converted", false)
    .lt("created_at", graceCutoff)
    .order("created_at", { ascending: true })
    .limit(CART_ABANDONMENT_BATCH_LIMIT);

  if (error || !pending) {
    console.error("[cart-abandonment] fetch pending failed:", error?.message);
    return { scannedCount: 0, sentCount: 0, skippedCount: 0 };
  }

  let sentCount = 0;
  let skippedCount = 0;

  for (const row of pending as AbandonmentEventRow[]) {
    const recipient = await resolveRecipientEmail(admin, row);
    const allowEmail = await shouldSendAbandonmentEmail(admin, row.user_id);

    if (!recipient || !allowEmail) {
      skippedCount += 1;
      await admin
        .from("cart_abandonment_events")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", row.id);
      continue;
    }

    const { subject, body } = buildCartAbandonmentEmail(row);

    try {
      await sendNotificationEmail(recipient, subject, body);
      sentCount += 1;

      await admin
        .from("cart_abandonment_events")
        .update({ email_sent_at: new Date().toISOString() })
        .eq("id", row.id);

      await admin.from("notification_queue").insert({
        empresa_id: null,
        channel: "email",
        recipient,
        subject,
        body,
        status: "sent",
        metadata: {
          source: "cart_abandonment",
          abandonment_id: row.id,
          dedupe_key: `cart_abandonment:${row.id}`,
        },
      });
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : String(sendError);
      console.error(`[cart-abandonment] email failed for ${row.id}:`, message);
    }
  }

  return {
    scannedCount: pending.length,
    sentCount,
    skippedCount,
  };
}