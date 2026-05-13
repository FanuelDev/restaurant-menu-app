const { app, BrowserWindow, shell, Menu, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const os = require('os')

const PROD_URL = 'https://saemenus.com/login'
const ALLOWED_HOSTS = ['saemenus.com', 'backend.saemenus.com', 'fonts.googleapis.com', 'fonts.gstatic.com']

// Log vers fichier pour débugger les crashs silencieux
const LOG_FILE = path.join(app.getPath('userData'), 'saemenus.log')
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`
  try { fs.appendFileSync(LOG_FILE, line) } catch {}
}

process.on('uncaughtException', (err) => {
  log('uncaughtException:', err.stack || err.message)
  dialog.showErrorBox('SaeMenus — Erreur', err.message)
})

process.on('unhandledRejection', (reason) => {
  log('unhandledRejection:', reason)
})

let mainWindow = null

// ── Fenêtre principale ───────────────────────────────────────────────────────
function createWindow() {
  log('createWindow()')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 620,
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    title: 'SaeMenus',
    show: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // sandbox désactivé : évite des blocages au démarrage sur Windows
      // sans sacrifier la sécurité (contextIsolation + nodeIntegration:false suffisent)
      sandbox: false,
      partition: 'persist:saemenus',
    },
  })

  mainWindow.once('ready-to-show', () => {
    log('ready-to-show — affichage fenêtre')
    mainWindow.show()
    mainWindow.focus()
  })

  log('loadURL', PROD_URL)
  mainWindow.loadURL(PROD_URL).catch((err) => {
    log('loadURL error:', err.message)
    loadOfflinePage()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    handleExternalUrl(url)
    return { action: 'deny' }
  })

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedUrl(url)) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDesc, validatedURL) => {
    log('did-fail-load:', errorCode, errorDesc, validatedURL)
    // Ne montrer la page offline que pour l'URL racine, pas pour les sous-ressources
    if (errorCode !== -3 && (validatedURL === PROD_URL || validatedURL === PROD_URL + '/')) {
      loadOfflinePage()
    }
  })

  mainWindow.webContents.on('did-finish-load', () => {
    log('did-finish-load OK')
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

function isAllowedUrl(url) {
  try {
    const { hostname } = new URL(url)
    return ALLOWED_HOSTS.some(host => hostname === host || hostname.endsWith('.' + host))
  } catch {
    return false
  }
}

function handleExternalUrl(url) {
  if (!isAllowedUrl(url)) shell.openExternal(url)
}

function loadOfflinePage() {
  if (!mainWindow) return
  const offlinePath = path.join(__dirname, 'offline.html')
  log('loadOfflinePage:', offlinePath)
  mainWindow.loadFile(offlinePath).catch((err) => log('offline load error:', err.message))
}

// ── Menu application ─────────────────────────────────────────────────────────
function buildMenu() {
  const template = [
    {
      label: 'SaeMenus',
      submenu: [
        {
          label: 'À propos',
          click: () =>
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos de SaeMenus',
              message: 'SaeMenus',
              detail: `Version ${app.getVersion()}\n\nGérez votre menu digital facilement.\n\nhttps://saemenus.com`,
              buttons: ['Fermer'],
            }),
        },
        { type: 'separator' },
        {
          label: 'Voir les logs',
          click: () => shell.openPath(LOG_FILE),
        },
        { type: 'separator' },
        { role: 'quit', label: 'Quitter SaeMenus' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        {
          label: 'Actualiser',
          accelerator: 'F5',
          click: () => mainWindow?.webContents.reload(),
        },
        {
          label: "Retour à l'accueil",
          accelerator: 'CmdOrCtrl+H',
          click: () => mainWindow?.loadURL(PROD_URL),
        },
        { type: 'separator' },
        { role: 'resetZoom',        label: 'Zoom par défaut', accelerator: 'CmdOrCtrl+0' },
        { role: 'zoomIn',           label: 'Zoom +',          accelerator: 'CmdOrCtrl+=' },
        { role: 'zoomOut',          label: 'Zoom -',          accelerator: 'CmdOrCtrl+-' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran',     accelerator: 'F11' },
      ],
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'Ouvrir dans le navigateur',
          click: () => shell.openExternal(PROD_URL),
        },
        {
          label: 'Support',
          click: () => shell.openExternal('https://saemenus.com'),
        },
      ],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// ── IPC ──────────────────────────────────────────────────────────────────────
ipcMain.handle('app:version', () => app.getVersion())

// ── Lifecycle ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  log('app ready')
  buildMenu()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  log('window-all-closed')
  if (process.platform !== 'darwin') app.quit()
})
