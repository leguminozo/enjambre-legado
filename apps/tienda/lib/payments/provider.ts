import type { PaymentProvider } from './types';
import { TransbankProvider } from './transbank';
import { FlowClProvider } from './flow-cl';

export type ProviderName = 'transbank' | 'flow';

let cachedProvider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cachedProvider) return cachedProvider;

  const configured = (process.env.PAYMENT_PROVIDER ?? 'transbank').toLowerCase() as ProviderName;

  if (configured === 'flow') {
    cachedProvider = new FlowClProvider();
  } else {
    cachedProvider = new TransbankProvider();
  }

  return cachedProvider;
}

export function resetPaymentProvider(): void {
  cachedProvider = null;
}
