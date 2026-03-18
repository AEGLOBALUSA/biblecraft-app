#!/usr/bin/env node

/**
 * Generate PWA icons using canvas
 * Creates 192x192 and 512x512 icons with pickaxe on brown background
 * Run with: node scripts/generate-pwa-icons.js
 */

import { createCanvas } from 'canvas';
import fs from 'fs';
import path from 'path';

const SIZES = [
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
  { size: 192, name: 'icon-maskable-192.png', maskable: true },
  { size: 512, name: 'icon-maskable-512.png', maskable: true },
];

function createIconCanvas(size, maskable = false) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  if (maskable) {
    // Transparent background for maskable icons
    ctx.clearRect(0, 0, size, size);
  } else {
    // Brown background (Minecraft dirt color)
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, 0, size, size);
  }

  // Draw pickaxe (using emoji-like design with rectangles and lines)
  const padding = size * 0.1;
  const drawSize = size - padding * 2;

  // Pickaxe handle (vertical brown line)
  ctx.strokeStyle = '#3b2507';
  ctx.lineWidth = drawSize * 0.1;
  ctx.beginPath();
  ctx.moveTo(size * 0.5, padding + drawSize * 0.2);
  ctx.lineTo(size * 0.5, padding + drawSize * 0.9);
  ctx.stroke();

  // Pickaxe head (green/grass color blocks)
  ctx.fillStyle = '#4ade80';
  const headX = size * 0.25;
  const headY = padding + drawSize * 0.15;
  const blockSize = drawSize * 0.15;

  // Three blocks in an L shape
  ctx.fillRect(headX, headY, blockSize, blockSize);
  ctx.fillRect(headX + blockSize, headY, blockSize, blockSize);
  ctx.fillRect(headX + blockSize * 2, headY, blockSize, blockSize);
  ctx.fillRect(headX + blockSize * 2, headY + blockSize, blockSize, blockSize);

  // Add borders for depth
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = drawSize * 0.03;
  ctx.strokeRect(headX, headY, blockSize, blockSize);
  ctx.strokeRect(headX + blockSize, headY, blockSize, blockSize);
  ctx.strokeRect(headX + blockSize * 2, headY, blockSize, blockSize);
  ctx.strokeRect(headX + blockSize * 2, headY + blockSize, blockSize, blockSize);

  return canvas;
}

function generateIcons() {
  const publicDir = path.join(process.cwd(), 'public');

  // Create public dir if it doesn't exist
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  SIZES.forEach(({ size, name, maskable = false }) => {
    try {
      const canvas = createIconCanvas(size, maskable);
      const buffer = canvas.toBuffer('image/png');
      const filePath = path.join(publicDir, name);

      fs.writeFileSync(filePath, buffer);
      console.log(`✓ Generated ${name} (${size}x${size}${maskable ? ', maskable' : ''})`);
    } catch (err) {
      console.error(`✗ Failed to generate ${name}:`, err.message);
    }
  });

  console.log('\nPWA icons generated successfully!');
}

generateIcons();
