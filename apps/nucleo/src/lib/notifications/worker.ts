import { createAdminClient } from "@enjambre/auth/browser";

interface QueueItem {
  id: string;
  empresa_id: string | null;
  channel: "email" | "whatsapp" | "push" | "system";
  recipient: string;
  subject: string | null;
  body: string;
  attempts: number;
  max_attempts: number;
  metadata: Record<string, any>;
}

/**
 * Enviar un correo electrónico utilizando la API de Resend
 */
async function sendEmail(recipient: string, subject: string, body: string): Promise<{ success: boolean; response: any }> {
  // Provider: Resend (ver integrations-env.ts para otras NOTIFY_* legacy como SendGrid).
  // Si no hay RESEND_API_KEY, usa mock (útil para dev). Para producción configurar clave.
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[Resend Mock Email] Enviando a: ${recipient} | Asunto: ${subject} | Cuerpo: ${body.substring(0, 100)}...`);
    return { success: true, response: { mock: true, provider: "mock_resend" } };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enjambre Legado <contacto@enjambrelegado.cl>",
        to: recipient,
        subject: subject,
        html: body,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en Resend API (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return { success: true, response: data };
  } catch (error) {
    console.error("[Email Worker] Falló envío real de email:", error);
    throw error;
  }
}

/**
 * Enviar un mensaje de WhatsApp utilizando la API de Twilio
 */
async function sendWhatsApp(recipient: string, body: string): Promise<{ success: boolean; response: any }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM; // ej. "whatsapp:+14155238886"

  if (!accountSid || !authToken || !fromNumber) {
    console.log(`[Twilio Mock WhatsApp] Enviando a: ${recipient} | Mensaje: ${body}`);
    return { success: true, response: { mock: true, provider: "mock_twilio" } };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: recipient.startsWith("whatsapp:") ? recipient : `whatsapp:${recipient}`,
          Body: body,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error en Twilio API (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    return { success: true, response: data };
  } catch (error) {
    console.error("[WhatsApp Worker] Falló envío real de WhatsApp:", error);
    throw error;
  }
}

/**
 * Procesar la cola de notificaciones pendientes
 */
export async function processNotificationQueue(): Promise<{ processedCount: number; successCount: number }> {
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("[Notification Worker] No se pudo inicializar cliente Supabase Admin");
    return { processedCount: 0, successCount: 0 };
  }

  // 1. Obtener notificaciones pendientes
  const { data: pendingItems, error: fetchError } = await supabase
    .from("notification_queue")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(20);

  if (fetchError || !pendingItems) {
    console.error("[Notification Worker] Error al obtener items de la cola:", fetchError?.message);
    return { processedCount: 0, successCount: 0 };
  }

  let processedCount = 0;
  let successCount = 0;

  for (const item of pendingItems as QueueItem[]) {
    processedCount++;
    const attempts = item.attempts + 1;

    // 2. Marcar como procesando
    await supabase
      .from("notification_queue")
      .update({ status: "processing", attempts })
      .eq("id", item.id);

    try {
      let sendResult: { success: boolean; response: any };

      switch (item.channel) {
        case "email":
          sendResult = await sendEmail(item.recipient, item.subject ?? "Notificación de Enjambre Legado", item.body);
          break;
        case "whatsapp":
          sendResult = await sendWhatsApp(item.recipient, item.body);
          break;
        case "system":
          // System notifications are created directly as alerts on the BFF route,
          // so we just mark them as sent instantly.
          sendResult = { success: true, response: { local: true } };
          break;
        case "push":
          console.log(`[Push Notification Mock] Enviando a: ${item.recipient} | Mensaje: ${item.body}`);
          sendResult = { success: true, response: { mock: true, provider: "mock_push" } };
          break;
        default:
          throw new Error(`Canal de notificación no soportado: ${item.channel}`);
      }

      if (sendResult.success) {
        successCount++;
        // 3a. Marcar como enviado en la cola
        await supabase
          .from("notification_queue")
          .update({
            status: "sent",
            last_attempt_at: new Date().toISOString(),
            metadata: { ...item.metadata, provider_response: sendResult.response },
          })
          .eq("id", item.id);

        // 3b. Registrar en el historial de eventos
        await supabase.from("notification_events").insert({
          channel: item.channel,
          recipient: item.recipient,
          subject: item.subject,
          body: item.body,
          status: "sent",
          provider_response: sendResult.response,
        });
      }
    } catch (error: any) {
      console.error(`[Notification Worker] Error enviando item ${item.id}:`, error.message);

      const isFinalFailure = attempts >= item.max_attempts;

      // 4. Actualizar estado por fallo
      await supabase
        .from("notification_queue")
        .update({
          status: isFinalFailure ? "failed" : "pending",
          error_message: error.message || String(error),
          last_attempt_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      // Si es fallo definitivo, registrar evento fallido en el historial
      if (isFinalFailure) {
        await supabase.from("notification_events").insert({
          channel: item.channel,
          recipient: item.recipient,
          subject: item.subject,
          body: item.body,
          status: "error",
          provider_response: { error: error.message || String(error) },
        });
      }
    }
  }

  return { processedCount, successCount };
}
