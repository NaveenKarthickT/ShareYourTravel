// ============================================================
// SYT Creative Icon Patch
// Monogram: SYT (ShareYourTravel)
// Run from carpool-platform root:
//   node syt-icon-patch.js
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

const patch = (relPath, edits) => {
  const full = path.join(ROOT, relPath);
  if (!fs.existsSync(full)) {
    console.log("  ⚠️  Missing: " + relPath);
    return;
  }
  let src = fs.readFileSync(full, "utf8");
  let changed = 0;
  for (const [find, replace] of edits) {
    if (!src.includes(find)) continue;
    src = src.replace(find, replace);
    changed++;
  }
  if (changed) {
    fs.writeFileSync(full, src, "utf8");
    console.log("  🔧 Patched: " + relPath + ` (${changed})`);
  }
};

console.log("\n🎨 Creating SYT creative icon (ShareYourTravel)...\n");

// ============================================================
// 1. Favicon SVG (with SYT monogram)
// ============================================================
const SYT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
  <defs>
    <linearGradient id="sytBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0B2B4F"/>
      <stop offset="100%" stop-color="#1D4A7A"/>
    </linearGradient>
    <linearGradient id="sytMark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00C6E6"/>
      <stop offset="100%" stop-color="#00A3C4"/>
    </linearGradient>
  </defs>

  <rect width="64" height="64" rx="16" fill="url(#sytBg)"/>

  <path d="M8 42 Q22 24 36 34 Q50 44 56 30"
        stroke="url(#sytMark)"
        stroke-width="2.5"
        fill="none"
        stroke-linecap="round"
        stroke-dasharray="3 3"
        opacity="0.55"/>

  <circle cx="10" cy="44" r="3" fill="#10B981"/>
  <circle cx="54" cy="28" r="3" fill="#F43F5E"/>

  <text x="32" y="40" text-anchor="middle"
        font-family="Inter, Segoe UI, Roboto, system-ui, sans-serif"
        font-size="20" font-weight="800" letter-spacing="-0.5"
        fill="url(#sytMark)">SYT</text>
