import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Registro Apícola de Chiloé — Censo y Defensa Territorial';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#071914',
          backgroundImage: 'radial-gradient(circle at 50% 35%, #0d2f25 0%, #071914 75%)',
          padding: '48px 64px',
          fontFamily: 'serif',
          position: 'relative',
        }}
      >
        {/* Borde sutil dorado */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            right: 20,
            bottom: 20,
            border: '1px solid rgba(197, 168, 128, 0.25)',
            borderRadius: 20,
          }}
        />

        {/* Kicker / Tag superior */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {/* Isotipo Hexagonal en Oro Antiguo */}
          <svg width="40" height="40" viewBox="0 0 192 192" fill="none">
            <polygon
              points="96,38 146,67 146,125 96,154 46,125 46,67"
              stroke="#C5A880"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <circle cx="96" cy="96" r="14" fill="#C5A880" fillOpacity="0.25" stroke="#C5A880" strokeWidth="2" />
            <circle cx="96" cy="96" r="5" fill="#E2D9C8" />
          </svg>
          <span
            style={{
              color: '#C5A880',
              fontSize: 18,
              letterSpacing: '0.28em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Chiloé · Soberanía Territorial
          </span>
        </div>

        {/* Título Principal */}
        <div
          style={{
            color: '#F5F2EB',
            fontSize: 52,
            fontWeight: 700,
            textAlign: 'center',
            lineHeight: 1.15,
            marginBottom: 16,
            maxWidth: 980,
            letterSpacing: '-0.02em',
          }}
        >
          Registro Apícola de Chiloé
        </div>

        {/* Subtítulo / Propuesta de Valor */}
        <div
          style={{
            color: '#A3B8B0',
            fontSize: 22,
            textAlign: 'center',
            lineHeight: 1.4,
            maxWidth: 820,
            marginBottom: 36,
          }}
        >
          Mapa comunitario y defensa de tu zona de pecoreo en el archipiélago.
        </div>

        {/* Pilares / Badges */}
        <div
          style={{
            display: 'flex',
            gap: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(197, 168, 128, 0.12)',
              border: '1px solid rgba(197, 168, 128, 0.35)',
              borderRadius: 30,
              padding: '10px 22px',
              color: '#E2D9C8',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            ✦ Inscripción Gratuita
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(197, 168, 128, 0.12)',
              border: '1px solid rgba(197, 168, 128, 0.35)',
              borderRadius: 30,
              padding: '10px 22px',
              color: '#E2D9C8',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            🛡 Ubicación Protegida
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'rgba(197, 168, 128, 0.12)',
              border: '1px solid rgba(197, 168, 128, 0.35)',
              borderRadius: 30,
              padding: '10px 22px',
              color: '#E2D9C8',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            🌲 Hecho en la Isla
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
