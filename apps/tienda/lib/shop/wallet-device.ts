export type WalletHost = 'ios' | 'android' | 'desktop';

export function resolveWalletHost(ua: string): WalletHost {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'desktop';
}

export function billeteraPath(platform?: 'apple' | 'google'): string {
  if (platform === 'apple') return '/perfil/billetera?add=apple';
  if (platform === 'google') return '/perfil/billetera?add=google';
  return '/perfil/billetera';
}