</svg>`;

write("public/favicon.svg", SYT_SVG);
write("public/icon.svg", SYT_SVG);

// ============================================================
// 2. index.html — favicon + apple-touch + manifest link
// ============================================================
let htmlSrc = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

htmlSrc = htmlSrc.replace(
  /<link rel="icon"[^>]*>/,
  '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />'
);

if (!htmlSrc.includes("apple-touch-icon")) {
  htmlSrc = htmlSrc.replace(
    /<link rel="icon"[^>]*>/,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n    <link rel="apple-touch-icon" href="/favicon.svg" />'
  );
}

if (!htmlSrc.includes('rel="manifest"')) {
  htmlSrc = htmlSrc.replace(
    /<\/head>/,
    '  <link rel="manifest" href="/manifest.json" />\n  </head>'
  );
}

// Update <title> to ShareYourTravel
htmlSrc = htmlSrc.replace(
  /<title>[^<]*<\/title>/,
  "<title>ShareYourTravel · Vehicle Pooling Platform</title>"
);

fs.writeFileSync(path.join(ROOT, "index.html"), htmlSrc, "utf8");
console.log("  🔧 Patched: index.html");

// ============================================================
// 3. manifest.json — SYT + ShareYourTravel
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
// 4. Reusable <Logo /> component (SYT)
// ============================================================
write("src/components/Logo.jsx", `
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
`);

// ============================================================
// 5. Navbar.jsx — replace old V square with <Logo />
// ============================================================
let navSrc = fs.readFileSync(path.join(ROOT, "src/components/Navbar.jsx"), "utf8");

if (!navSrc.includes('import Logo')) {
  navSrc = navSrc.replace(
    /import NotificationBell from "\.\/NotificationBell\.jsx";/,
    'import NotificationBell from "./NotificationBell.jsx";\nimport Logo from "./Logo.jsx";'
  );
}

// Any of the previous V squares
navSrc = navSrc.replace(
  /<span className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center">[\s\S]*?<\/span>/,
  '<Logo size={32} />'
);
navSrc = navSrc.replace(
  /<span className="w-8 h-8 rounded-lg bg-white\/15 flex items-center justify-center">\s*V\s*<\/span>/,
  '<Logo size={32} />'
);
navSrc = navSrc.replace(
  /<span className="w-9 h-9 rounded-xl bg-white\/15 backdrop-blur flex items-center justify-center shadow-inner">\s*V\s*<\/span>/,
  '<Logo size={36} />'
);

// Rename any "Share Your Vehicle" text to "ShareYourTravel" in navbar
navSrc = navSrc.replace(/Share Your Vehicle/g, "ShareYourTravel");

fs.writeFileSync(path.join(ROOT, "src/components/Navbar.jsx"), navSrc, "utf8");
console.log("  🔧 Patched: Navbar.jsx");

// ============================================================
// 6. Login.jsx — Logo + rename
// ============================================================
let loginSrc = fs.readFileSync(path.join(ROOT, "src/pages/Login.jsx"), "utf8");

if (!loginSrc.includes('import Logo')) {
  loginSrc = loginSrc.replace(
    /import { useAuth } from "\.\.\/context\/AuthContext\.jsx";/,
    'import { useAuth } from "../context/AuthContext.jsx";\nimport Logo from "../components/Logo.jsx";'
  );
}

loginSrc = loginSrc.replace(
  /<span className="w-9 h-9 rounded-xl bg-white\/15 backdrop-blur flex items-center justify-center shadow-inner">\s*V\s*<\/span>/,
  '<Logo size={36} />'
);
loginSrc = loginSrc.replace(
  /<span className="w-8 h-8 rounded-lg bg-white\/15 flex items-center justify-center">\s*V\s*<\/span>/,
  '<Logo size={32} />'
);
loginSrc = loginSrc.replace(/Share Your Vehicle/g, "ShareYourTravel");

fs.writeFileSync(path.join(ROOT, "src/pages/Login.jsx"), loginSrc, "utf8");
console.log("  🔧 Patched: Login.jsx");

// ============================================================
// 7. Register.jsx — Logo + rename
// ============================================================
let regSrc = fs.readFileSync(path.join(ROOT, "src/pages/Register.jsx"), "utf8");

if (!regSrc.includes('import Logo')) {
  regSrc = regSrc.replace(
    /import { useAuth } from "\.\.\/context\/AuthContext\.jsx";/,
    'import { useAuth } from "../context/AuthContext.jsx";\nimport Logo from "../components/Logo.jsx";'
  );
}

regSrc = regSrc.replace(
  /<span className="w-9 h-9 rounded-xl bg-white\/15 backdrop-blur flex items-center justify-center">\s*V\s*<\/span>/,
  '<Logo size={36} />'
);
regSrc = regSrc.replace(
  /<span className="w-8 h-8 rounded-lg bg-white\/15 flex items-center justify-center">\s*V\s*<\/span>/,
  '<Logo size={32} />'
);
regSrc = regSrc.replace(
  /<span className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center text-xl font-bold mb-3">V<\/span>/,
  '<div className="mb-3"><Logo size={48} /></div>'
);
regSrc = regSrc.replace(/Share Your Vehicle/g, "ShareYourTravel");

fs.writeFileSync(path.join(ROOT, "src/pages/Register.jsx"), regSrc, "utf8");
console.log("  🔧 Patched: Register.jsx");

console.log("\n✅ SYT creative icon applied!\n");
console.log("Next steps:");
console.log("  git add .");
console.log('  git commit -m "SYT creative icon + rename to ShareYourTravel"');
console.log("  git push\n");
console.log("  Then hard refresh (Ctrl + Shift + R) in the browser.");
console.log("  Close and reopen the tab to refresh the favicon cache.\n");