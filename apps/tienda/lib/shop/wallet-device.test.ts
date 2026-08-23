import { describe, expect, it } from 'vitest';
import { billeteraPath, resolveWalletHost } from './wallet-device';

describe('wallet-device', () => {
  it('detecta iOS y Android; el resto es escritorio', () => {
    expect(resolveWalletHost('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)')).toBe('ios');
    expect(resolveWalletHost('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('android');
    expect(resolveWalletHost('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)')).toBe('desktop');
  });

  it('arma la ruta de la billetera para el QR', () => {
    expect(billeteraPath()).toBe('/perfil/billetera');
    expect(billeteraPath('apple')).toBe('/perfil/billetera?add=apple');
  });
});
