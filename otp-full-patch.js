// ============================================================
// Creative Pages Patch
// Adds visual polish to: Login, Register, OTP screens, Dashboard,
// Search, Vehicle details, Trips, Admin, Profile — no logic changes.
// Run from carpool-platform root:
//   node creative-pages-patch.js
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
  console.log("  ✏️  " + path.relative(process.cwd(), full));
};

console.log("\n🎨 Applying creative page polish...\n");

// ============================================================
// 1. NEW: frontend/src/components/PageHeader.jsx
//    Reusable hero-style page header with gradient + icon
// ============================================================
write("src/components/PageHeader.jsx", `
import { Sparkles } from "lucide-react";

export default function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  action,
  accent = "accent",
}) {
  const bgMap = {
    accent: "from-accent-soft via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950",
    primary: "from-primary/5 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950",
  };
  const iconBgMap = {
    accent: "bg-accent-soft dark:bg-slate-800 text-accent",
    primary: "bg-primary/10 dark:bg-slate-800 text-primary dark:text-sky-300",
  };

  return (
    <section className={\`relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br \${bgMap[accent]} mb-8\`}>
      {/* ambient blobs */}
      <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="relative px-6 py-8 sm:px-8 sm:py-10 flex flex-col sm:flex-row sm:items-center gap-5">
        {Icon && (
          <div className={\`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center \${iconBgMap[accent]}\`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {eyebrow && (
            <div className="inline-flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-widest text-accent mb-2">
              <Sparkles className="w-3 h-3" />
              {eyebrow}
            </div>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-primary dark:text-sky-300 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </section>
  );
}
`);

// ============================================================
// 2. NEW: frontend/src/components/AnimatedCard.jsx
//    A card that fades-up on mount with staggered delay
// ============================================================
write("src/components/AnimatedCard.jsx", `
import { useEffect, useRef, useState } from "react";

export default function AnimatedCard({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      ref={ref}
      className={
        "transition-all duration-500 ease-out " +
        (visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2") +
        " " +
        className
      }
    >
      {children}
    </div>
  );
}
`);

// ============================================================
// 3. UPDATE: Login.jsx — polished split screen with gradient
// ============================================================
let loginSrc = fs.readFileSync(path.join(ROOT, "src/pages/Login.jsx"), "utf8");

loginSrc = loginSrc.replace(
  /function BrandPanel\(\) \{[\s\S]*?\n\}\n/,
  `function BrandPanel() {
  return (
    <div className="hidden sm:flex sm:w-2/5 relative overflow-hidden bg-gradient-to-br from-primary via-primary-light to-[#0a2240] text-white p-8 flex-col justify-between">
      {/* Floating ambient blobs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      {/* Floating car icon */}
      <div className="absolute top-1/3 right-6 opacity-10 pointer-events-none">
        <Car className="w-32 h-32" />
      </div>

      <div className="relative flex items-center gap-2 font-bold text-lg">
        <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shadow-inner">
          V
        </span>
        Share Your Vehicle
      </div>

      <div className="relative">
        <h2 className="text-2xl font-bold leading-snug mb-4">
          Ride with people you actually know.
        </h2>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Car className="w-3 h-3" />
            </span>
            <span>Every community runs its own pooling server</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <Users2 className="w-3 h-3" />
            </span>
            <span>Admin-approved, private membership</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-accent/30 flex items-center justify-center shrink-0 mt-0.5">
              <MapPinned className="w-3 h-3" />
            </span>
            <span>Route-based trip search &amp; requests</span>
          </li>
        </ul>
      </div>

      <div className="relative text-white/40 text-xs">
        © {new Date().getFullYear()} Share Your Vehicle
      </div>
    </div>
  );
}
`
);

fs.writeFileSync(path.join(ROOT, "src/pages/Login.jsx"), loginSrc, "utf8");
console.log("  🔧 Login.jsx");

// ============================================================
// 4. UPDATE: Register.jsx — polished split screen
// ============================================================
let regSrc = fs.readFileSync(path.join(ROOT, "src/pages/Register.jsx"), "utf8");

