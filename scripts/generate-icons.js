import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = path.resolve('public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const APP_ICON_PATH = path.join(PUBLIC_DIR, 'icons/celular.png');
const FAVICON_PATH = path.join(PUBLIC_DIR, 'icons/icone.png');

if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

if (!fs.existsSync(APP_ICON_PATH)) {
  console.error("❌ icons/celular.png not found. Please upload it first.");
  process.exit(1);
}

if (!fs.existsSync(FAVICON_PATH)) {
  console.error("❌ icons/icone.png not found. Please upload it first.");
  process.exit(1);
}

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];
const faviconSizes = [16, 32, 48];

async function generate() {
  console.log("Generating icons from celular.png and icone.png...");
  
  const appImage = sharp(APP_ICON_PATH);
  const faviconImage = sharp(FAVICON_PATH);
  
  // 1. Generate Favicons from icone.png
  for (const size of faviconSizes) {
    await faviconImage.resize(size, size).toFile(path.join(PUBLIC_DIR, `favicon-${size}x${size}.png`));
  }
  await faviconImage.resize(32, 32).toFile(path.join(PUBLIC_DIR, `favicon.ico`));

  // 2. Generate PWA App Icons from celular.png
  for (const size of sizes) {
    await appImage.resize(size, size).toFile(path.join(ICONS_DIR, `icon-${size}x${size}.png`));
  }
  
  await appImage.resize(180, 180).toFile(path.join(PUBLIC_DIR, `apple-touch-icon.png`));
  await appImage.resize(192, 192).toFile(path.join(PUBLIC_DIR, `android-chrome-192x192.png`));
  await appImage.resize(512, 512).toFile(path.join(PUBLIC_DIR, `android-chrome-512x512.png`));
  
  console.log("✅ All icons generated successfully!");
}

generate().catch(console.error);
