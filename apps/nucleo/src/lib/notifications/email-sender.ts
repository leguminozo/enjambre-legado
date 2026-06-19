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

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Enjambre Legado <contacto@enjambrelegado.cl>",
      to: recipient,
      subject,
      html: body,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error en Resend API (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  return { success: true, response: data };
}