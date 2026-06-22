import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_MS = 5 * 60 * 1000;

export function signWalletQrToken(
  userId: string,
  secret: string,
  now = Date.now(),
): string {
  const nonce = randomBytes(8).toString('hex');
  const payload = `${userId}|${now}|${nonce}`;
  const sig = createHmac('sha256', secret).update(payload).digest('hex').slice(0, 32);
  return Buffer.from(`${payload}|${sig}`).toString('base64url');
}

export function verifyWalletQrToken(
  token: string,
  secret: string,
  now = Date.now(),
): { ok: true; userId: string } | { ok: false; reason: string } {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 4) return { ok: false, reason: 'invalid_format' };

    const [userId, tsStr, nonce, sig] = parts;
    if (!userId || !tsStr || !nonce || !sig) return { ok: false, reason: 'invalid_format' };

    const ts = Number(tsStr);
    if (!Number.isFinite(ts) || now - ts > TOKEN_TTL_MS) {
      return { ok: false, reason: 'expired' };
    }

    const expected = createHmac('sha256', secret)
      .update(`${userId}|${tsStr}|${nonce}`)
      .digest('hex')
      .slice(0, 32);

    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'bad_signature' };
    }

    return { ok: true, userId };
  } catch {
    return { ok: false, reason: 'invalid_token' };
  }
}