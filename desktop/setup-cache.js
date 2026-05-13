/**
 * Pré-peuple le cache winCodeSign d'electron-builder en excluant les symlinks
 * macOS (libcrypto.dylib, libssl.dylib) qui nécessitent les droits admin sur Windows.
 *
 * À exécuter une seule fois avant le premier build : node setup-cache.js
 */

const { execFileSync, spawnSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const https = require('https')
const os = require('os')

const WINCORESIGN_VERSION = '2.6.0'
const CACHE_DIR = path.join(
  process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
  'electron-builder', 'Cache', 'winCodeSign',
  `winCodeSign-${WINCORESIGN_VERSION}`
)
const DOWNLOAD_URL = `https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-${WINCORESIGN_VERSION}/winCodeSign-${WINCORESIGN_VERSION}.7z`
const SEVENZIP = path.join(__dirname, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe')

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest)
    const request = (u) =>
      https.get(u, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          return request(res.headers.location)
        }
        res.pipe(file)
        file.on('finish', () => file.close(resolve))
      }).on('error', reject)
    request(url)
  })
}

async function main() {
  if (fs.existsSync(CACHE_DIR) && fs.readdirSync(CACHE_DIR).length > 0) {
    console.log('✓ Cache winCodeSign déjà présent, rien à faire.')
    return
  }

  console.log(`→ Téléchargement winCodeSign-${WINCORESIGN_VERSION}...`)
  const tmpFile = path.join(os.tmpdir(), `winCodeSign-${WINCORESIGN_VERSION}.7z`)
  await download(DOWNLOAD_URL, tmpFile)
  console.log('✓ Téléchargé')

  console.log('→ Extraction (darwin exclu — symlinks inutiles sur Windows)...')
  fs.mkdirSync(CACHE_DIR, { recursive: true })

  const result = spawnSync(SEVENZIP, ['x', tmpFile, `-o${CACHE_DIR}`, '-x!darwin', '-y'], {
    stdio: 'pipe',
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    console.error('❌ Erreur extraction :', result.stderr || result.stdout)
    process.exit(1)
  }

  fs.unlinkSync(tmpFile)
  console.log('✅ Cache winCodeSign prêt :', CACHE_DIR)
}

main().catch((err) => {
  console.error('❌', err.message)
  process.exit(1)
})
