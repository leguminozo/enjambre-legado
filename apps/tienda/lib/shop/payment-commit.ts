/**
 * Commit de pago post-redirect (carrito y reposición comparten parsing y fetch).
 */

export type PendingPayment = {
  buyOrder?: string;
  provider?: string;
};

export type PaymentCommitResponse = {
  ok?: boolean;
  authorized?: boolean;
  processing?: boolean;
  error?: string;
  buyOrder?: string;
  alreadyProcessed?: boolean;
  message?: string;
  code?: string;
};

export function parsePendingPayment(raw: string | null): PendingPayment | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as unknown;
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return null;
    const record = obj as Record<string, unknown>;
    return {
      buyOrder: typeof record.buyOrder === 'string' ? record.buyOrder : undefined,
      provider: typeof record.provider === 'string' ? record.provider : undefined,
    };
  } catch {
    return null;
  }
}

export function parsePaymentCommitResponse(obj: unknown): PaymentCommitResponse {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) return {};
  const record = obj as Record<string, unknown>;
  return {
    ok: typeof record.ok === 'boolean' ? record.ok : undefined,
    authorized: typeof record.authorized === 'boolean' ? record.authorized : undefined,
    processing: typeof record.processing === 'boolean' ? record.processing : undefined,
    error: typeof record.error === 'string' ? record.error : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
    code: typeof record.code === 'string' ? record.code : undefined,
    buyOrder: typeof record.buyOrder === 'string' ? record.buyOrder : undefined,
    alreadyProcessed:
      typeof record.alreadyProcessed === 'boolean' ? record.alreadyProcessed : undefined,
  };
}

export type CommitPaymentInput = {
  commitUrl: string;
  token: string;
  buyOrder?: string;
  provider?: string;
  /** Bearer opcional; si falta se intenta hidratar de la sesión (reposiciones lo requieren). */
  accessToken?: string;
};

export type CommitPaymentResult =
  | { ok: true; data: PaymentCommitResponse }
  | { ok: false; kind: 'network' | 'rejected'; message: string; data?: PaymentCommitResponse };

async function resolveAccessToken(explicit?: string): Promise<string | undefined> {
  if (explicit) return explicit;
  try {
    const { createClient } = await import('@/utils/supabase/client');
    const supabase = createClient();
    // Refresca JWT si hace falta antes de leer session local
    await supabase.auth.getUser();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  } catch {
    return undefined;
  }
}

export async function commitPayment(input: CommitPaymentInput): Promise<CommitPaymentResult> {
  const accessToken = await resolveAccessToken(input.accessToken);

  let res: Response;
  try {
    res = await fetch(input.commitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        token_ws: input.token,
        buyOrder: input.buyOrder,
        provider: input.provider,
      }),
    });
  } catch {
    return { ok: false, kind: 'network', message: 'Error de conexión. Verifica tu internet e intenta de nuevo.' };
  }

  let raw: unknown;
  try {
    raw = await res.json();
  } catch {
    return {
      ok: false,
      kind: 'network',
      message: res.ok
        ? 'No se pudo confirmar el pago.'
        : 'El servicio de pagos no respondió correctamente. Si te cobraron, contacta soporte con tu orden.',
    };
  }

  const data = parsePaymentCommitResponse(raw);

  if (!res.ok || !data.ok || !data.authorized) {
    return {
      ok: false,
      kind: 'rejected',
      message: data.error ?? data.message ?? 'No se pudo confirmar el pago.',
      data,
    };
  }

  return { ok: true, data };
}
