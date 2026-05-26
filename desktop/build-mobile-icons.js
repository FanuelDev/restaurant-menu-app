/**
 * Génère les icônes d'application mobile pour :
 *  - mobile/         (app client SaeMenus — fourchette + couteau sur rouge)
 *  - cashier_app/    (app caissier SaeMenus — ticket + coche sur marine)
 *
 * Usage (depuis le dossier desktop/) :
 *   node build-mobile-icons.js
 *
 * Génère :
 *  • Android : ic_launcher.png dans chaque mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}
 *  • iOS     : AppIcon.appiconset (15 tailles) + Contents.json
 */

const sharp = require('sharp')
const fs    = require('fs')
const path  = require('path')

const ROOT = path.join(__dirname, '..')

// ─── Designs SVG ─────────────────────────────────────────────────────────────

/**
 * App CLIENT (mobile/)
 * Fourchette (gauche) + couteau (droite) blancs sur fond rouge #C0392B.
 * Formes épaisses → lisibles dès 48 px.
 */
const CLIENT_SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <!-- Fond rouge arrondi -->
  <rect width="1024" height="1024" rx="200" fill="#C0392B"/>

  <!-- ── Fourchette (centrée à gauche, x≈385) ── -->

  <!-- Trois dents -->
  <rect x="309" y="140" width="36" height="240" rx="18" fill="white"/>
  <rect x="367" y="140" width="36" height="240" rx="18" fill="white"/>
  <rect x="425" y="140" width="36" height="240" rx="18" fill="white"/>

  <!-- Col (trapèze : largeur des dents → largeur du manche) -->
  <path d="M309 355 L461 355 L421 468 L349 468 Z" fill="white"/>

  <!-- Manche -->
  <rect x="349" y="458" width="72" height="426" rx="36" fill="white"/>

  <!-- ── Couteau (centré à droite, x≈670) ── -->

  <!-- Lame : pointe en haut-gauche, tranchant bombé à droite -->
  <path d="M625 140 Q715 140 715 300 L715 400 L625 400 Z" fill="white"/>

  <!-- Manche -->
  <rect x="625" y="390" width="72" height="494" rx="36" fill="white"/>
</svg>`)

/**
 * App CAISSIER (cashier_app/)
 * Ticket de caisse blanc (lignes grises + ligne total rouge) sur fond marine #1A252F.
 * Cercle vert avec coche blanche sous le ticket = transaction validée.
 */
const CASHIER_SVG = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
  <!-- Fond marine arrondi -->
  <rect width="1024" height="1024" rx="200" fill="#1A252F"/>

  <!-- ── Corps du ticket ── -->
  <rect x="262" y="110" width="500" height="600" rx="28" fill="white"/>

  <!-- Bas en dents de scie (déchirure) -->
  <path d="M262 678
    L297 710 L332 678 L367 710 L402 678
    L437 710 L472 678 L507 710 L542 678
    L577 710 L612 678 L647 710 L682 678
    L717 710 L752 678 L762 678 L762 712
    L262 712 Z" fill="white"/>

  <!-- ── Contenu du ticket ── -->

  <!-- En-tête restaurant (barre large) -->
  <rect x="312" y="158" width="260" height="36" rx="18" fill="#BDC3C7"/>

  <!-- Sous-titre / date -->
  <rect x="312" y="222" width="360" height="22" rx="11" fill="#ECF0F1"/>

  <!-- Articles (3 lignes) -->
  <rect x="312" y="282" width="280" height="22" rx="11" fill="#ECF0F1"/>
  <rect x="312" y="322" width="320" height="22" rx="11" fill="#ECF0F1"/>
  <rect x="312" y="362" width="200" height="22" rx="11" fill="#ECF0F1"/>

  <!-- Séparateur -->
  <rect x="312" y="416" width="400" height="6" rx="3" fill="#BDC3C7"/>

  <!-- Sous-total + montant -->
  <rect x="312" y="444" width="160" height="22" rx="11" fill="#ECF0F1"/>
  <rect x="562" y="440" width="150" height="30" rx="15" fill="#C0392B" opacity="0.2"/>

  <!-- Total (libellé + montant rouge fort) -->
  <rect x="312" y="502" width="110" height="30" rx="15" fill="#BDC3C7"/>
  <rect x="552" y="498" width="210" height="38" rx="19" fill="#C0392B"/>

  <!-- ── Cercle de validation ── -->
  <circle cx="512" cy="820" r="108" fill="#27AE60"/>
  <!-- Coche blanche -->
  <path d="M454 820 L492 858 L572 778"
        stroke="white" stroke-width="54"
        stroke-linecap="round" stroke-linejoin="round"
        fill="none"/>
</svg>`)

// ─── Tailles Android ──────────────────────────────────────────────────────────

const ANDROID_SIZES = [
  { dir: 'mipmap-mdpi',    px:  48 },
  { dir: 'mipmap-hdpi',    px:  72 },
  { dir: 'mipmap-xhdpi',   px:  96 },
  { dir: 'mipmap-xxhdpi',  px: 144 },
  { dir: 'mipmap-xxxhdpi', px: 192 },
]

// ─── Tailles iOS ──────────────────────────────────────────────────────────────

