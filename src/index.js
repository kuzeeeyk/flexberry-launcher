const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const msmc = require("msmc");
require("./modules/accountManager");

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 830,
    height: 566,
    titleBarStyle: 'hidden',
    menuBarVisible: false,
    title: 'Flexberry Launcher',
    fullscreenable: false,
    resizable: false,
    icon: path.join(__dirname, "assets/images/flexberry-launcher-icon.ico"),
    transparent: true,
    webPreferences: {
      preload: path.join(__dirname, "scripts", "preload.js"),
    }
  });
  if (process.platform === 'darwin') {
    mainWindow.setTrafficLightPosition({x: 999, y: 999}); // i'm sorry macOS users, i had to do it...
  }
  mainWindow.loadFile(path.join(__dirname, "index.html"));
  ipcMain.on("minimize", () => mainWindow.minimize());
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
