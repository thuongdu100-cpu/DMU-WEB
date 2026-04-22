/**
 * Favicon Generator Script
 * Converts Logo_PCTU.svg into all required favicon formats
 * Run: node scripts/generate-favicons.mjs
 */
import sharp from '../frontend/node_modules/sharp/lib/index.js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC = join(ROOT, 'frontend', 'public');
const SVG_SOURCE = join(PUBLIC, 'favicon.svg');

// Ensure public directory exists
mkdirSync(PUBLIC, { recursive: true });

const svgBuffer = readFileSync(SVG_SOURCE);

const sizes = [
  { name: 'favicon-16x16.png',          size: 16  },
  { name: 'favicon-32x32.png',          size: 32  },
  { name: 'favicon-48x48.png',          size: 48  },
  { name: 'favicon-64x64.png',          size: 64  },
  { name: 'favicon-96x96.png',          size: 96  },
  { name: 'favicon-128x128.png',        size: 128 },
  { name: 'apple-touch-icon.png',       size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

// Render SVG at 600 DPI so the complex logo is crisp before downscaling.
// Default is 72 DPI which makes small sizes (16x16, 32x32) blurry.
const HIGH_DENSITY = 600;

async function generate() {
  console.log('🎨 Generating favicon PNGs from Logo_PCTU.svg (density=600 DPI)...\n');

  for (const { name, size } of sizes) {
    const outPath = join(PUBLIC, name);
    await sharp(svgBuffer, { density: HIGH_DENSITY })
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
        kernel: sharp.kernel.lanczos3,   // best quality downscale kernel
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(outPath);
    console.log(`  ✅ ${name.padEnd(35)} (${size}x${size})`);
  }

  // Generate favicon-dark.svg and favicon-light.svg (copies with theme hints)
  const svgContent = readFileSync(SVG_SOURCE, 'utf8');
  writeFileSync(join(PUBLIC, 'favicon-light.svg'), svgContent);
  writeFileSync(join(PUBLIC, 'favicon-dark.svg'),  svgContent);
  console.log(`  ✅ favicon-light.svg`);
  console.log(`  ✅ favicon-dark.svg`);

  // Generate favicon.ico using 64x64 at high density for crisp tab display
  const ico64 = await sharp(svgBuffer, { density: HIGH_DENSITY })
    .resize(64, 64, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
  writeFileSync(join(PUBLIC, 'favicon.ico'), ico64);
  console.log(`  ✅ favicon.ico                          (64x64 embedded)`);

  console.log('\n✨ All favicons generated successfully!\n');

  // List all generated files
  const generated = [
    'favicon.svg',
    'favicon-light.svg',
    'favicon-dark.svg',
    'favicon.ico',
    ...sizes.map(s => s.name),
    'site.webmanifest',
  ];

  console.log('📁 Files in frontend/public/:');
  generated.forEach(f => console.log(`   ${f}`));
}

generate().catch(err => {
  console.error('❌ Error generating favicons:', err.message);
  process.exit(1);
});
