// ============================================================
// Homepage Redesign Patch
// 1. Creates HeroCar.jsx — a looping animated car (always visible)
// 2. Rewrites Home.jsx with a richer hero + sections
// Run from carpool-platform root:
//   node homepage-patch.js
// ============================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("frontend");
if (!fs.existsSync(ROOT)) {
  console.error("❌ Run this from the carpool-platform root (must contain frontend/).");
  process.exit(1);
}

const write = (relPath, content) => {
  const full = path.join(ROOT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content.replace(/^\n/, ""), "utf8");
  console.log("  ✏️  Wrote: " + path.relative(process.cwd(), full));
};

console.log("\n🎨 Redesigning homepage with animated hero...\n");

// ============================================================
// 1. NEW: frontend/src/components/HeroCar.jsx
//    A larger, always-looping hero car animation.
// ============================================================
write("src/components/HeroCar.jsx", `
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

        {/* Passenger (walks to the door) */}
        <g className="hero-passenger">
          <circle cx="130" cy="105" r="9" fill="#0B2B4F" />
          <rect x="122" y="116" width="16" height="24" rx="4" fill="#00A3C4" />
          <rect x="124" y="140" width="5" height="16" rx="2" fill="#0B2B4F" />
          <rect x="131" y="140" width="5" height="16" rx="2" fill="#0B2B4F" />
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

        {/* Motion lines (appear when car drives) */}
        <g className="motion-lines" opacity="0">
          <rect x="140" y="110" width="30" height="3" rx="1.5" fill="#00A3C4" />
          <rect x="120" y="130" width="40" height="3" rx="1.5" fill="#00A3C4" opacity="0.6" />
          <rect x="150" y="145" width="25" height="3" rx="1.5" fill="#00A3C4" opacity="0.4" />
        </g>
      </svg>

      {/* Bottom shadow */}
      <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-slate-950 to-transparent pointer-events-none" />

      <style>{ \`
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
      \` }</style>
    </div>
  );
}
`);

// ============================================================
// 2. REPLACE: frontend/src/pages/Home.jsx
// ============================================================
write("src/pages/Home.jsx", `
import { Link } from "react-router-dom";
import {
  Car, Users2, MapPinned, Shield, Wallet, Route,
  ArrowRight, Sparkles, Star, Building2, CalendarCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import HeroCar from "../components/HeroCar.jsx";

export default function Home() {
  const { user } = useAuth();

  const primaryCTA = user ? "/organizations" : "/register";
  const primaryLabel = user ? "Choose your community" : "Get Started";

  return (
    <div className="overflow-hidden">
      {/* ================= HERO ================= */}
      <section className="relative bg-gradient-to-b from-accent-soft/60 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        {/* Ambient blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-10 text-center">
          {/* Pill */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm mb-6">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Now with email verification & admin-approved communities
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-primary dark:text-sky-300 leading-tight tracking-tight">
            Vehicle Pooling,
            <br className="hidden sm:block" />
            <span className="text-accent"> Community by Community</span>
          </h1>

          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            ShareYourVehicle connects people within your residency, tech park or company into
            independent, admin-managed pooling communities.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to={primaryCTA}
              className="inline-flex items-center gap-2 bg-accent text-white rounded-full px-7 py-3 font-semibold shadow-lg shadow-accent/20 hover:bg-[#008fad] hover:-translate-y-0.5 transition"
            >
              {primaryLabel} <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link
                to="/login"
                className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full px-7 py-3 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                Login
              </Link>
            )}
          </div>

          {/* Hero animation */}
          <div className="mt-12">
            <HeroCar />
          </div>

          {/* Trust strip */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent" /> Verified members only
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Rating-based trust
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-accent" /> Multi-tenant by design
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-accent" /> Auto trip completion
            </span>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
            Simple by design
          </p>
          <h2 className="text-3xl font-bold text-primary dark:text-sky-300">
            How it works
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl mx-auto">
            Four easy steps from discovering a community to rating your ride.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
          {[
            { icon: Building2, title: "Pick a community", body: "Join a pooling server for your residency or workplace — or start your own." },
            { icon: Shield, title: "Get approved", body: "The community admin reviews and approves your membership request." },
            { icon: Car, title: "Post or search", body: "Offer a seat in your vehicle, or search trips others have posted." },
            { icon: Star, title: "Ride & rate", body: "Book a seat, complete the trip, and leave feedback for the driver." },
          ].map((step, i) => (
            <div
              key={step.title}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-accent/40 transition"
            >
              <div className="absolute top-4 right-4 text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">
                {i + 1}
              </div>
              <div className="relative w-11 h-11 rounded-xl bg-accent-soft dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <step.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="relative font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                {step.title}
              </h3>
              <p className="relative text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= WHY CHOOSE US ================= */}
      <section className="bg-primary text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">
              Built for real communities
            </p>
            <h2 className="text-3xl font-bold">Why ShareYourVehicle</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { icon: Wallet, title: "Save money", body: "Split fuel and toll costs with people on the same route." },
              { icon: Route, title: "Cut congestion", body: "Fewer cars on the road for the same daily commute." },
              { icon: Users2, title: "Ride with your community", body: "Each organization runs its own private, admin-moderated pool." },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-4 backdrop-blur">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= ORGANIZATIONS ================= */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent mb-3">
          <MapPinned className="w-3.5 h-3.5" /> Multi-tenant by design
        </div>
        <h2 className="text-3xl font-bold text-primary dark:text-sky-300 mb-3">
          Every organization gets its own pooling server
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
          Independent communities — separate users, admins, vehicles, bookings and chats.
          Pick one that fits you, or create your own in seconds.
        </p>

        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {["ABC Residency Pooling", "BA IT Park Pooling", "Green Ride Co", "Metro Poolers"].map((name) => (
            <span
              key={name}
              className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm"
            >
              {name}
            </span>
          ))}
        </div>

        <Link
          to={user ? "/organizations" : "/register"}
          className="inline-flex items-center gap-2 bg-accent text-white rounded-full px-7 py-3 font-semibold shadow-lg shadow-accent/20 hover:bg-[#008fad] hover:-translate-y-0.5 transition"
        >
          Find or create your community <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      {/* ================= FOOTER CTA ================= */}
      <section className="bg-gradient-to-r from-accent-soft to-white dark:from-slate-900 dark:to-slate-950 py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary dark:text-sky-300">
            Ready to share your ride?
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-3 mb-6">
            Join thousands pooling together — one community at a time.
          </p>
          <Link
            to={primaryCTA}
            className="inline-flex items-center gap-2 bg-accent text-white rounded-full px-7 py-3 font-semibold shadow-lg shadow-accent/20 hover:bg-[#008fad] hover:-translate-y-0.5 transition"
          >
            {primaryLabel} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-xs">
              V
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              ShareYourVehicle
            </span>
          </div>
          <div className="text-xs">
            © {new Date().getFullYear()} ShareYourVehicle. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
`);

console.log("\n✅ Homepage redesign applied!\n");
console.log("Next steps:");
console.log("  git add .");
console.log('  git commit -m "Redesign homepage with animated hero car"');
console.log("  git push\n");
console.log("  Then hard refresh (Ctrl + Shift + R) on your site.\n");