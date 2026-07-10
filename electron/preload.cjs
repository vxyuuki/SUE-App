const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setMiniMode: (isMini) => ipcRenderer.send('set-mini-mode', isMini)
});