regSrc = regSrc.replace(
  /function BrandPanel\(\) \{[\s\S]*?\n\}\n/,
  `function BrandPanel() {
  return (
    <div className="hidden sm:flex sm:w-2/5 relative overflow-hidden bg-gradient-to-br from-accent to-primary text-white p-8 flex-col justify-between">
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl pointer-events-none" />

      <div className="relative flex items-center gap-2 font-bold text-lg">
        <span className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          V
        </span>
        Share Your Vehicle
      </div>

      <div className="relative">
        <h2 className="text-2xl font-bold leading-snug mb-4">
          Join a private pooling community.
        </h2>
        <ul className="space-y-3 text-sm text-white/85">
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldCheck className="w-3 h-3" />
            </span>
            <span>Verified members only</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <Users2 className="w-3 h-3" />
            </span>
            <span>Admin-approved access</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-0.5">
              <MapPinned className="w-3 h-3" />
            </span>
            <span>Post &amp; find rides instantly</span>
          </li>
        </ul>
      </div>

      <div className="relative text-white/40 text-xs">
        © {new Date().getFullYear()} Share Your Vehicle
      </div>
    </div>
  );
}
`
);

fs.writeFileSync(path.join(ROOT, "src/pages/Register.jsx"), regSrc, "utf8");
console.log("  🔧 Register.jsx");

// ============================================================
// 5. UPDATE: UserDashboard.jsx — PageHeader + AnimatedCard
// ============================================================
let dashSrc = fs.readFileSync(path.join(ROOT, "src/pages/UserDashboard.jsx"), "utf8");

