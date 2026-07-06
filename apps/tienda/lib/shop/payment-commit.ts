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
  error?: string;
  buyOrder?: string;
  alreadyProcessed?: boolean;
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
    error: typeof record.error === 'string' ? record.error : undefined,
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
};

export type CommitPaymentResult =
  | { ok: true; data: PaymentCommitResponse }
  | { ok: false; kind: 'network' | 'rejected'; message: string; data?: PaymentCommitResponse };

export async function commitPayment(input: CommitPaymentInput): Promise<CommitPaymentResult> {
  let res: Response;
  try {
    res = await fetch(input.commitUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
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

  const data = parsePaymentCommitResponse(await res.json());

  if (!res.ok || !data.ok || !data.authorized) {
    return {
      ok: false,
      kind: 'rejected',
      message: data.error ?? 'No se pudo confirmar el pago.',
      data,
    };
  }

  return { ok: true, data };
}