/**
 * Flow redirige al comercio con POST (no GET) y Webpay llega con token_ws.
 * Este parser normaliza ambos retornos antes de tocar la sesión o la página.
 */

export const PAYMENT_RETURN_PATHS = new Set([
  '/checkout/resultado',
  '/perfil/reposicion/resultado',
  '/perfil/ritual/resultado',
  '/mis-planes/resultado',
]);

const TOKEN_MAX_LENGTH = 4096;
const BUY_ORDER_MAX_LENGTH = 120;
const TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]+$/;
const BUY_ORDER_PATTERN = /^[A-Za-z0-9._:-]+$/;

export type ProviderName = 'transbank' | 'flow';

export type ParsedProviderReturn = {
  token?: string;
  buyOrder?: string;
  provider?: ProviderName;
  failed: boolean;
};

export function normalizeReturnPath(pathname: string): string {
  if (pathname === '/') return pathname;
  return pathname.replace(/\/+$/, '') || '/';
}

export function isPaymentReturnPath(pathname: string): boolean {
  return PAYMENT_RETURN_PATHS.has(normalizeReturnPath(pathname));
}

function formValue(form: FormData | null, key: string): string | undefined {
  const value = form?.get(key);
  return typeof value === 'string' ? value : undefined;
}

function cleanToken(raw: string | undefined): string | undefined {
  const token = raw?.trim();
  if (!token || token.length > TOKEN_MAX_LENGTH || !TOKEN_PATTERN.test(token)) {
    return undefined;
  }
  return token;
}

function cleanBuyOrder(raw: string | undefined): string | undefined {
  const buyOrder = raw?.trim();
  if (!buyOrder || buyOrder.length > BUY_ORDER_MAX_LENGTH || !BUY_ORDER_PATTERN.test(buyOrder)) {
    return undefined;
  }
  return buyOrder;
}

function cleanProvider(raw: string | null | undefined): ProviderName | undefined {
  return raw === 'transbank' || raw === 'flow' ? raw : undefined;
}

export function parseProviderReturn(
  form: FormData | null,
  search: URLSearchParams,
): ParsedProviderReturn {
  const token = cleanToken(formValue(form, 'token_ws') ?? formValue(form, 'token'));
  const aborted = Boolean(formValue(form, 'TBK_TOKEN'));
  const buyOrder = cleanBuyOrder(
    formValue(form, 'buyOrder') ??
      formValue(form, 'commerceOrder') ??
      formValue(form, 'TBK_ORDEN_COMPRA') ??
      search.get('buyOrder') ??
      undefined,
  );
  const provider = cleanProvider(search.get('provider'));

  return {
    token,
    buyOrder,
    provider,
    failed: !token || aborted || search.get('status') === 'failed',
  };
}