if (!dashSrc.includes("PageHeader")) {
  dashSrc = dashSrc.replace(
    `import { SkeletonGrid, SkeletonStatRow } from "../components/Skeleton.jsx";`,
    `import { SkeletonGrid, SkeletonStatRow } from "../components/Skeleton.jsx";
import PageHeader from "../components/PageHeader.jsx";
import AnimatedCard from "../components/AnimatedCard.jsx";
import { LayoutDashboard } from "lucide-react";`
  );

  // Replace the title block
  dashSrc = dashSrc.replace(
    /<h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Welcome back<\/h1>\s*<p className="text-slate-500 mb-6">\{activeOrg\?\.org\?\.name\} community dashboard<\/p>/,
    `<PageHeader
        icon={LayoutDashboard}
        eyebrow="Dashboard"
        title="Welcome back"
        subtitle={(activeOrg?.org?.name || "Your") + " community dashboard"}
      />`
  );

  // Wrap stat cards in AnimatedCard with stagger
  dashSrc = dashSrc.replace(
    /\{loading \? \(\s*<SkeletonStatRow count=\{3\} \/>\s*\) : \(\s*<div className="grid sm:grid-cols-3 gap-4 mb-8">\s*\{\[\s*\["Confirmed trips", counts\.confirmed, "\/trips\/confirmed"\],\s*\["Pending requests", counts\.requested, "\/trips\/requests"\],\s*\["Completed trips", counts\.completed, "\/trips\/completed"\],\s*\]\.map\(\(\[label, value, to\]\) => \(\s*<Link key=\{label\} to=\{to\}\s*className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-accent hover:shadow-sm transition">\s*<div className="text-3xl font-bold text-primary dark:text-sky-300">\{value\}<\/div>\s*<div className="text-sm text-slate-500 mt-1">\{label\}<\/div>\s*<\/Link>\s*\)\)\}\s*<\/div>\s*\)\}/,
    `{loading ? (
          <SkeletonStatRow count={3} />
        ) : (
          <div className="grid sm:grid-cols-3 gap-4 mb-8">
            {[
              ["Confirmed trips", counts.confirmed, "/trips/confirmed"],
              ["Pending requests", counts.requested, "/trips/requests"],
              ["Completed trips", counts.completed, "/trips/completed"],
            ].map(([label, value, to], i) => (
              <AnimatedCard key={label} delay={i * 80}>
                <Link to={to}
                  className="block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-accent hover:shadow-md hover:-translate-y-0.5 transition">
                  <div className="text-3xl font-bold text-primary dark:text-sky-300">{value}</div>
                  <div className="text-sm text-slate-500 mt-1">{label}</div>
                </Link>
              </AnimatedCard>
            ))}
          </div>
        )}`
  );

  fs.writeFileSync(path.join(ROOT, "src/pages/UserDashboard.jsx"), dashSrc, "utf8");
  console.log("  🔧 UserDashboard.jsx");
} else {
  console.log("  ✓ UserDashboard.jsx already has PageHeader");
}

// ============================================================
// 6. UPDATE: SearchVehicles.jsx — PageHeader
// ============================================================
let searchSrc = fs.readFileSync(path.join(ROOT, "src/pages/SearchVehicles.jsx"), "utf8");

if (!searchSrc.includes("PageHeader")) {
  searchSrc = searchSrc.replace(
    `import CarLoader from "../components/CarLoader.jsx";`,
    `import CarLoader from "../components/CarLoader.jsx";
import PageHeader from "../components/PageHeader.jsx";`
  );

  searchSrc = searchSrc.replace(
    /<h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Search vehicles<\/h1>\s*<p className="text-slate-500 mb-6">Find a pooling trip in \{activeOrg\?\.org\?\.name\}\.<\/p>/,
    `<PageHeader
        icon={SearchIcon}
        eyebrow="Find a ride"
        title="Search vehicles"
        subtitle={"Find a pooling trip in " + (activeOrg?.org?.name || "your community") + "."}
      />`
  );

  fs.writeFileSync(path.join(ROOT, "src/pages/SearchVehicles.jsx"), searchSrc, "utf8");
  console.log("  🔧 SearchVehicles.jsx");
} else {
  console.log("  ✓ SearchVehicles.jsx already has PageHeader");
}

// ============================================================
// 7. UPDATE: TripsList.jsx — PageHeader
// ============================================================
let tripsSrc = fs.readFileSync(path.join(ROOT, "src/pages/TripsList.jsx"), "utf8");

if (!tripsSrc.includes("PageHeader")) {
  tripsSrc = tripsSrc.replace(
    `import { SkeletonList } from "../components/Skeleton.jsx";`,
    `import { SkeletonList } from "../components/Skeleton.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { Route } from "lucide-react";`
  );

  tripsSrc = tripsSrc.replace(
    /<h1 className="text-2xl font-bold mb-6 text-primary dark:text-sky-300">\{title\}<\/h1>/,
    `<PageHeader
        icon={Route}
        eyebrow="Trips"
        title={title}
        subtitle="Everything in one view."
      />`
  );

  fs.writeFileSync(path.join(ROOT, "src/pages/TripsList.jsx"), tripsSrc, "utf8");
  console.log("  🔧 TripsList.jsx");
} else {
  console.log("  ✓ TripsList.jsx already has PageHeader");
}

// ============================================================
// 8. UPDATE: Profile.jsx — PageHeader
// ============================================================
let profSrc = fs.readFileSync(path.join(ROOT, "src/pages/Profile.jsx"), "utf8");

if (!profSrc.includes("PageHeader")) {
  profSrc = profSrc.replace(
    `import { useToast } from "../components/Toast.jsx";`,
    `import { useToast } from "../components/Toast.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { UserCircle2 } from "lucide-react";`
  );

  profSrc = profSrc.replace(
    /<h1 className="text-2xl font-bold text-primary dark:text-sky-300 mb-6">Your profile<\/h1>/,
    `<PageHeader
        icon={UserCircle2}
        eyebrow="Account"
        title="Your profile"
        subtitle="Keep your details up to date so drivers and passengers can reach you."
      />`
  );

  fs.writeFileSync(path.join(ROOT, "src/pages/Profile.jsx"), profSrc, "utf8");
  console.log("  🔧 Profile.jsx");
} else {
  console.log("  ✓ Profile.jsx already has PageHeader");
}

// ============================================================
// 9. UPDATE: PostVehicle.jsx — PageHeader
// ============================================================
let postSrc = fs.readFileSync(path.join(ROOT, "src/pages/PostVehicle.jsx"), "utf8");

if (!postSrc.includes("PageHeader")) {
  postSrc = postSrc.replace(
    `import CityInput from "../components/CityInput.jsx";`,
    `import CityInput from "../components/CityInput.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { PlusCircle } from "lucide-react";`
  );

  postSrc = postSrc.replace(
    /<h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Post a vehicle for pooling<\/h1>\s*<p className="text-slate-500 mb-6">Share your trip so others in <strong>\{activeOrg\?\.org\?\.name\}<\/strong> can join\.<\/p>/,
    `<PageHeader
        icon={PlusCircle}
        eyebrow="New trip"
        title="Post a vehicle for pooling"
        subtitle={"Share your trip so others in " + (activeOrg?.org?.name || "your community") + " can join."}
      />`
  );

  fs.writeFileSync(path.join(ROOT, "src/pages/PostVehicle.jsx"), postSrc, "utf8");
  console.log("  🔧 PostVehicle.jsx");
} else {
  console.log("  ✓ PostVehicle.jsx already has PageHeader");
}

// ============================================================
// 10. UPDATE: AdminDashboard.jsx — PageHeader on Overview
// ============================================================
let adminSrc = fs.readFileSync(path.join(ROOT, "src/pages/AdminDashboard.jsx"), "utf8");

if (!adminSrc.includes("PageHeader")) {
  adminSrc = adminSrc.replace(
    `import { useToast } from "../components/Toast.jsx";`,
    `import { useToast } from "../components/Toast.jsx";
import PageHeader from "../components/PageHeader.jsx";
import { LayoutDashboard as DashIcon } from "lucide-react";`
  );

  adminSrc = adminSrc.replace(
    /<h1 className="text-2xl font-bold mb-1 text-primary dark:text-sky-300">Admin dashboard<\/h1>\s*<p className="text-slate-500">Monitoring \{activeOrg\?\.org\?\.name\}<\/p>/,
    `<PageHeader
        icon={DashIcon}
        eyebrow="Admin"
        title="Admin dashboard"
        subtitle={"Monitoring " + (activeOrg?.org?.name || "your organization")}
        action={
          <Link to="/admin/add-vehicle"
            className="inline-flex items-center gap-1.5 bg-accent text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-[#008fad]">
            <PlusCircle className="w-4 h-4" /> Post a vehicle
          </Link>
        }
      />`
  );

  fs.writeFileSync(path.join(ROOT, "src/pages/AdminDashboard.jsx"), adminSrc, "utf8");
  console.log("  🔧 AdminDashboard.jsx");
} else {
  console.log("  ✓ AdminDashboard.jsx already has PageHeader");
}

// ============================================================
// 11. UPDATE: index.css — add subtle global animations
// ============================================================
let cssSrc = fs.readFileSync(path.join(ROOT, "src/index.css"), "utf8");

if (!cssSrc.includes("fade-up-soft")) {
  cssSrc += `

/* ---------- Creative page animations ---------- */
@keyframes fade-up-soft {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-fade-up {
  animation: fade-up-soft 0.5s ease-out both;
}

/* Gradient text utility */
.text-gradient {
  background: linear-gradient(135deg, #00A3C4 0%, #0B2B4F 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Card hover lift — subtle */
.lift-on-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.lift-on-hover:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px -5px rgb(0 0 0 / 0.1);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .animate-fade-up,
  .lift-on-hover {
    animation: none !important;
    transition: none !important;
  }
}
`;
  fs.writeFileSync(path.join(ROOT, "src/index.css"), cssSrc, "utf8");
  console.log("  🔧 index.css");
} else {
  console.log("  ✓ index.css already has animations");
}

// ============================================================
// 12. REPLACE: Home.jsx — brighter, more visual, still no animation
// ============================================================
write("src/pages/Home.jsx", `
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  Car, Users2, MapPinned, Shield, Wallet, Route, Sparkles, Star,
  Building2, CalendarCheck, ArrowRight,
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  const primaryCTA = user ? "/organizations" : "/register";
  const primaryLabel = user ? "Choose your community" : "Get Started";

  return (
    <div className="overflow-hidden">
      {/* ================= HERO ================= */}
      <section className="relative bg-gradient-to-b from-accent-soft/60 via-white to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="absolute -top-10 right-0 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 pt-16 pb-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-full px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm mb-6 animate-fade-up">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            Verified communities · Admin-approved access
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold leading-tight tracking-tight animate-fade-up">
            <span className="text-primary dark:text-sky-300">Vehicle Pooling,</span>
            <br />
            <span className="text-gradient">Community by Community</span>
          </h1>

          <p className="mt-5 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto animate-fade-up">
            Share Your Vehicle connects people within your residency, tech park or company
            into independent, admin-managed pooling communities.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up">
            <Link to={primaryCTA}
              className="inline-flex items-center gap-2 bg-accent text-white rounded-full px-7 py-3 font-semibold shadow-lg shadow-accent/20 hover:bg-[#008fad] hover:-translate-y-0.5 transition">
              {primaryLabel} <ArrowRight className="w-4 h-4" />
            </Link>
            {!user && (
              <Link to="/login"
                className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-full px-7 py-3 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                Login
              </Link>
            )}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-slate-500 dark:text-slate-400 animate-fade-up">
            <span className="inline-flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-accent" /> Verified members only</span>
            <span className="inline-flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Rating-based trust</span>
            <span className="inline-flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-accent" /> Multi-tenant by design</span>
            <span className="inline-flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-accent" /> Auto trip completion</span>
          </div>
        </div>
      </section>

      {/* ================= HOW IT WORKS ================= */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Simple by design</p>
          <h2 className="text-3xl font-bold text-primary dark:text-sky-300">How it works</h2>
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
            <div key={step.title}
              className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 transition">
              <div className="absolute top-4 right-4 text-5xl font-black text-slate-100 dark:text-slate-800 leading-none select-none">
                {i + 1}
              </div>
              <div className="relative w-11 h-11 rounded-xl bg-accent-soft dark:bg-slate-800 flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <step.icon className="w-5 h-5 text-accent" />
              </div>
              <h3 className="relative font-semibold text-slate-800 dark:text-slate-200 mb-1.5">{step.title}</h3>
              <p className="relative text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= WHY ================= */}
      <section className="bg-primary text-white py-20 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-accent/10 blur-3xl pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Built for real communities</p>
            <h2 className="text-3xl font-bold">Why Share Your Vehicle</h2>
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

      {/* ================= CTA ================= */}
      <section className="max-w-6xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent mb-3">
          <MapPinned className="w-3.5 h-3.5" /> Multi-tenant by design
        </div>
        <h2 className="text-3xl font-bold text-primary dark:text-sky-300 mb-3">
          Every organization gets its own pooling server
        </h2>
        <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
          Independent communities — separate users, admins, vehicles, bookings and chats.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          {["ABC Residency Pooling", "BA IT Park Pooling", "Green Ride Co", "Metro Poolers"].map((name) => (
            <span key={name}
              className="px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 shadow-sm">
              {name}
            </span>
          ))}
        </div>
        <Link to={user ? "/organizations" : "/register"}
          className="inline-flex items-center gap-2 bg-accent text-white rounded-full px-7 py-3 font-semibold shadow-lg shadow-accent/20 hover:bg-[#008fad] hover:-translate-y-0.5 transition">
          Find or create your community <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
`);

console.log("\n✅ Creative page polish applied!\n");
console.log("What changed:");
console.log("  • PageHeader component with gradient hero card + icon");
console.log("  • AnimatedCard with fade-up stagger");
console.log("  • Login/Register: gradient brand panel + ambient blobs");
console.log("  • Homepage: brighter hero + gradient text + floating icons");
console.log("  • New animations in index.css (fade-up, gradient-text, lift)");
console.log("");
console.log("Next steps:");
console.log("  git add .");
console.log('  git commit -m "Add creative polish to all pages"');
console.log("  git push\n");
console.log("  Then hard refresh (Ctrl + Shift + R) on your site.\n");