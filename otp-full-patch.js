// ============================================================
// SYT Car Icon Patch
// Replaces the SYT icon with a car + route design that still
// shows the SYT monogram.
// Run from carpool-platform root:
//   node syt-car-icon-patch.js
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

console.log("\n🚗 Redesigning SYT icon with car...\n");

// ============================================================
// Master SVG — used by favicon, manifest, and <Logo />
// Design: rounded navy square, top-down car silhouette inside a
// teal circle (like a map pin), route line below with SYT text.
// ============================================================
const SYT_CAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="sytBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B2B4F"/>
      <stop offset="100%" stop-color="#1D4A7A"/>
    </linearGradient>
    <linearGradient id="sytMark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00C6E6"/>
      <stop offset="100%" stop-color="#00A3C4"/>
    </linearGradient>
    <radialGradient id="sytGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00C6E6" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#00C6E6" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="64" height="64" rx="16" fill="url(#sytBg)"/>

  <!-- Ambient glow behind the car -->
  <circle cx="32" cy="26" r="22" fill="url(#sytGlow)"/>

  <!-- Route line under the car -->
  <path d="M10 56 Q24 48 40 54 Q54 58 58 52"
        stroke="url(#sytMark)"
        stroke-width="1.6"
        fill="none"
        stroke-linecap="round"
        stroke-dasharray="2.5 3"
        opacity="0.6"/>

  <!-- Green start pin (left of route) -->
  <circle cx="10" cy="56" r="2.2" fill="#10B981"/>
  <!-- Red end pin (right of route) -->
  <circle cx="58" cy="52" r="2.2" fill="#F43F5E"/>

  <!-- Top-down car silhouette, centered -->
  <g transform="translate(32, 26)">
    <!-- Car body -->
    <path d="M -14,0
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
          fill="url(#sytMark)"/>

    <!-- Windshield -->
    <path d="M -6,-4 Q -3,-8 0,-8 Q 3,-8 6,-4 Z" fill="#0B2B4F" opacity="0.55"/>

    <!-- Rear window -->
    <rect x="-6" y="4" width="12" height="3" rx="1.2" fill="#0B2B4F" opacity="0.55"/>

    <!-- Side windows -->
    <rect x="-11" y="-4" width="3" height="5" rx="1" fill="#0B2B4F" opacity="0.45"/>
    <rect x="8" y="-4" width="3" height="5" rx="1" fill="#0B2B4F" opacity="0.45"/>

    <!-- Headlights -->
    <circle cx="-9" cy="-8" r="1.4" fill="#FDE68A"/>
    <circle cx="9" cy="-8" r="1.4" fill="#FDE68A"/>

    <!-- Taillights -->
    <circle cx="-9" cy="8" r="1.2" fill="#F43F5E" opacity="0.85"/>
    <circle cx="9" cy="8" r="1.2" fill="#F43F5E" opacity="0.85"/>
  </g>

  <!-- SYT monogram, top-left badge -->
  <g transform="translate(6, 5)">
    <rect width="18" height="12" rx="3" fill="#00A3C4"/>
    <text x="9" y="9" text-anchor="middle"
          font-family="Inter, Segoe UI, Roboto, system-ui, sans-serif"
          font-size="7" font-weight="800" letter-spacing="-0.2"
          fill="#FFFFFF">SYT</text>
  </g>
</svg>`;

// ============================================================
// 1. Write favicon.svg + icon.svg
// ============================================================
write("public/favicon.svg", SYT_CAR_SVG);
write("public/icon.svg", SYT_CAR_SVG);

// ============================================================
// 2. Manifest (unchanged name/theme, new icon already referenced)
// ============================================================
write("public/manifest.json", JSON.stringify({
  name: "ShareYourTravel",
  short_name: "SYT",
  description: "Community-based vehicle pooling platform",
  start_url: "/",
  display: "standalone",
  background_color: "#0B2B4F",
  theme_color: "#00A3C4",
  orientation: "portrait-primary",
  icons: [
    { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" }
  ]
}, null, 2));

// ============================================================
// 3. Replace the reusable <Logo /> component with the car version
// ============================================================
write("src/components/Logo.jsx", `
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
`);

// ============================================================
// 4. Touch up index.html to be safe (favicon link + apple touch)
// ============================================================
let htmlSrc = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

if (!htmlSrc.includes('href="/favicon.svg"')) {
  htmlSrc = htmlSrc.replace(
    /<link rel="icon"[^>]*>/,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />'
  );
}
if (!htmlSrc.includes("apple-touch-icon")) {
  htmlSrc = htmlSrc.replace(
    /<link rel="icon"[^>]*>/,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n    <link rel="apple-touch-icon" href="/favicon.svg" />'
  );
}
fs.writeFileSync(path.join(ROOT, "index.html"), htmlSrc, "utf8");
console.log("  🔧 Patched: index.html");

console.log("\n✅ SYT car icon applied!\n");
console.log("What changed:");
console.log("  • public/favicon.svg — car + route + SYT badge");
console.log("  • public/icon.svg — same SVG for manifest");
console.log("  • src/components/Logo.jsx — car version");
console.log("  • index.html — favicon + apple-touch-icon");
console.log("");
console.log("Next steps:");
console.log("  git add .");
console.log('  git commit -m "SYT icon: stylized car design"');
console.log("  git push\n");
console.log("  Then hard refresh (Ctrl + Shift + R) in the browser.");
console.log("  Favicons cache hard — close the tab and reopen it.");
console.log("  Also reinstall the PWA (uninstall old, install new) to");
console.log("  see the new icon on your Start Menu.\n");