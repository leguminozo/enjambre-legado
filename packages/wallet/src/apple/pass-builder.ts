import type { ApplePassConfig, WalletGuardianSnapshot } from '../types';
import { formatStampMessage } from '../stamp-progress';

export function buildApplePassJson(
  snapshot: WalletGuardianSnapshot,
  serialNumber: string,
  config: ApplePassConfig,
  qrPayload: string,
): Record<string, unknown> {
  const primary = snapshot.programs[0];
  const secondary = snapshot.programs.slice(1, 3);

  return {
    formatVersion: 1,
    passTypeIdentifier: config.passTypeIdentifier,
    teamIdentifier: config.teamIdentifier,
    serialNumber,
    organizationName: config.organizationName,
    description: config.description,
    logoText: config.logoText,
    foregroundColor: config.foregroundColor,
    backgroundColor: config.backgroundColor,
    ...(config.webServiceURL && config.authenticationToken
      ? {
          webServiceURL: config.webServiceURL,
          authenticationToken: config.authenticationToken,
        }
      : {}),
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: qrPayload,
        messageEncoding: 'iso-8859-1',
      },
    ],
    storeCard: {
      primaryFields: [
        {
          key: 'tier',
          label: 'Guardian',
          value: `${snapshot.displayName} · ${snapshot.tier}`,
        },
      ],
      secondaryFields: primary
        ? [
            {
              key: 'prog1',
              label: primary.label,
              value: primary.eligibleForFree
                ? '¡Gratis disponible!'
                : `${primary.accumulated}/${primary.required}`,
            },
          ]
        : [],
      auxiliaryFields: [
        ...secondary.map((p, i) => ({
          key: `prog${i + 2}`,
          label: p.label,
          value: `${p.accumulated}/${p.required}`,
        })),
        {
          key: 'ciclos',
          label: 'Ciclos',
          value: String(snapshot.ciclos),
        },
        {
          key: 'puntos',
          label: 'Puntos',
          value: String(snapshot.puntos),
        },
      ],
      backFields: [
        ...(primary
          ? [
              {
                key: 'msg',
                label: 'Progreso',
                value: formatStampMessage(primary),
              },
            ]
          : []),
        {
          key: 'perfil',
          label: 'Perfil',
          value: 'https://obrerayzangano.com/perfil',
        },
      ],
    },
  };
}

export function isAppleSigningConfigured(env: {
  certBase64?: string;
  teamId?: string;
  passTypeId?: string;
}): boolean {
  return Boolean(env.certBase64 && env.teamId && env.passTypeId);
}