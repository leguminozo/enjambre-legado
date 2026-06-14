import type { PaymentProvider, PaymentInitResult, PaymentCommitResult } from './types';
import WebpayPlusTransaction from 'transbank-sdk/dist/es6/transbank/webpay/webpay_plus/transaction.js';
import WebpayPlusOptions from 'transbank-sdk/dist/es6/transbank/common/options.js';
import WebpayPlusEnvironment from 'transbank-sdk/dist/es6/transbank/webpay/common/environment.js';
import { z } from 'zod';

const TransbankInitResponseSchema = z.object({
  token: z.string().min(1),
  url: z.string().min(1),
});

const TransbankCommitResponseSchema = z.object({
  token: z.string().optional(),
  buyOrder: z.string().optional(),
  sessionId: z.string().optional(),
  cardNumber: z.string().optional(),
  accountingDate: z.string().optional(),
  transactionDate: z.string().optional(),
  authorizationCode: z.string().optional(),
  paymentTypeCode: z.string().optional(),
  responseCode: z.number().optional(),
  installmentsNumber: z.number().optional(),
  amount: z.number().optional(),
  sharesNumber: z.number().optional(),
  status: z.string().optional(),
});

function getTransbankCommerceCode(): string {
  const code = process.env.TRANSBANK_COMMERCE_CODE;
  if (!code) throw new Error('Falta TRANSBANK_COMMERCE_CODE');
  return code;
}

function getTransbankApiKey(): string {
  const key = process.env.TRANSBANK_API_KEY;
  if (!key) throw new Error('Falta TRANSBANK_API_KEY');
  return key;
}

function getTransbankEnvironment(): 'integration' | 'production' {
  return (process.env.TRANSBANK_ENVIRONMENT as 'integration' | 'production') || 'integration';
}

function getTransbankClient() {
  const environment = getTransbankEnvironment() === 'production'
    ? WebpayPlusEnvironment.Production
    : WebpayPlusEnvironment.Integration;
  return new WebpayPlusTransaction(
    new WebpayPlusOptions(
      getTransbankCommerceCode(),
      getTransbankApiKey(),
      environment
    )
  );
}

export class TransbankClProvider implements PaymentProvider {
  readonly name = 'transbank' as const;

  async init(
    buyOrder: string,
    sessionId: string,
    amount: number,
    returnUrl: string,
    email?: string
  ): Promise<PaymentInitResult> {
    const client = getTransbankClient();

    const createResponse = await client.create(
      buyOrder,
      sessionId,
      amount,
      returnUrl
    );

    const parsed = TransbankInitResponseSchema.safeParse(createResponse);
    if (!parsed.success) {
      throw new Error(`Transbank init response schema mismatch: ${parsed.error.flatten()}`);
    }

    const data = parsed.data;
    const webpayUrl = `${getTransbankEnvironment() === 'production'
      ? 'https://webpay3g.transbank.cl'
      : 'https://webpay3gint.transbank.cl'}/webpayserver/initTransaction`;

    return {
      url: `${webpayUrl}?token_ws=${data.token}`,
      token: data.token,
      buyOrder,
      sessionId,
      provider: 'transbank',
    };
  }

  async commit(token: string): Promise<PaymentCommitResult> {
    const client = getTransbankClient();

    const commitResponse = await client.commit(token);

    const parsed = TransbankCommitResponseSchema.safeParse(commitResponse);
    if (!parsed.success) {
      throw new Error(`Transbank commit response schema mismatch: ${parsed.error.flatten()}`);
    }

    const data = parsed.data;
    const authorized = data.responseCode === 0;

    return {
      authorized,
      buyOrder: data.buyOrder ?? '',
      authorizationCode: data.authorizationCode ?? '',
      cardType: data.paymentTypeCode ?? '',
      last4: data.cardNumber ? data.cardNumber.slice(-4) : '',
      raw: commitResponse as Record<string, unknown>,
    };
  }

  async refund(buyOrder: string, amount: number): Promise<{ ok: boolean }> {
    const client = getTransbankClient();

    try {
      await client.refund(buyOrder, amount);
      return { ok: true };
    } catch (error) {
      console.error('[transbank-cl] refund error:', error);
      return { ok: false };
    }
  }
}