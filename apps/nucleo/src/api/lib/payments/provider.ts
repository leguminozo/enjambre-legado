import type { PaymentProvider } from './types';
import { FlowClProvider } from './flow-cl';
import { TransbankClProvider } from './transbank-cl';

export type ProviderName = 'flow' | 'transbank';

let cachedProvider: PaymentProvider | null = null;

function getProviderName(): ProviderName {
  return (process.env.PAYMENT_PROVIDER as ProviderName) || 'flow';
}

export function getPaymentProvider(): PaymentProvider {
  if (cachedProvider) return cachedProvider;
  const name = getProviderName();
  cachedProvider = name === 'transbank' ? new TransbankClProvider() : new FlowClProvider();
  return cachedProvider;
}

export function resetPaymentProvider(): void {
  cachedProvider = null;
}

export function getPaymentProviderByName(name: ProviderName): PaymentProvider {
  return name === 'transbank' ? new TransbankClProvider() : new FlowClProvider();
}
