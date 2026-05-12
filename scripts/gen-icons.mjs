import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '..', 'public')

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#0c0a09"/>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <defs>
    <radialGradient id="bg" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#292524"/>
      <stop offset="100%" stop-color="#0c0a09"/>
    </radialGradient>
  </defs>
  <!-- Sword -->
  <line x1="256" y1="80" x2="256" y2="380" stroke="#d97706" stroke-width="18" stroke-linecap="round"/>
  <!-- Crossguard -->
  <line x1="176" y1="220" x2="336" y2="220" stroke="#d97706" stroke-width="22" stroke-linecap="round"/>
  <!-- Pommel -->
  <circle cx="256" cy="400" r="22" fill="#d97706"/>
  <!-- Blade shine -->
  <line x1="256" y1="90" x2="270" y2="200" stroke="#fbbf24" stroke-width="5" stroke-linecap="round" opacity="0.6"/>
  <!-- Orbit ring (solo symbol) -->
  <ellipse cx="256" cy="256" rx="190" ry="80" fill="none" stroke="#78350f" stroke-width="6" stroke-dasharray="20 12" opacity="0.7"/>
  <circle cx="256" cy="136" r="12" fill="#92400e"/>
</svg>`)

async function generate() {
  for (const size of [192, 512]) {
    await sharp(svg)
      .resize(size, size)
      .png()
      .toFile(join(publicDir, `icon-${size}.png`))
    console.log(`Generated icon-${size}.png`)
  }
  await sharp(svg).resize(180, 180).png().toFile(join(publicDir, 'apple-touch-icon.png'))
  console.log('Generated apple-touch-icon.png')
}

generate()
