import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateIcons() {
  const publicDir = path.resolve('public');
  const svgPath = path.join(publicDir, 'logo.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // 1. Standard Icons
  await sharp(Buffer.from(svgContent)).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(Buffer.from(svgContent)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(Buffer.from(svgContent)).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(Buffer.from(svgContent)).resize(64, 64).png().toFile(path.join(publicDir, 'favicon-64.png'));
  await sharp(Buffer.from(svgContent)).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.ico'));

  // 2. Android Adaptive / Maskable Icon (safe zone requires ~10% padding so round icons don't clip helmet)
  const maskableSvg = svgContent.replace(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">',
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 124 124" fill="none"><rect x="-12" y="-12" width="124" height="124" fill="#0F172A"/>'
  );

  await sharp(Buffer.from(maskableSvg)).resize(192, 192).png().toFile(path.join(publicDir, 'icon-maskable-192.png'));
  await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile(path.join(publicDir, 'icon-maskable-512.png'));

  console.log('All icons generated successfully with sharp!');
}

generateIcons().catch(console.error);
