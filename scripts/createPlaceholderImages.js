#!/usr/bin/env node

/**
 * Script to create placeholder images for the application
 * This ensures all referenced placeholder images exist
 */

import sharp from 'sharp';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');
const imagesDir = resolve(publicDir, 'images');

// Ensure directories exist
if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}
if (!existsSync(imagesDir)) {
  mkdirSync(imagesDir, { recursive: true });
}

/**
 * Create a placeholder image with text
 */
async function createPlaceholderImage(outputPath, width, height, text, bgColor = '#f0f0f0', textColor = '#666666') {
  try {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" 
              fill="${textColor}" text-anchor="middle" dominant-baseline="middle">
          ${text}
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outputPath);
    
    console.log(`✅ Created placeholder image: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to create ${outputPath}:`, error.message);
  }
}

/**
 * Create a logo-style image
 */
async function createLogoImage(outputPath, width, height, text) {
  try {
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2E7D32;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#logoGradient)" rx="8"/>
        <text x="50%" y="40%" font-family="Arial, sans-serif" font-size="24" 
              fill="white" text-anchor="middle" dominant-baseline="middle" font-weight="bold">
          ${text.split(' ')[0]}
        </text>
        <text x="50%" y="65%" font-family="Arial, sans-serif" font-size="14" 
              fill="white" text-anchor="middle" dominant-baseline="middle">
          ${text.split(' ').slice(1).join(' ')}
        </text>
      </svg>
    `;

    await sharp(Buffer.from(svg))
      .jpeg({ quality: 90 })
      .toFile(outputPath);
    
    console.log(`✅ Created logo image: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Failed to create ${outputPath}:`, error.message);
  }
}

async function main() {
  console.log('🖼️  Creating placeholder images...\n');

  // Create placeholder images as referenced in the problem statement
  await createPlaceholderImage(
    resolve(publicDir, 'placeholder-image.jpg'),
    400, 300,
    'Placeholder Image',
    '#e9ecef',
    '#6c757d'
  );

  await createPlaceholderImage(
    resolve(publicDir, 'placeholder-farm-image.jpg'),
    600, 400,
    'Farm Placeholder',
    '#d4f1d4',
    '#2d5a2d'
  );

  await createPlaceholderImage(
    resolve(imagesDir, 'placeholder-media.png'),
    300, 200,
    'Media Placeholder',
    '#f8f9fa',
    '#495057'
  );

  // Create the logo image referenced in swagger and email service
  await createLogoImage(
    resolve(imagesDir, 'ishaazi.jpg'),
    200, 100,
    'ISHAAZI Livestock Services'
  );

  console.log('\n✅ All placeholder images created successfully!');
}

main().catch(error => {
  console.error('❌ Error creating placeholder images:', error);
  process.exit(1);
});