const { app, BrowserWindow, shell, Menu, dialog, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')

const PROD_URL = 'https://saemenus.com/login'
const ALLOWED_HOSTS = ['saemenus.com', 'backend.saemenus.com', 'fonts.googleapis.com', 'fonts.gstatic.com']

const LOG_FILE = path.join(app.getPath('userData'), 'saemenus.log')
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}\n`
  try { fs.appendFileSync(LOG_FILE, line) } catch {}
}

process.on('uncaughtException', (err) => {
  log('uncaughtException:', err.stack || err.message)
  dialog.showErrorBox('SaeMenus — Erreur', err.message)
})
process.on('unhandledRejection', (reason) => log('unhandledRejection:', reason))

let mainWindow = null

// ── CSS injecté dans la page ─────────────────────────────────────────────────
const TITLEBAR_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=DM+Serif+Display&display=swap');

  /* Repousse le contenu Angular sous la titlebar */
  html, body { margin-top: 0 !important; padding-top: 0 !important; }
  body > app-root { display: block; padding-top: 44px; }

  /* ── Titlebar rouge brand ────────────────────────── */
  #__sm_bar__ {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 44px;
    background: linear-gradient(135deg, #C0392B 0%, #96281b 100%);
    border-bottom: 1px solid rgba(0, 0, 0, 0.25);
    box-shadow: 0 2px 16px rgba(0, 0, 0, 0.4);
    display: flex;
    align-items: center;
    z-index: 2147483647;
    -webkit-app-region: drag;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    user-select: none;
  }

  /* Brand */
  #__sm_bar__ .sm-brand {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 16px;
    flex-shrink: 0;
    -webkit-app-region: no-drag;
    cursor: default;
  }
  #__sm_bar__ .sm-brand svg { flex-shrink: 0; }
  #__sm_bar__ .sm-brand-name {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 15px;
    font-weight: 400;
    color: #fff;
    letter-spacing: 0.02em;
  }

  /* Séparateur vertical */
  #__sm_bar__ .sm-sep {
    width: 1px;
    height: 20px;
    background: rgba(255, 255, 255, 0.25);
    margin: 0 2px;
    flex-shrink: 0;
  }

  /* Titre de page (centre) */
  #__sm_bar__ .sm-title {
    flex: 1;
    text-align: center;
    font-size: 11px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 8px;
    pointer-events: none;
  }

  /* Actions nav */
  #__sm_bar__ .sm-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 0 6px;
    -webkit-app-region: no-drag;
    flex-shrink: 0;
  }
  #__sm_bar__ .sm-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.75);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    -webkit-app-region: no-drag;
  }
  #__sm_bar__ .sm-action-btn:hover {
    background: rgba(0, 0, 0, 0.15);
    color: #fff;
  }
  #__sm_bar__ .sm-action-btn svg { pointer-events: none; }

  /* Window controls */
  #__sm_bar__ .sm-controls {
    display: flex;
    align-items: stretch;
    height: 44px;
    flex-shrink: 0;
    -webkit-app-region: no-drag;
    margin-left: 4px;
  }
  #__sm_bar__ .sm-ctrl {
    width: 46px;
    height: 44px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.8);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s, color 0.15s;
    -webkit-app-region: no-drag;
  }
  #__sm_bar__ .sm-ctrl:hover {
    background: rgba(0, 0, 0, 0.15);
    color: #fff;
  }
  #__sm_bar__ .sm-ctrl.sm-close:hover {
    background: rgba(0, 0, 0, 0.3);
    color: #fff;
  }
  #__sm_bar__ .sm-ctrl svg { pointer-events: none; }
`

