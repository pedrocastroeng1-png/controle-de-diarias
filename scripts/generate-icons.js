import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const LOGO_PATH = path.join(PUBLIC_DIR, 'logo.png');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

if (!fs.existsSync(LOGO_PATH)) {
  console.error("❌ logo.png not found in public directory. Please upload it first.");
  process.exit(1);
}

const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 180, 192, 384, 512];

async function generate() {
  console.log("Generating icons...");
  const image = sharp(LOGO_PATH);
  
  for (const size of sizes) {
    if (size <= 48) {
      await image.resize(size, size).toFile(path.join(PUBLIC_DIR, `favicon-${size}x${size}.png`));
    } else {
      await image.resize(size, size).toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
    }
  }
  
  await image.resize(180, 180).toFile(path.join(PUBLIC_DIR, `apple-touch-icon.png`));
  await image.resize(192, 192).toFile(path.join(PUBLIC_DIR, `android-chrome-192x192.png`));
  await image.resize(512, 512).toFile(path.join(PUBLIC_DIR, `android-chrome-512x512.png`));
  
  // Create favicon.ico from 32x32
  await image.resize(32, 32).toFile(path.join(PUBLIC_DIR, `favicon.ico`));
  
  console.log("✅ All icons generated successfully!");
}

generate().catch(console.error);
