// Always-looping animated car with passenger pickup.
// Sized for the homepage hero — larger than CarLoader.

export default function HeroCar() {
  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-[3/1] select-none">
      <svg viewBox="0 0 600 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="carBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00C6E6" />
            <stop offset="100%" stopColor="#00A3C4" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF3C7" />
            <stop offset="100%" stopColor="#FEF3C7" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient sky glow */}
        <rect width="600" height="200" fill="url(#sky)" />
        <circle cx="500" cy="60" r="80" fill="url(#sun)" opacity="0.6" />

        {/* Distant city silhouette */}
        <g opacity="0.15" fill="#0B2B4F">
          <rect x="30" y="120" width="20" height="40" />
          <rect x="60" y="100" width="25" height="60" />
          <rect x="95" y="130" width="18" height="30" />
          <rect x="470" y="110" width="22" height="50" />
          <rect x="500" y="95" width="28" height="65" />
          <rect x="540" y="120" width="20" height="40" />
        </g>

        {/* Road */}
        <rect x="0" y="160" width="600" height="8" rx="4" fill="#cbd5e1" />
        <rect x="0" y="162" width="600" height="4" rx="2" fill="#94a3b8" opacity="0.7" />

        {/* Road dashes — animate to imply motion when car is driving */}
        <g className="road-dashes">
          {[20, 100, 180, 260, 340, 420, 500].map((x) => (
            <rect key={x} x={x} y="163" width="40" height="2" rx="1" fill="#fff" opacity="0.9" />
          ))}
        </g>

        {/* Car */}
        <g className="hero-car">
          <ellipse cx="320" cy="172" rx="120" ry="6" fill="#0B2B4F" opacity="0.12" />

          {/* Body */}
          <path
            d="M180,155 L190,105 Q200,85 235,85 L410,85 Q445,85 455,105 L465,155 Z"
            fill="url(#carBody)"
          />
          {/* Roof */}
          <path
            d="M215,105 Q225,65 265,65 L375,65 Q415,65 425,105 Z"
            fill="#0B2B4F"
          />
          {/* Windows */}
          <path d="M228,102 Q235,75 262,75 L305,75 L305,102 Z" fill="#bae6fd" opacity="0.9" />
          <path d="M312,75 L355,75 Q385,75 392,102 L312,102 Z" fill="#bae6fd" opacity="0.9" />

          {/* Door (opens) */}
          <g className="hero-door" style={{ transformOrigin: "310px 120px" }}>
            <rect x="305" y="102" width="6" height="45" rx="2" fill="#0B2B4F" opacity="0.8" />
            <circle cx="307" cy="125" r="2" fill="#00A3C4" />
          </g>

          {/* Headlight */}
          <rect x="456" y="132" width="10" height="10" rx="3" fill="#fde68a" />
          {/* Headlight beam */}
          <path className="beam" d="M466,137 L520,120 L520,155 Z" fill="#fde68a" opacity="0.35" />

          {/* Taillight */}
          <rect x="178" y="132" width="6" height="10" rx="2" fill="#f43f5e" opacity="0.8" />

          {/* Wheels */}
          <circle cx="235" cy="160" r="16" fill="#0F172A" />
          <circle cx="235" cy="160" r="6" fill="#cbd5e1" className="hero-wheel-front" />
          <circle cx="410" cy="160" r="16" fill="#0F172A" />
          <circle cx="410" cy="160" r="6" fill="#cbd5e1" className="hero-wheel-back" />
        </g>

        {/* Passenger (walks to the door) */}
        <g className="hero-passenger">
          <circle cx="130" cy="105" r="9" fill="#0B2B4F" />
          <rect x="122" y="116" width="16" height="24" rx="4" fill="#00A3C4" />
          <rect x="124" y="140" width="5" height="16" rx="2" fill="#0B2B4F" />
          <rect x="131" y="140" width="5" height="16" rx="2" fill="#0B2B4F" />
        </g>

        {/* Motion lines (appear when car drives) */}
        <g className="motion-lines" opacity="0">
          <rect x="140" y="110" width="30" height="3" rx="1.5" fill="#00A3C4" />
          <rect x="120" y="130" width="40" height="3" rx="1.5" fill="#00A3C4" opacity="0.6" />
          <rect x="150" y="145" width="25" height="3" rx="1.5" fill="#00A3C4" opacity="0.4" />
        </g>
      </svg>

      {/* Bottom shadow */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none" />

      <style>{ `
        /* Car: drives in, stops, waits, drives off. */
        @keyframes hero-car-drive {
          0%    { transform: translateX(-400px); }
          18%   { transform: translateX(0); }
          60%   { transform: translateX(0); }
          100%  { transform: translateX(500px); }
        }
        .hero-car {
          animation: hero-car-drive 6s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          transform-origin: center;
        }

        /* Door: opens after car stops. */
        @keyframes hero-door-open {
          0%, 25%  { transform: rotateY(0deg); }
          35%, 50% { transform: rotateY(-80deg); }
          60%      { transform: rotateY(0deg); }
          100%     { transform: rotateY(0deg); }
        }
        .hero-door {
          animation: hero-door-open 6s ease-in-out infinite;
          transform-style: preserve-3d;
        }

        /* Passenger: hops in, disappears, appears again next loop. */
        @keyframes hero-passenger-hop {
          0%, 25%   { transform: translate(0, 0); opacity: 0; }
          28%       { transform: translate(60px, -15px); opacity: 1; }
          45%       { transform: translate(155px, -12px); opacity: 1; }
          52%       { transform: translate(175px, -15px) scale(0.7); opacity: 0; }
          100%      { transform: translate(175px, -15px) scale(0.7); opacity: 0; }
        }
        .hero-passenger {
          animation: hero-passenger-hop 6s ease-in-out infinite;
        }

        /* Wheels spin while the car is moving. */
        @keyframes hero-wheel-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .hero-wheel-front, .hero-wheel-back {
          transform-origin: center;
          animation: hero-wheel-spin 0.6s linear infinite;
        }

        /* Headlight beam gently pulses */
        @keyframes hero-beam {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 0.5; }
        }
        .beam {
          animation: hero-beam 1.5s ease-in-out infinite;
        }

        /* Motion lines appear when the car drives off */
        @keyframes hero-motion {
          0%, 60%   { opacity: 0; }
          62%, 90%  { opacity: 1; }
          100%      { opacity: 0; }
        }
        .motion-lines {
          animation: hero-motion 6s ease-out infinite;
        }

        /* Road dashes always scroll a little */
        @keyframes hero-dashes {
          from { transform: translateX(0); }
          to   { transform: translateX(-60px); }
        }
        .road-dashes {
          animation: hero-dashes 2s linear infinite;
        }

        /* Accessibility: stop all motion */
        @media (prefers-reduced-motion: reduce) {
          .hero-car, .hero-door, .hero-passenger, .hero-wheel-front,
          .hero-wheel-back, .beam, .motion-lines, .road-dashes {
            animation: none;
          }
          .hero-passenger { opacity: 1; }
        }
      ` }</style>
    </div>
  );
}