// ── HTML injecté dans la page ────────────────────────────────────────────────
const TITLEBAR_HTML = `
(function () {
  if (document.getElementById('__sm_bar__')) return;

  const bar = document.createElement('div');
  bar.id = '__sm_bar__';
  bar.innerHTML = \`
    <div class="sm-brand" title="SaeMenus">
      <svg width="26" height="26" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="9" fill="rgba(255,255,255,0.18)"/>
        <path d="M8 17c0-6.627 5.373-12 12-12s12 5.373 12 12" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M8 17v14M20 17v14M32 17v14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M5 31h30M9 35h22" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <span class="sm-brand-name">SaeMenus</span>
    </div>

    <div class="sm-sep"></div>

    <div class="sm-actions">
      <button class="sm-action-btn" id="__sm_back__" title="Retour (Alt+Gauche)">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </button>
      <button class="sm-action-btn" id="__sm_reload__" title="Actualiser (F5)">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>
    </div>

    <div class="sm-title" id="__sm_page_title__"></div>

    <div class="sm-controls">
      <button class="sm-ctrl" id="__sm_min__" title="Réduire">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor">
          <rect x="0" y="5" width="11" height="1"/>
        </svg>
      </button>
      <button class="sm-ctrl" id="__sm_max__" title="Agrandir">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="0.5" y="0.5" width="10" height="10"/>
        </svg>
      </button>
      <button class="sm-ctrl sm-close" id="__sm_close__" title="Fermer">
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <line x1="1" y1="1" x2="10" y2="10"/>
          <line x1="10" y1="1" x2="1" y2="10"/>
        </svg>
      </button>
    </div>
  \`;

  document.body.prepend(bar);

  // Titre de page
  function syncTitle() {
    const el = document.getElementById('__sm_page_title__');
    if (el) el.textContent = document.title
      .replace(' — SaeMenus', '')
      .replace(' | SaeMenus', '')
      .replace('SaeMenus', '').trim();
  }
  syncTitle();
  new MutationObserver(syncTitle).observe(
    document.querySelector('title') || document.head,
    { subtree: true, characterData: true, childList: true }
  );

  // Boutons
  const api = window.saemenusElectron || {};
  document.getElementById('__sm_min__').onclick    = () => api.minimize && api.minimize();
  document.getElementById('__sm_max__').onclick    = () => api.maximize && api.maximize();
  document.getElementById('__sm_close__').onclick  = () => api.close    && api.close();
  document.getElementById('__sm_back__').onclick   = () => history.back();
  document.getElementById('__sm_reload__').onclick = () => location.reload();

  // Icône maximize selon l'état
  document.getElementById('__sm_max__').addEventListener('click', function() {
    if (api.isMaximized) api.isMaximized().then(m => {
      this.title = m ? 'Restaurer' : 'Agrandir';
    });
  });
})();
`

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
    // Supprime le chrome natif (titre + barre de menu Windows)
    frame: false,
    backgroundColor: '#0a0a0a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      partition: 'persist:saemenus',
    },
  })

  mainWindow.once('ready-to-show', () => {
    log('ready-to-show')
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.loadURL(PROD_URL).catch((err) => {
    log('loadURL error:', err.message)
    loadOfflinePage()
  })

  // Injecter titlebar après chaque chargement de page
  mainWindow.webContents.on('did-finish-load', async () => {
    log('did-finish-load')
    try {
      await mainWindow.webContents.insertCSS(TITLEBAR_CSS)
      await mainWindow.webContents.executeJavaScript(TITLEBAR_HTML)
    } catch (err) {
      log('inject error:', err.message)
    }
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
    if (errorCode !== -3 && (validatedURL === PROD_URL || validatedURL === PROD_URL + '/')) {
      loadOfflinePage()
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

function isAllowedUrl(url) {
  try {
    const { hostname } = new URL(url)
    return ALLOWED_HOSTS.some(h => hostname === h || hostname.endsWith('.' + h))
  } catch { return false }
}

function handleExternalUrl(url) {
  if (!isAllowedUrl(url)) shell.openExternal(url)
}

function loadOfflinePage() {
  if (!mainWindow) return
  mainWindow.loadFile(path.join(__dirname, 'offline.html'))
    .catch(err => log('offline error:', err.message))
}

// ── IPC handlers ─────────────────────────────────────────────────────────────
ipcMain.handle('app:version',      () => app.getVersion())
ipcMain.handle('window:minimize',  () => mainWindow?.minimize())
ipcMain.handle('window:maximize',  () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize())
ipcMain.handle('window:close',     () => mainWindow?.close())
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() ?? false)

// Menus clavier (F5, raccourcis) sans barre de menu visible
Menu.setApplicationMenu(null)

app.on('browser-window-focus', () => {
  const menu = Menu.buildFromTemplate([
    { label: 'SaeMenus', submenu: [
      { label: 'À propos', click: () =>
          dialog.showMessageBox(mainWindow, {
            type: 'info', title: 'SaeMenus',
            message: 'SaeMenus',
            detail: `Version ${app.getVersion()}\n\nGérez votre menu digital.\nhttps://saemenus.com`,
            buttons: ['Fermer'],
          })
      },
      { type: 'separator' },
      { label: 'Voir les logs', click: () => shell.openPath(LOG_FILE) },
      { type: 'separator' },
      { role: 'quit', label: 'Quitter' },
    ]},
    { label: 'Affichage', submenu: [
      { label: 'Actualiser',          accelerator: 'F5',            click: () => mainWindow?.webContents.reload() },
      { label: "Retour à l'accueil",  accelerator: 'CmdOrCtrl+H',  click: () => mainWindow?.loadURL(PROD_URL) },
      { type: 'separator' },
      { role: 'resetZoom',  label: 'Zoom par défaut',  accelerator: 'CmdOrCtrl+0' },
      { role: 'zoomIn',     label: 'Zoom +',           accelerator: 'CmdOrCtrl+=' },
      { role: 'zoomOut',    label: 'Zoom -',           accelerator: 'CmdOrCtrl+-' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: 'Plein écran', accelerator: 'F11' },
    ]},
  ])
  mainWindow?.setMenu(menu)
})

// ── Lifecycle ────────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  log('app ready')
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  log('window-all-closed')
  if (process.platform !== 'darwin') app.quit()
})
