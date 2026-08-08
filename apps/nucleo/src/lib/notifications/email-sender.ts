import { Resend } from "resend";

export async function sendNotificationEmail(
  recipient: string,
  subject: string,
  body: string,
): Promise<{ success: boolean; response: Record<string, unknown> }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(
      `[Resend Mock Email] Enviando a: ${recipient} | Asunto: ${subject} | Cuerpo: ${body.substring(0, 100)}...`,
    );
    return { success: true, response: { mock: true, provider: "mock_resend" } };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: "Enjambre Legado <contacto@enjambrelegado.cl>",
    to: recipient,
    subject,
    html: body,
  });

  if (error) {
    throw new Error(`Error en Resend API (${error.statusCode ?? "unknown"}): ${error.message}`);
  }

  return { success: true, response: (data ?? {}) as unknown as Record<string, unknown> };
}