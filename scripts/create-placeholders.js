import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generate() {
  const publicDir = path.resolve('public');
  
  // Create a navy blue square with "PCEG" for the logo placeholder
  const svgLogo = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0B1B33"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="100" font-weight="bold" fill="#C6922E" text-anchor="middle" dominant-baseline="middle">PCEG</text>
      <text x="50%" y="70%" font-family="sans-serif" font-size="30" fill="#FFFFFF" text-anchor="middle">UPLOAD LOGO HERE</text>
    </svg>
  `;

  const svgIcon = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#0B1B33"/>
      <text x="50%" y="50%" font-family="sans-serif" font-size="150" font-weight="bold" fill="#C6922E" text-anchor="middle" dominant-baseline="middle">P</text>
    </svg>
  `;

  await sharp(Buffer.from(svgLogo))
    .png()
    .toFile(path.join(publicDir, 'pceg-logo.png'));

  await sharp(Buffer.from(svgIcon))
    .png()
    .toFile(path.join(publicDir, 'pceg-icone.png'));

  console.log("Placeholders created!");
}

generate().catch(console.error);
