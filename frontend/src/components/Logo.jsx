// Brand logo — SYT monogram inside a rounded square, with the
// route-line motif shared across the app.

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
      </defs>

      <rect width="64" height="64" rx="16" fill="url(#logoBg)" />

      <path
        d="M8 42 Q22 24 36 34 Q50 44 56 30"
        stroke="url(#logoMark)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="3 3"
        opacity="0.55"
      />
      <circle cx="10" cy="44" r="3" fill="#10B981" />
      <circle cx="54" cy="28" r="3" fill="#F43F5E" />

      <text
        x="32"
        y="40"
        textAnchor="middle"
        fontFamily="Inter, Segoe UI, Roboto, system-ui, sans-serif"
        fontSize="20"
        fontWeight="800"
        letterSpacing="-0.5"
        fill="url(#logoMark)"
      >
        SYT
      </text>
    </svg>
  );
}
