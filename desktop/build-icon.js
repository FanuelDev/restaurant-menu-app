/**
 * Génère assets/icon.ico et assets/icon.png depuis le SVG du projet.
 * Utilise sharp pour le rendu SVG→PNG et png-to-ico pour l'assemblage ICO.
 *
 * Usage : node build-icon.js
 */

const sharp = require('sharp')
const pngToIco = require('png-to-ico')
const fs = require('fs')
const path = require('path')

const ASSETS = path.join(__dirname, 'assets')

// SVG source — identique au favicon.svg du frontend
const SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" fill="none">
  <rect width="40" height="40" rx="10" fill="#C0392B"/>
  <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
  <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
</svg>`)

// Tailles requises par Windows pour un ICO complet
const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]

async function main() {
  if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true })

  console.log('🎨  Génération des PNG...')
  const pngPaths = []

  for (const size of ICO_SIZES) {
    const dest = path.join(ASSETS, `icon-${size}.png`)
    await sharp(SVG).resize(size, size).png().toFile(dest)
    pngPaths.push(dest)
    console.log(`    ✓ ${size}×${size}`)
  }

  // PNG 512×512 pour electron-builder (utilisé en interne)
  const png512 = path.join(ASSETS, 'icon.png')
  await sharp(SVG).resize(512, 512).png().toFile(png512)
  console.log('    ✓ 512×512 (icon.png)')

  console.log('\n📦  Assemblage ICO...')
  const ico = await pngToIco(pngPaths)
  fs.writeFileSync(path.join(ASSETS, 'icon.ico'), ico)
  console.log('    ✓ icon.ico')

  // Nettoyage des PNG temporaires (sauf icon.png)
  for (const p of pngPaths) fs.unlinkSync(p)

  console.log('\n✅  Icônes générées dans /assets')
}

main().catch(err => {
  console.error('❌ Erreur :', err.message)
  process.exit(1)
})
