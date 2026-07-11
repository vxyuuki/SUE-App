const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs')
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

const fs = require('fs');

ipcMain.on('set-mini-mode', (event, isMini) => {
  const logPath = path.join(__dirname, '../electron_log.txt');
  try {
    fs.appendFileSync(logPath, `Received set-mini-mode: ${isMini} at ${new Date().toISOString()}\n`);
  } catch (e) {}

  try {
    if (isMini) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      }
      mainWindow.setMinimumSize(340, 260);
      mainWindow.setSize(340, 260);
      mainWindow.setMaximumSize(340, 260);
      mainWindow.setAlwaysOnTop(true, 'floating');
      fs.appendFileSync(logPath, `Resized to mini mode successfully\n`);
    } else {
      mainWindow.setMaximumSize(9999, 9999);
      mainWindow.setMinimumSize(800, 600);
      mainWindow.setSize(1280, 800);
      mainWindow.setAlwaysOnTop(false);
      fs.appendFileSync(logPath, `Resized to normal mode successfully\n`);
    }
  } catch (err) {
    try {
      fs.appendFileSync(logPath, `ERROR in IPC: ${err.message}\n${err.stack}\n`);
    } catch (e) {}
  }
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
