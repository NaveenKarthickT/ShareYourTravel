// Animated car loading screen — car drives in, door opens,
// passenger hops in, door closes, car drives off. Loops.

export default function CarLoader({ message = "Starting your ride" }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        {/* ---------- SVG scene ---------- */}
        <div className="relative w-[340px] h-[140px] mx-auto">
          <svg viewBox="0 0 340 140" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Road */}
            <rect x="0" y="112" width="340" height="6" rx="3" fill="#cbd5e1" className="dark:fill-slate-700" />
            {[20, 80, 140, 200, 260].map((x) => (
              <rect key={x} x={x} y="114" width="30" height="2" rx="1" fill="#94a3b8" />
            ))}

            {/* Passenger */}
            <g className="passenger">
              <circle cx="60" cy="70" r="7" fill="#0B2B4F" />
              <rect x="54" y="78" width="12" height="20" rx="3" fill="#00A3C4" />
              <rect x="55" y="98" width="4" height="12" rx="2" fill="#0B2B4F" />
              <rect x="61" y="98" width="4" height="12" rx="2" fill="#0B2B4F" />
            </g>

            {/* Car */}
            <g className="car">
              <ellipse cx="180" cy="118" rx="80" ry="4" fill="#000" opacity="0.08" />
              <path d="M100,95 L105,65 Q110,55 130,55 L210,55 Q230,55 235,65 L240,95 Z" fill="#00A3C4" />
              <path d="M118,65 Q122,45 145,45 L195,45 Q218,45 222,65 Z" fill="#0B2B4F" />
              <path d="M126,63 Q130,51 148,51 L168,51 L168,63 Z" fill="#bae6fd" opacity="0.85" />
              <path d="M172,51 L192,51 Q210,51 214,63 L172,63 Z" fill="#bae6fd" opacity="0.85" />
              <g className="door" style={{ transformOrigin: "168px 68px" }}>
                <rect x="168" y="63" width="4" height="28" rx="1" fill="#0B2B4F" />
              </g>
              <rect x="236" y="80" width="6" height="6" rx="2" fill="#fde68a" />
              <rect x="98" y="80" width="4" height="6" rx="2" fill="#f43f5e" opacity="0.7" />
              <circle cx="130" cy="100" r="10" fill="#0F172A" />
              <circle cx="130" cy="100" r="4" fill="#cbd5e1" className="wheel-front" />
              <circle cx="210" cy="100" r="10" fill="#0F172A" />
              <circle cx="210" cy="100" r="4" fill="#cbd5e1" className="wheel-back" />
            </g>
          </svg>
        </div>

        {/* Loading text */}
        <div className="mt-6 flex items-center justify-center gap-1">
          <span className="text-slate-600 dark:text-slate-400 text-sm font-medium">{message}</span>
          <span className="dots text-slate-500 dark:text-slate-500 text-sm">
            <span>.</span><span>.</span><span>.</span>
          </span>
        </div>
      </div>

      <style>{ `
        @keyframes car-drive-in {
          0%   { transform: translateX(-260px); }
          15%  { transform: translateX(0); }
          55%  { transform: translateX(0); }
          100% { transform: translateX(360px); }
        }
        @keyframes door-open {
          0%, 20%   { transform: rotateY(0deg); }
          30%, 45%  { transform: rotateY(-75deg); }
          55%       { transform: rotateY(0deg); }
          100%      { transform: rotateY(0deg); }
        }
        @keyframes passenger-hop {
          0%, 22%   { transform: translate(0, 0) scale(1); opacity: 1; }
          35%       { transform: translate(70px, -12px) scale(1.05); }
          48%       { transform: translate(105px, -10px) scale(0.9); opacity: 1; }
          50%, 100% { transform: translate(105px, -10px) scale(0.5); opacity: 0; }
        }
        @keyframes wheel-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes dot-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30%           { transform: translateY(-4px); opacity: 1; }
        }
        .car { animation: car-drive-in 4.6s cubic-bezier(0.5, 0, 0.5, 1) infinite; }
        .door { animation: door-open 4.6s ease-in-out infinite; transform-style: preserve-3d; }
        .passenger { animation: passenger-hop 4.6s ease-in-out infinite; opacity: 0; }
        .wheel-front, .wheel-back { transform-origin: center; animation: wheel-spin 0.9s linear infinite; }
        .dots span { display: inline-block; animation: dot-bounce 1.4s infinite; }
        .dots span:nth-child(2) { animation-delay: 0.2s; }
        .dots span:nth-child(3) { animation-delay: 0.4s; }
        @media (prefers-reduced-motion: reduce) {
          .car, .door, .passenger, .wheel-front, .wheel-back, .dots span { animation: none; }
          .passenger { opacity: 1; }
        }
      ` }</style>
    </div>
  );
}
