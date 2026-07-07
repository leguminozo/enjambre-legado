import type { WalletGuardianSnapshot } from '../types';

export type GoogleWalletEnv = {
  issuerId?: string;
  serviceAccountEmail?: string;
  privateKey?: string;
  serviceAccountJson?: string;
};

export function isGoogleWalletConfigured(env: GoogleWalletEnv): boolean {
  return Boolean(env.issuerId && env.serviceAccountEmail);
}

/** Save to Wallet requiere firma JWT con service account — no basta issuer + email. */
export function isGoogleWalletSigningReady(env: GoogleWalletEnv): boolean {
  return Boolean(
    isGoogleWalletConfigured(env) &&
      (env.privateKey?.trim() || env.serviceAccountJson?.trim()),
  );
}

/** Stub JWT payload — firma real requiere service account en servidor. */
export function buildGoogleSavePayload(
  snapshot: WalletGuardianSnapshot,
  issuerId: string,
): Record<string, unknown> {
  const objectId = `${issuerId}.${snapshot.userId.replace(/-/g, '_')}`;
  const primary = snapshot.programs[0];

  return {
    iss: 'oyz-wallet-stub',
    aud: 'google',
    typ: 'savetowallet',
    payload: {
      loyaltyObjects: [
        {
          id: objectId,
          classId: `${issuerId}.oyz_guardian`,
          state: 'ACTIVE',
          accountName: snapshot.displayName,
          accountId: snapshot.userId,
          loyaltyPoints: primary
            ? {
                label: primary.label,
                balance: { int: primary.accumulated },
              }
            : undefined,
          secondaryLoyaltyPoints: primary
            ? {
                label: 'Meta',
                balance: { int: primary.required },
              }
            : undefined,
          textModulesData: [
            { header: 'Tier', body: snapshot.tier },
            { header: 'Ciclos', body: String(snapshot.ciclos) },
          ],
        },
      ],
    },
  };
}

export function buildGoogleSaveUrl(jwt: string): string {
  return `https://pay.google.com/gp/v/save/${jwt}`;
}