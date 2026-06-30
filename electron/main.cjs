const { app, BrowserWindow } = require('electron');
const path = require('path');

// Fungsi untuk membuat jendela aplikasi
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../icon.ico')
  });

  // Mode Development: Load dari Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Buka DevTools secara otomatis di mode dev (opsional)
    // mainWindow.webContents.openDevTools();
  } else {
    // Mode Production: Load dari file hasil build (dist/index.html)
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// Saat aplikasi siap, buat jendela
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Keluar saat semua jendela ditutup, kecuali di macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
