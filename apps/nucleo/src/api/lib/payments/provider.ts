import type { PaymentProvider } from './types';
import { FlowClProvider } from './flow-cl';

export type ProviderName = 'flow';

let cachedProvider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (cachedProvider) return cachedProvider;
  cachedProvider = new FlowClProvider();
  return cachedProvider;
}

export function resetPaymentProvider(): void {
  cachedProvider = null;
}
