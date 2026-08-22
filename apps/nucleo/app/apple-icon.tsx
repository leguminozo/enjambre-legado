import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#071914',
          position: 'relative',
        }}
      >
        <svg
          width="132"
          height="132"
          viewBox="0 0 192 192"
          fill="none"
        >
          <polygon
            points="96,38 146,67 146,125 96,154 46,125 46,67"
            stroke="#C5A880"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M96 96 C88 80 88 56 96 52 C104 56 104 80 96 96Z"
            fill="#C5A880"
            fillOpacity="0.22"
            stroke="#C5A880"
            strokeWidth="2"
          />
          <path
            d="M96 96 C88 112 88 136 96 140 C104 136 104 112 96 96Z"
            fill="#C5A880"
            fillOpacity="0.22"
            stroke="#C5A880"
            strokeWidth="2"
          />
          <path
            d="M96 96 C80 88 56 88 52 96 C56 104 80 104 96 96Z"
            fill="#C5A880"
            fillOpacity="0.22"
            stroke="#C5A880"
            strokeWidth="2"
          />
          <path
            d="M96 96 C112 88 136 88 140 96 C136 104 112 104 96 96Z"
            fill="#C5A880"
            fillOpacity="0.22"
            stroke="#C5A880"
            strokeWidth="2"
          />
          <circle cx="96" cy="96" r="6" fill="#E2D9C8" />
          <circle cx="96" cy="96" r="10" stroke="#C5A880" strokeWidth="2" />
        </svg>
      </div>
    ),
    {
      ...size,
    },
  );
}
