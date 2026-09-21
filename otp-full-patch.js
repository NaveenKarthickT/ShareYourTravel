// ============================================================
// Rename Patch · Velocity Pool → Share Your Vehicle
// Run from carpool-platform root
// ============================================================

const fs = require('fs');
const path = require('path');

const backendDir = path.resolve('backend');
const frontendDir = path.resolve('frontend');

if (!fs.existsSync(backendDir) || !fs.existsSync(frontendDir)) {
  console.error('❌ Run this from inside carpool-platform (must contain backend/ and frontend/)');
  process.exit(1);
}

// Recursively walk a directory and collect files matching extensions
const walk = (dir, exts) => {
  const out = [];
  const recurse = (current) => {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) recurse(full);
      else if (exts.some((ext) => entry.name.endsWith(ext))) out.push(full);
    }
  };
  recurse(dir);
  return out;
};

// Text replacements (order matters — longest first)
const replacements = [
  // "Velocity Pool" → "Share Your Vehicle"
  [/Velocity Pool/g, 'ShareYourVehicle'],
  // lowercase slug versions
  [/velocity-pool/g, 'share-your-vehicle'],
  [/velocitypool/g, 'shareyourvehicle'],
  // "Velocity" alone (only where followed by capital letter of a word)
  [/Velocity(?=[A-Z])/g, 'Share Your '],
];

let touched = 0;
let totalChanges = 0;

const applyToFile = (filePath) => {
  let src = fs.readFileSync(filePath, 'utf8');
  const original = src;
  let changes = 0;

  for (const [pattern, replacement] of replacements) {
    const matches = src.match(pattern);
    if (matches) {
      changes += matches.length;
      src = src.replace(pattern, replacement);
    }
  }

  if (src !== original) {
    fs.writeFileSync(filePath, src, 'utf8');
    touched++;
    totalChanges += changes;
    console.log(`  ✓ ${path.relative(process.cwd(), filePath)} (${changes} change${changes > 1 ? 's' : ''})`);
  }
};

console.log('\n✏️  Renaming "Velocity Pool" → "Share Your Vehicle"...\n');

// Frontend: .jsx, .js, .html, .json, .css
const frontendFiles = walk(frontendDir, ['.jsx', '.js', '.html', '.json', '.css']);
// Backend: .js (emails, comments)
const backendFiles = walk(backendDir, ['.js']);

[...frontendFiles, ...backendFiles].forEach(applyToFile);

console.log(`\n✅ Done — ${totalChanges} replacements across ${touched} files.\n`);

console.log('Next steps:');
console.log('  git add .');
console.log('  git commit -m "Rename: Velocity Pool → ShareYour Vehicle"');
console.log('  git push\n');
console.log('  Vercel auto-deploys both projects in ~30s.\n');
console.log('  ⚠️  Optional: also update these manually for a complete rename:');
console.log('       • Vercel project names (dashboard → project → Settings → Name)');
console.log('       • MongoDB database name if you want consistency');
console.log('       • SMTP "from" name in backend/.env');
console.log('       • GitHub repo name (Settings → Rename)\n');