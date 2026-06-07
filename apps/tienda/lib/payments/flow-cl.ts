import type { PaymentProvider, PaymentInitResult, PaymentCommitResult } from './types';
import { z } from 'zod';

const FlowInitResponseSchema = z.object({
  url: z.string().min(1),
  token: z.union([z.string(), z.number()]),
  flowOrder: z.number(),
});

const FlowCommitResponseSchema = z.object({
  status: z.number(),
  paymentData: z.object({
    type: z.string().optional(),
    media: z.string().optional(),
    amount: z.number().optional(),
    fee: z.number().optional(),
  }).optional(),
  merchantData: z.record(z.string(), z.unknown()).optional(),
  flowOrder: z.number().optional(),
  commerceOrder: z.string().optional(),
});

function getFlowUrl(): string {
  const url = process.env.FLOW_API_URL;
  if (!url) throw new Error('Falta FLOW_API_URL');
  return url;
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

async function signParams(params: Record<string, string>): Promise<string> {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  const encoder = new TextEncoder();
  const data = encoder.encode(sorted);
  const keyData = encoder.encode(getFlowSecret());
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export class FlowClProvider implements PaymentProvider {
  readonly name = 'flow' as const;

  async init(buyOrder: string, sessionId: string, amount: number, returnUrl: string, email?: string): Promise<PaymentInitResult> {
    const params: Record<string, string> = {
      apiKey: getFlowApiKey(),
      commerceOrder: buyOrder,
      subject: `Orden ${buyOrder}`,
      currency: 'CLP',
      amount: String(amount),
      email: email || '',
      urlConfirmation: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/checkout/webhook/flow`,
      urlReturn: returnUrl,
      optional: JSON.stringify({ sessionId }),
    };

    params.s = await signParams(params);

    const res = await fetch(`${getFlowUrl()}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Flow.cl create failed (${res.status}): ${text}`);
    }

  const raw = await res.json();
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
    const params: Record<string, string> = {
      apiKey: getFlowApiKey(),
      token,
    };

    params.s = await signParams(params);

    const res = await fetch(`${getFlowUrl()}/api/payment/getStatus`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Flow.cl getStatus failed (${res.status}): ${text}`);
    }

  const raw = await res.json();
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
    const params: Record<string, string> = {
      apiKey: getFlowApiKey(),
      commerceOrder: buyOrder,
      amount: String(amount),
    };

    params.s = await signParams(params);

    try {
      const res = await fetch(`${getFlowUrl()}/api/payment/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return { ok: res.ok };
} catch (error) {
    console.error('[flow-cl] refund error:', error);
    return { ok: false };
    }
  }
}
