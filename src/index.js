const { app, BrowserWindow, ipcMain } = require('electron');
const { join } = require('path');
const axios = require("axios");
const { createWriteStream, existsSync, unlinkSync, copyFile, readFileSync } = require("fs");
const tempDir = join(__dirname, "..", "..")

const pkg = require("../package.json").version;

require("./modules/accountManager");
require("./modules/versionManager");

let mainWindow;

const logPath = join(app.getPath("logs"), "launcher.log");
const berry = require("./modules/logger")(logPath);

berry.log("Starting Flexberry Launcher...");

function checkForUpdates() {
  return new Promise((resolve, reject) => {
    if (!app.isPackaged)
      return resolve(false);
    else
      berry.log("Checking for updates...");
    /* 
     * if you want to make updater only check for stable releases change add /latest to the url
     * and remove [0] from res
     */
    axios.get("https://api.github.com/repos/FlexberryLauncher/launcher/releases").then(async (r) => {
      let res = r?.data[0];
      if (!pkg)
        return;
      if (pkg !== res.tag_name.replace("v", "") && !existsSync(join(__dirname, "..", "..", "update.asar"))) {
        const updateModules = res.assets?.find(asset => asset.name.includes("asar"));
        const updateMeta = updateModules ? {
          version: res.tag_name,
          url: updateModules?.browser_download_url,
          size: updateModules?.size,
        } : false;
        resolve(updateMeta);
      } else {
        resolve(false);
      }
    }).catch(err => {
      berry.error("Couldn't check for updates");
      berry.error(err);
      resolve(false);
    });
  });
}

function update(url) {
  return new Promise((resolve, reject) => {
    mainWindow.webContents.send("hideUi", true);
    axios({
      url,
      responseType: "stream"
    }).then((response) => {
      // You can replace .flexberry with anything you want except .asar!
      try {
      response.data.pipe(createWriteStream(join(tempDir, "app.flexberry")))
        .on("finish", () => {
          copyFile(join(tempDir, "app.flexberry"), join(tempDir, "app.asar"), (err) => {
            if (err) {
              berry.error("Couldn't copy update file");
              berry.error(err);
              reject(err);
            } else {
              berry.log("Update is completed, restarting...");
              resolve(true);
              unlinkSync(join(tempDir, "app.flexberry"));
            }
          });
        })
        .on("error", reject);
      } catch (err) {
        reject(err);
      };
    }).catch(() => {
      reject("Couldn't download the update");
      berry.error("Couldn't download the update");
      mainWindow.webContents.send("hideUi", false);
      mainWindow.webContents.send("updateError", "Couldn't download the update");
    });
  });
}

async function createWindow() {
  const log = readFileSync(logPath, "utf8");
  if (log.split("Launcher is closed").length > 5) {
    unlinkSync(logPath);
  }
  berry.log("Launcher is running in production mode. Version: " + pkg);
  mainWindow = new BrowserWindow({
    width: 830,
    height: 520,
    titleBarStyle: "hidden",
    menuBarVisible: false,
    skipTaskbar: true,
    title: "Flexberry Launcher",
    fullscreenable: false,
    resizable: false,
    icon: join(__dirname, "assets/images/flexberry-launcher-icon.png"),
    transparent: true,
    webPreferences: {
      spellcheck: false,
      preload: join(__dirname, "scripts", "preload.js"),
    }
  });
  mainWindow.loadFile(join(__dirname, "index.html"));
  if (process.platform === "darwin")
    mainWindow.setWindowButtonVisibility(false);
  require("./modules/gameManager")(mainWindow);
};

ipcMain.on("update", (event, arg) => {
  update(arg).then(() => {
    mainWindow.webContents.send("updateProgress", "Update is completed, restarting the launcher");
    setTimeout(() => {
      app.relaunch();
      app.quit();
    }, 3000);
  }).catch(err => {
    berry.error(err);
    mainWindow.webContents.send("updateError", err);
  });
});

ipcMain.on("getVersion", (event, arg) => {
  event.reply("version", pkg);
});

ipcMain.on("getMemory", (event, arg) => {
  event.reply("memory", require("os").totalmem());
});

ipcMain.on("minimize", () => mainWindow.minimize());
ipcMain.on("loaded", async () => {
  mainWindow.setSkipTaskbar(false);
  const updateMeta = await checkForUpdates();
  if (updateMeta.url) {
    mainWindow.webContents.send("updateAvailable", updateMeta);
    mainWindow.webContents.send("hideUi", true);
  }
});

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("quit", () => {
  berry.log("Launcher is closed");
  berry.log("$1");
});