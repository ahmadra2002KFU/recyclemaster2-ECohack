const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SOURCE_IMAGE = path.join(__dirname, '..', 'assets', 'logo.png');
const ANDROID_RES = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Android icon sizes
const ANDROID_ICONS = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

// Foreground sizes for adaptive icons (need to be larger with padding)
const ANDROID_FOREGROUND = [
  { folder: 'mipmap-mdpi', size: 108 },
  { folder: 'mipmap-hdpi', size: 162 },
  { folder: 'mipmap-xhdpi', size: 216 },
  { folder: 'mipmap-xxhdpi', size: 324 },
  { folder: 'mipmap-xxxhdpi', size: 432 },
];

async function generateIcons() {
  console.log('Generating icons from:', SOURCE_IMAGE);

  if (!fs.existsSync(SOURCE_IMAGE)) {
    console.error('Error: Source image not found at', SOURCE_IMAGE);
    console.log('Please save your logo as "logo.png" in the assets folder.');
    process.exit(1);
  }

  // Ensure public directory exists
  if (!fs.existsSync(PUBLIC_DIR)) {
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  // Generate web favicon (multiple sizes)
  console.log('Generating web favicons...');

  await sharp(SOURCE_IMAGE)
    .resize(32, 32)
    .toFile(path.join(PUBLIC_DIR, 'favicon-32x32.png'));

  await sharp(SOURCE_IMAGE)
    .resize(16, 16)
    .toFile(path.join(PUBLIC_DIR, 'favicon-16x16.png'));

  await sharp(SOURCE_IMAGE)
    .resize(180, 180)
    .toFile(path.join(PUBLIC_DIR, 'apple-touch-icon.png'));

  await sharp(SOURCE_IMAGE)
    .resize(192, 192)
    .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));

  await sharp(SOURCE_IMAGE)
    .resize(512, 512)
    .toFile(path.join(PUBLIC_DIR, 'icon-512.png'));

  // Generate ICO file (favicon.ico)
  await sharp(SOURCE_IMAGE)
    .resize(48, 48)
    .toFile(path.join(PUBLIC_DIR, 'favicon.png'));

  console.log('Web favicons generated!');

  // Generate Android icons
  console.log('Generating Android icons...');

  for (const icon of ANDROID_ICONS) {
    const outputPath = path.join(ANDROID_RES, icon.folder, 'ic_launcher.png');
    await sharp(SOURCE_IMAGE)
      .resize(icon.size, icon.size)
      .toFile(outputPath);
    console.log(`  Created ${icon.folder}/ic_launcher.png (${icon.size}x${icon.size})`);

    // Also create round version
    const roundPath = path.join(ANDROID_RES, icon.folder, 'ic_launcher_round.png');
    await sharp(SOURCE_IMAGE)
      .resize(icon.size, icon.size)
      .toFile(roundPath);
    console.log(`  Created ${icon.folder}/ic_launcher_round.png (${icon.size}x${icon.size})`);
  }

  // Generate foreground icons for adaptive icons
  for (const icon of ANDROID_FOREGROUND) {
    const outputPath = path.join(ANDROID_RES, icon.folder, 'ic_launcher_foreground.png');

    // Create foreground with padding (icon centered in larger canvas)
    const iconSize = Math.round(icon.size * 0.6); // Icon takes 60% of the space
    const padding = Math.round((icon.size - iconSize) / 2);

    await sharp(SOURCE_IMAGE)
      .resize(iconSize, iconSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(outputPath);
    console.log(`  Created ${icon.folder}/ic_launcher_foreground.png (${icon.size}x${icon.size})`);
  }

  console.log('\nAll icons generated successfully!');
  console.log('\nNext steps:');
  console.log('1. Run: npm run build');
  console.log('2. Run: npx cap sync android');
  console.log('3. Rebuild in Android Studio');
}

generateIcons().catch(console.error);
