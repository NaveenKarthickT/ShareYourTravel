// ============================================================
// Passenger Visibility Fix
// Makes the passenger always visible in the HeroCar animation
// Run from carpool-platform root:
//   node passenger-fix.js
// ============================================================

const fs = require("fs");
const path = require("path");

const filePath = path.resolve("frontend/src/components/HeroCar.jsx");

if (!fs.existsSync(filePath)) {
  console.error("❌ HeroCar.jsx not found. Run this from carpool-platform root.");
  process.exit(1);
}

console.log("\n🚶 Fixing passenger visibility...\n");

let src = fs.readFileSync(filePath, "utf8");

// ============================================================
// 1. Replace the passenger keyframes + class
// ============================================================
const oldBlock = `@keyframes hero-passenger-hop {
          0%, 25%   { transform: translate(0, 0); opacity: 0; }
          28%       { transform: translate(60px, -15px); opacity: 1; }
          45%       { transform: translate(155px, -12px); opacity: 1; }
          52%       { transform: translate(175px, -15px) scale(0.7); opacity: 0; }
          100%      { transform: translate(175px, -15px) scale(0.7); opacity: 0; }
        }
        .hero-passenger {
          animation: hero-passenger-hop 6s ease-in-out infinite;
        }`;

const newBlock = `@keyframes hero-passenger-hop {
          0%, 15%   { transform: translate(0, 0); opacity: 1; }
          25%       { transform: translate(60px, -15px); opacity: 1; }
          45%       { transform: translate(155px, -12px); opacity: 1; }
          55%       { transform: translate(170px, -10px) scale(0.88); opacity: 1; }
          60%, 95%  { transform: translate(170px, -8px) scale(0.9); opacity: 1; }
          100%      { transform: translate(170px, -8px) scale(0.9); opacity: 1; }
        }
        .hero-passenger {
          animation: hero-passenger-hop 6s ease-in-out infinite;
          opacity: 1;
        }`;

if (src.includes(oldBlock)) {
  src = src.replace(oldBlock, newBlock);
  console.log("  ✓ Replaced passenger keyframes");
} else {
  // Try a looser match
  const regex = /@keyframes hero-passenger-hop \{[\s\S]*?\}\s*\.hero-passenger \{[^}]*\}/;
  if (regex.test(src)) {
    src = src.replace(regex, newBlock);
    console.log("  ✓ Replaced passenger keyframes (loose match)");
  } else {
    console.log("  ⚠️  Could not find passenger keyframes — will append override");
  }
}

// ============================================================
// 2. Also make sure prefers-reduced-motion keeps opacity 1
// ============================================================
const oldReduced = `.hero-passenger { opacity: 1; }`;
if (!src.includes(oldReduced)) {
  // ensure reduced-motion block still shows the passenger
  src = src.replace(
    /@media \(prefers-reduced-motion: reduce\) \{([\s\S]*?)\}/,
    (match) => {
      if (match.includes(".hero-passenger")) return match;
      return match.replace("}", "  .hero-passenger { opacity: 1; }\n        }");
    }
  );
}

// ============================================================
// 3. Move the passenger group AFTER the car group so it's on top
// ============================================================
const passengerBlockRegex = /(\s*)\{\/\* Passenger \(walks to the door\) \*\/\}\s*<g className="hero-passenger">[\s\S]*?<\/g>/;
const passengerMatch = src.match(passengerBlockRegex);

if (passengerMatch) {
  const passengerMarkup = passengerMatch[0].trim();
  // Remove from current position
  src = src.replace(passengerBlockRegex, "");
  // Insert after the car group (right before motion-lines)
  src = src.replace(
    /(\{\/\* Motion lines[\s\S]*?\*\/\})/,
    passengerMarkup + "\n\n        $1"
  );
  console.log("  ✓ Moved passenger above car (so it's always visible)");
} else {
  console.log("  ⚠️  Could not find passenger SVG block");
}

fs.writeFileSync(filePath, src, "utf8");

console.log("\n✅ Passenger fix applied!\n");
console.log("Next steps:");
console.log("  git add .");
console.log('  git commit -m "Make passenger always visible in hero animation"');
console.log("  git push\n");
console.log("  Then hard refresh (Ctrl + Shift + R) on your site.\n");