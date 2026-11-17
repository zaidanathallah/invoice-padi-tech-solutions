const fs = require('fs');
const path = require('path');

// Ensure directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Minimal valid transparent/colored 1x1 PNG expanded or simple SVG-based PNG placeholder
// A valid 1x1 blue PNG buffer
const minimalPngBuffer = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), minimalPngBuffer);
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), minimalPngBuffer);
fs.writeFileSync(path.join(iconsDir, 'icon-512-maskable.png'), minimalPngBuffer);

console.log('PWA Icon placeholders generated in public/icons/');
