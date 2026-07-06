import { safeStoreReturnPath } from '@/lib/shop/store-routes';

/** Solo rutas relativas internas — evita open redirect. */
export function safeReturnPath(raw: string | null | undefined): string | null {
  return safeStoreReturnPath(raw);
}