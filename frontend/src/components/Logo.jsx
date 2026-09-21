// Brand logo — top-down car silhouette with SYT badge.
// Used in the navbar, auth pages, and anywhere brand is shown.

export default function Logo({ size = 32, className = "" }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={"shrink-0 " + className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label="ShareYourTravel"
    >
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0B2B4F" />
          <stop offset="100%" stopColor="#1D4A7A" />
        </linearGradient>
        <linearGradient id="logoMark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00C6E6" />
          <stop offset="100%" stopColor="#00A3C4" />
        </linearGradient>
        <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00C6E6" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#00C6E6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Background */}
      <rect width="64" height="64" rx="16" fill="url(#logoBg)" />

      {/* Ambient glow behind the car */}
      <circle cx="32" cy="26" r="22" fill="url(#logoGlow)" />

      {/* Route line under the car */}
      <path
        d="M10 56 Q24 48 40 54 Q54 58 58 52"
        stroke="url(#logoMark)"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2.5 3"
        opacity="0.6"
      />
      <circle cx="10" cy="56" r="2.2" fill="#10B981" />
      <circle cx="58" cy="52" r="2.2" fill="#F43F5E" />

      {/* Top-down car */}
      <g transform="translate(32, 26)">
        <path
          d="M -14,0
             Q -14,-7 -9,-9
             L -6,-9
             Q -4,-14 0,-14
             Q 4,-14 6,-9
             L 9,-9
             Q 14,-7 14,0
             L 14,6
             Q 14,9 11,9
             L -11,9
             Q -14,9 -14,6 Z"
          fill="url(#logoMark)"
        />
        <path d="M -6,-4 Q -3,-8 0,-8 Q 3,-8 6,-4 Z" fill="#0B2B4F" opacity="0.55" />
        <rect x="-6" y="4" width="12" height="3" rx="1.2" fill="#0B2B4F" opacity="0.55" />
        <rect x="-11" y="-4" width="3" height="5" rx="1" fill="#0B2B4F" opacity="0.45" />
        <rect x="8" y="-4" width="3" height="5" rx="1" fill="#0B2B4F" opacity="0.45" />
        <circle cx="-9" cy="-8" r="1.4" fill="#FDE68A" />
        <circle cx="9" cy="-8" r="1.4" fill="#FDE68A" />
        <circle cx="-9" cy="8" r="1.2" fill="#F43F5E" opacity="0.85" />
        <circle cx="9" cy="8" r="1.2" fill="#F43F5E" opacity="0.85" />
      </g>

      {/* SYT badge */}
      <g transform="translate(6, 5)">
        <rect width="18" height="12" rx="3" fill="#00A3C4" />
        <text
          x="9"
          y="9"
          textAnchor="middle"
          fontFamily="Inter, Segoe UI, Roboto, system-ui, sans-serif"
          fontSize="7"
          fontWeight="800"
          letterSpacing="-0.2"
          fill="#FFFFFF"
        >
          SYT
        </text>
      </g>
    </svg>
  );
}
