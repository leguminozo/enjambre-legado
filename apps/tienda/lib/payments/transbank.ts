import type { PaymentProvider, PaymentInitResult, PaymentCommitResult } from './types';

export class TransbankProvider implements PaymentProvider {
  readonly name = 'transbank' as const;

  async init(buyOrder: string, sessionId: string, amount: number, returnUrl: string, _email?: string): Promise<PaymentInitResult> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebpayPlus } = require('transbank-sdk');
    const tx = new WebpayPlus.Transaction();
    const response = await tx.create(buyOrder, sessionId, amount, returnUrl);

    return {
      url: response.url,
      token: response.token,
      buyOrder,
      sessionId,
      provider: 'transbank',
    };
  }

  async commit(token: string): Promise<PaymentCommitResult> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebpayPlus } = require('transbank-sdk');
    const tx = new WebpayPlus.Transaction();
    const result = await tx.commit(token);

    const authorized = result?.status === 'AUTHORIZED';

    return {
      authorized,
      buyOrder: result?.buyOrder ?? '',
      authorizationCode: result?.authorizationCode ?? '',
      cardType: result?.paymentTypeCode ?? '',
      last4: result?.cardDetail?.cardNumber ?? '',
      raw: result as Record<string, unknown>,
    };
  }

  async refund(buyOrder: string, amount: number): Promise<{ ok: boolean }> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebpayPlus } = require('transbank-sdk');
    const tx = new WebpayPlus.Transaction();
    try {
      await tx.refund(buyOrder, amount);
      return { ok: true };
} catch (error) {
    console.error('[transbank] refund error:', error);
    return { ok: false };
    }
  }
}
