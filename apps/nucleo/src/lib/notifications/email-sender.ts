import { Resend } from "resend";

export type EmailContext = "territorio" | "tienda" | "sistema";

export interface SendEmailOptions {
  replyTo?: string;
  from?: string;
  context?: EmailContext;
}

export const EMAIL_IDENTITIES = {
  territorio:
    process.env.RESEND_FROM_EMAIL_TERRITORIO ||
    "Registro Apícola de Chiloé <censo@registroapicolachiloe.me>",
  tienda:
    process.env.RESEND_FROM_EMAIL_TIENDA ||
    "Obrera y Zángano <contacto@obrerayzangano.cl>",
  pedidos:
    process.env.RESEND_FROM_EMAIL_PEDIDOS ||
    "Obrera y Zángano <pedidos@obrerayzangano.cl>",
  sistema:
    process.env.RESEND_FROM_EMAIL_SISTEMA ||
    "Enjambre Legado <contacto@obrerayzangano.cl>",
} as const;

export function resolveSenderEmail(options?: SendEmailOptions): string {
  if (options?.from) return options.from;
  if (options?.context === "tienda") return EMAIL_IDENTITIES.tienda;
  if (options?.context === "territorio") return EMAIL_IDENTITIES.territorio;
  if (options?.context === "sistema") return EMAIL_IDENTITIES.sistema;
  if (process.env.RESEND_FROM_EMAIL) return process.env.RESEND_FROM_EMAIL;
  return EMAIL_IDENTITIES.territorio;
}

export async function sendNotificationEmail(
  recipient: string,
  subject: string,
  body: string,
  options?: SendEmailOptions,
): Promise<{ success: boolean; response: Record<string, unknown> }> {
  const apiKey = process.env.RESEND_API_KEY;
  const effectiveFrom = resolveSenderEmail(options);

  if (!apiKey) {
    console.log(
      `[Resend Mock Email] Remitente: ${effectiveFrom} | Enviando a: ${recipient} | Asunto: ${subject} | Cuerpo: ${body.substring(0, 100)}...`,
    );
    return { success: true, response: { mock: true, provider: "mock_resend", from: effectiveFrom } };
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: effectiveFrom,
    to: recipient,
    subject,
    html: body,
    ...(options?.replyTo ? { replyTo: options.replyTo } : {}),
  });

  if (error) {
    throw new Error(`Error en Resend API (${error.statusCode ?? "unknown"}): ${error.message}`);
  }

  return { success: true, response: (data ?? {}) as unknown as Record<string, unknown> };
}