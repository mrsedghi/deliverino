/**
 * Script to generate PWA icons from a source image
 * 
 * Usage:
 * 1. Place a 512x512 source image at public/icon-source.png
 * 2. Run: node scripts/generate-icons.js
 * 
 * Or use an online tool like:
 * - https://www.pwabuilder.com/imageGenerator
 * - https://realfavicongenerator.net/
 */

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

console.log('PWA Icon Generator');
console.log('==================');
console.log('');
console.log('To generate PWA icons, you can:');
console.log('1. Use an online tool: https://www.pwabuilder.com/imageGenerator');
console.log('2. Create icons manually using an image editor');
console.log('3. Use a tool like ImageMagick or Sharp');
console.log('');
console.log('Required icon sizes:');
sizes.forEach(size => {
  console.log(`  - icon-${size}x${size}.png (${size}x${size}px)`);
});
console.log('');
console.log('Place all icons in the public/ directory.');
console.log('The manifest.json is already configured to use these icons.');

