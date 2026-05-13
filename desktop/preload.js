// preload.js — isolation stricte, aucune API Node exposée
// L'app charge une URL de production (https://saemenus.com) : pas besoin
// d'exposer d'APIs supplémentaires au renderer.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('saemenusElectron', {
  version: () => ipcRenderer.invoke('app:version'),
})
