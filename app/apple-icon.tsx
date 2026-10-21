import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        width="180"
        height="180"
      >
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="accentGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>

        <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bgGrad)" stroke="url(#primaryGrad)" strokeWidth="8" />

        <path
          d="M 256 96 L 376 136 C 376 272 296 368 256 400 C 216 368 136 272 136 136 Z"
          fill="#090d16"
          stroke="url(#primaryGrad)"
          strokeWidth="12"
          strokeLinejoin="round"
        />

        <polygon points="256,150 290,175 290,215 256,240 222,215 222,175" fill="url(#accentGrad)" opacity="0.9" />

        <path
          d="M 256 240 L 256 340 M 222 215 L 180 260 M 290 215 L 332 260"
          stroke="#10b981"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <circle cx="256" cy="340" r="10" fill="#10b981" />
        <circle cx="180" cy="260" r="8" fill="#06b6d4" />
        <circle cx="332" cy="260" r="8" fill="#06b6d4" />

        <path
          d="M 262 260 L 242 295 L 258 295 L 246 325 L 274 285 L 256 285 Z"
          fill="#10b981"
          stroke="#ffffff"
          strokeWidth="2"
        />
      </svg>
    ),
    { ...size }
  );
}