const IOS_ICONS = [
  { file: 'Icon-App-20x20@1x.png',     px:   20 },
  { file: 'Icon-App-20x20@2x.png',     px:   40 },
  { file: 'Icon-App-20x20@3x.png',     px:   60 },
  { file: 'Icon-App-29x29@1x.png',     px:   29 },
  { file: 'Icon-App-29x29@2x.png',     px:   58 },
  { file: 'Icon-App-29x29@3x.png',     px:   87 },
  { file: 'Icon-App-40x40@1x.png',     px:   40 },
  { file: 'Icon-App-40x40@2x.png',     px:   80 },
  { file: 'Icon-App-40x40@3x.png',     px:  120 },
  { file: 'Icon-App-60x60@2x.png',     px:  120 },
  { file: 'Icon-App-60x60@3x.png',     px:  180 },
  { file: 'Icon-App-76x76@1x.png',     px:   76 },
  { file: 'Icon-App-76x76@2x.png',     px:  152 },
  { file: 'Icon-App-83.5x83.5@2x.png', px:  167 },
  { file: 'Icon-App-1024x1024@1x.png', px: 1024 },
]

// Contents.json racine de Assets.xcassets
const XCASSETS_CONTENTS = JSON.stringify({ info: { version: 1, author: 'xcode' } }, null, 2)

// Contents.json de l'AppIcon.appiconset (identique pour les deux apps)
const APPICONSET_CONTENTS = JSON.stringify({
  images: [
    // iPhone
    { size: '20x20',     idiom: 'iphone', filename: 'Icon-App-20x20@2x.png',     scale: '2x' },
    { size: '20x20',     idiom: 'iphone', filename: 'Icon-App-20x20@3x.png',     scale: '3x' },
    { size: '29x29',     idiom: 'iphone', filename: 'Icon-App-29x29@1x.png',     scale: '1x' },
    { size: '29x29',     idiom: 'iphone', filename: 'Icon-App-29x29@2x.png',     scale: '2x' },
    { size: '29x29',     idiom: 'iphone', filename: 'Icon-App-29x29@3x.png',     scale: '3x' },
    { size: '40x40',     idiom: 'iphone', filename: 'Icon-App-40x40@2x.png',     scale: '2x' },
    { size: '40x40',     idiom: 'iphone', filename: 'Icon-App-40x40@3x.png',     scale: '3x' },
    { size: '60x60',     idiom: 'iphone', filename: 'Icon-App-60x60@2x.png',     scale: '2x' },
    { size: '60x60',     idiom: 'iphone', filename: 'Icon-App-60x60@3x.png',     scale: '3x' },
    // iPad
    { size: '20x20',     idiom: 'ipad',   filename: 'Icon-App-20x20@1x.png',     scale: '1x' },
    { size: '20x20',     idiom: 'ipad',   filename: 'Icon-App-20x20@2x.png',     scale: '2x' },
    { size: '29x29',     idiom: 'ipad',   filename: 'Icon-App-29x29@1x.png',     scale: '1x' },
    { size: '29x29',     idiom: 'ipad',   filename: 'Icon-App-29x29@2x.png',     scale: '2x' },
    { size: '40x40',     idiom: 'ipad',   filename: 'Icon-App-40x40@1x.png',     scale: '1x' },
    { size: '40x40',     idiom: 'ipad',   filename: 'Icon-App-40x40@2x.png',     scale: '2x' },
    { size: '76x76',     idiom: 'ipad',   filename: 'Icon-App-76x76@1x.png',     scale: '1x' },
    { size: '76x76',     idiom: 'ipad',   filename: 'Icon-App-76x76@2x.png',     scale: '2x' },
    { size: '83.5x83.5', idiom: 'ipad',   filename: 'Icon-App-83.5x83.5@2x.png', scale: '2x' },
    // App Store
    { size: '1024x1024', idiom: 'ios-marketing', filename: 'Icon-App-1024x1024@1x.png', scale: '1x' },
  ],
  info: { version: 1, author: 'xcode' },
}, null, 2)

// ─── Générateur ───────────────────────────────────────────────────────────────

async function generateIcons(svgBuffer, appDir, label) {
  const androidRes = path.join(ROOT, appDir, 'android', 'app', 'src', 'main', 'res')
  const xcassets   = path.join(ROOT, appDir, 'ios', 'Runner', 'Assets.xcassets')
  const iconset    = path.join(xcassets, 'AppIcon.appiconset')

  console.log(`\n📱  ${label}`)

  // ── Android ──
  console.log('    Android :')
  for (const { dir, px } of ANDROID_SIZES) {
    const dest = path.join(androidRes, dir, 'ic_launcher.png')
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    await sharp(svgBuffer).resize(px, px).png().toFile(dest)
    console.log(`      ✓ ${dir.padEnd(18)}  ${px}×${px}`)
  }

  // ── iOS ──
  console.log('    iOS :')
  fs.mkdirSync(iconset, { recursive: true })
  fs.writeFileSync(path.join(xcassets, 'Contents.json'), XCASSETS_CONTENTS)
  fs.writeFileSync(path.join(iconset,  'Contents.json'), APPICONSET_CONTENTS)
  for (const { file, px } of IOS_ICONS) {
    const dest = path.join(iconset, file)
    await sharp(svgBuffer).resize(px, px).png().toFile(dest)
    console.log(`      ✓ ${file.padEnd(30)}  ${px}×${px}`)
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎨  Génération des icônes mobiles SaeMenus...')

  await generateIcons(CLIENT_SVG,  'mobile',      'App Client  (mobile/)      — fourchette + couteau / rouge')
  await generateIcons(CASHIER_SVG, 'cashier_app', 'App Caissier (cashier_app/) — ticket + coche  / marine')

  console.log(`
✅  Icônes générées avec succès !

   Android  →  mipmap-{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}/ic_launcher.png
   iOS      →  ios/Runner/Assets.xcassets/AppIcon.appiconset/ (15 tailles + Contents.json)

   Pour reconstruire après changement de design :
     node desktop/build-mobile-icons.js
`)
}

main().catch(err => {
  console.error('❌  Erreur :', err.message)
  process.exit(1)
})
