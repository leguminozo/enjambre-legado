import type { PaymentProvider, PaymentInitResult, PaymentCommitResult } from './types';
import { z } from 'zod';
import { getNucleoPublicUrl, toFlowFormBody, withFlowSignature } from './flow-sign';

const FlowInitResponseSchema = z.object({
  url: z.string().min(1),
  token: z.union([z.string(), z.number()]),
  flowOrder: z.number(),
});

const FlowCommitResponseSchema = z.object({
  status: z.number(),
  paymentData: z
    .object({
      type: z.string().optional(),
      media: z.string().optional(),
      amount: z.number().optional(),
      fee: z.number().optional(),
    })
    .optional(),
  merchantData: z.record(z.string(), z.unknown()).optional(),
  flowOrder: z.number().optional(),
  commerceOrder: z.string().optional(),
});

function getFlowUrl(): string {
  const url = process.env.FLOW_API_URL;
  if (!url) throw new Error('Falta FLOW_API_URL');
  return url.replace(/\/$/, '');
}

function getFlowApiKey(): string {
  const key = process.env.FLOW_API_KEY;
  if (!key) throw new Error('Falta FLOW_API_KEY');
  return key;
}

function getFlowSecret(): string {
  const secret = process.env.FLOW_SECRET;
  if (!secret) throw new Error('Falta FLOW_SECRET');
  return secret;
}

async function flowPost<T>(path: string, params: Record<string, string>): Promise<T> {
  const signed = await withFlowSignature(params, getFlowSecret());
  const body = toFlowFormBody(signed);

  const res = await fetch(`${getFlowUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Flow.cl ${path} failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}

export class FlowClProvider implements PaymentProvider {
  readonly name = 'flow' as const;

  async init(
    buyOrder: string,
    sessionId: string,
    amount: number,
    returnUrl: string,
    email?: string,
  ): Promise<PaymentInitResult> {
    const nucleoUrl = getNucleoPublicUrl();
    const params: Record<string, string> = {
      apiKey: getFlowApiKey(),
      commerceOrder: buyOrder,
      subject: `Orden ${buyOrder}`,
      currency: 'CLP',
      amount: String(amount),
      email: email || '',
      urlConfirmation: `${nucleoUrl}/api/checkout/webhook/flow`,
      urlReturn: returnUrl,
      optional: JSON.stringify({ sessionId }),
    };

    const raw = await flowPost<unknown>('/payment/create', params);
    const parsed = FlowInitResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Flow.cl init response schema mismatch: ${parsed.error.flatten()}`);
    }
    const data = parsed.data;

    return {
      url: data.url,
      token: String(data.token),
      buyOrder,
      sessionId,
      provider: 'flow',
    };
  }

  async commit(token: string): Promise<PaymentCommitResult> {
    const raw = await flowPost<unknown>('/payment/getStatus', {
      apiKey: getFlowApiKey(),
      token,
    });

    const parsed = FlowCommitResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new Error(`Flow.cl commit response schema mismatch: ${parsed.error.flatten()}`);
    }
    const data = parsed.data;

    const FLOW_PAID = 2;
    const authorized = data.status === FLOW_PAID;

    return {
      authorized,
      buyOrder: data.commerceOrder ?? '',
      authorizationCode: String(data.flowOrder ?? ''),
      cardType: data.paymentData?.media ?? '',
      last4: '',
      raw: raw as Record<string, unknown>,
    };
  }

  async refund(buyOrder: string, amount: number): Promise<{ ok: boolean }> {
    try {
      await flowPost('/payment/refund', {
        apiKey: getFlowApiKey(),
        commerceOrder: buyOrder,
        amount: String(amount),
      });
      return { ok: true };
    } catch (error) {
      console.error('[flow-cl] refund error:', error);
      return { ok: false };
    }
  }
}
