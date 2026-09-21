// ============================================================
// Restore Passenger Animation
// Reverts the passenger keyframes to the original version
// Run from carpool-platform root:
//   node restore-passenger.js
// ============================================================

const fs = require("fs");
const path = require("path");

const filePath = path.resolve("frontend/src/components/HeroCar.jsx");

if (!fs.existsSync(filePath)) {
  console.error("❌ HeroCar.jsx not found. Run this from carpool-platform root.");
  process.exit(1);
}

console.log("\n↩️  Restoring original passenger animation...\n");

let src = fs.readFileSync(filePath, "utf8");

// The original block we want to restore
const originalBlock = `@keyframes hero-passenger-hop {
          0%, 25%   { transform: translate(0, 0); opacity: 0; }
          28%       { transform: translate(60px, -15px); opacity: 1; }
          45%       { transform: translate(155px, -12px); opacity: 1; }
          52%       { transform: translate(175px, -15px) scale(0.7); opacity: 0; }
          100%      { transform: translate(175px, -15px) scale(0.7); opacity: 0; }
        }
        .hero-passenger {
          animation: hero-passenger-hop 6s ease-in-out infinite;
        }`;

// Match whatever current passenger keyframes block exists and replace it
const regex = /@keyframes hero-passenger-hop \{[\s\S]*?\}\s*\.hero-passenger \{[^}]*\}/;

if (regex.test(src)) {
  src = src.replace(regex, originalBlock);
  fs.writeFileSync(filePath, src, "utf8");
  console.log("  ✓ Restored original passenger animation");
  console.log("\n✅ Done!\n");
  console.log("Next steps:");
  console.log("  git add .");
  console.log('  git commit -m "Restore original passenger animation"');
  console.log("  git push\n");
  console.log("  Then hard refresh (Ctrl + Shift + R) on your site.\n");
} else {
  console.log("  ⚠️  Could not find passenger keyframes block in HeroCar.jsx");
  console.log("     Open the file manually and replace the passenger keyframes");
  console.log("     with the version you pasted.\n");
}