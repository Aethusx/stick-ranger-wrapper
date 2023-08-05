const { app, BrowserWindow, Menu, ipcMain, dialog } = require("electron");
const discordRPC = require("discord-rpc");
const fs = require("fs");
const path = require("path");

let win;
let settings = JSON.parse(
  fs.readFileSync(path.join(__dirname, "settings.json"))
);

const saveFileLocation = settings.saveFileLocation;
const backupFileLocation = settings.backupFileLocation;

ensureFileExists(saveFileLocation, "");
ensureFileExists(backupFileLocation, "[]");

function createMenu() {
  let menuTemplate = [
    {
      label: "Game",
      submenu: [
        { role: "quit" },
        {
          label: "Console",
          click: () => {
            win.webContents.openDevTools();
          },
        },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
      ],
    },
    {
      label: "Save",
      submenu: [
        {
          label: "Get (Save)",
          click: () => {
            win.webContents.send("electron-get");
          },
        },
        {
          label: "Set (Load)",
          click: () => {
            win.webContents.send("electron-set");
          },
        },
      ],
    },
    {
      label: "Settings",
      submenu: [
        {
          label: "Image Rendering",
          submenu: [
            {
              label: "auto",
              type: "radio",
              checked: settings.imageRendering === "auto",
              click: () => updateImageRendering("auto"),
            },
            {
              label: "smooth",
              type: "radio",
              checked: settings.imageRendering === "smooth",
              click: () => updateImageRendering("smooth"),
            },
            {
              label: "high-quality",
              type: "radio",
              checked: settings.imageRendering === "high-quality",
              click: () => updateImageRendering("high-quality"),
            },
            {
              label: "pixelated",
              type: "radio",
              checked: settings.imageRendering === "pixelated",
              click: () => updateImageRendering("pixelated"),
            },
            {
              label: "crisp-edges",
              type: "radio",
              checked: settings.imageRendering === "crisp-edges",
              click: () => updateImageRendering("crisp-edges"),
            },
          ],
        },
        {
          label: "Enable Discord RPC",
          type: "checkbox",
          checked: discordRPCEnabled,
          click: () => {
            discordRPCEnabled = !discordRPCEnabled;
            settings.discordRPCEnabled = discordRPCEnabled;
            fs.writeFileSync(
              path.join(__dirname, "settings.json"),
              JSON.stringify(settings)
            );
            createMenu();
          },
        },
      ],
    },
    {
      label: "About",
      click: () => {
        dialog.showMessageBox({
          type: "info",
          title: "About",
          message: "Made by github.com/Aethusx",
        });
      },
    },
  ];

  if (settings.enableCheats) {
    const cheatsMenu = {
      label: "Cheats",
      submenu: [
        {
          label: "Convert all discovered maps into book",
          click: () => {
            win.webContents.send("convert-all-maps");
          },
        },
      ],
    };

    menuTemplate.push(cheatsMenu);
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  win = new BrowserWindow({
    width: settings.width,
    height: settings.height,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");
  createMenu();
}

app.whenReady().then(createWindow);

const rpc = new discordRPC.Client({ transport: "ipc" });
const clientId = settings.discordClientId;
let discordRPCEnabled = settings.discordRPCEnabled;

async function setActivity(data) {
  if (!rpc || !data) return;

  // Sets the activity shown in Discord.
  rpc.setActivity({
    details: `Current Zone: ${data.currentZone}`,
    state: `Lvl: ${data.lvl}, Squad: ${data.squad.join(", ")}`,
    largeImageKey: "stickranger",
    largeImageText: `Money: ${data.money}`,
    instance: false,
  });
}

rpc.on("ready", () => {
  setActivity();
  setInterval(() => {
    setActivity(); // update every 15 seconds
  }, 15e3);
});

if (discordRPCEnabled) {
  rpc.login({ clientId }).catch(console.error);
}

function ensureFileExists(filePath, initialContent) {
  if (!fs.existsSync(path.resolve(__dirname, filePath))) {
    fs.writeFileSync(path.resolve(__dirname, filePath), initialContent, "utf8");
  }
}

function updateImageRendering(newRendering) {
  settings.imageRendering = newRendering;

  win.webContents.send("update-image-rendering", newRendering);
  fs.writeFileSync(
    path.join(__dirname, "settings.json"),
    JSON.stringify(settings)
  );
  createMenu();
}

// This will read the file
ipcMain.handle("read-file", async (event) => {
  try {
    const data = fs.readFileSync(
      path.resolve(__dirname, saveFileLocation),
      "utf8"
    );
    return data;
  } catch (err) {
    console.error("There was an error reading the file!", err);
    return "";
  }
});

ipcMain.on("update-rpc", (event, data) => {
  setActivity(data);
});

ipcMain.handle("get-discord-rpc-enabled", async () => {
  return settings.discordRPCEnabled;
});

ipcMain.handle("get-image-rendering", async (event) => {
  return settings.imageRendering;
});

ipcMain.handle("get-auto-save-frequency", async (event) => {
  return settings.autoSaveFrequency;
});

// Write to the file
ipcMain.handle("write-file", async (event, content) => {
  // First, read the old content from save.txt
  let oldContent;
  try {
    oldContent = fs.readFileSync(
      path.resolve(__dirname, saveFileLocation),
      "utf8"
    );
  } catch (err) {
    console.error("There was an error reading the file!", err);
    return false;
  }

  // Read the backups
  let backups;
  try {
    const backupContent = fs.readFileSync(
      path.resolve(__dirname, backupFileLocation),
      "utf8"
    );
    backups = backupContent ? JSON.parse(backupContent) : [];
  } catch (err) {
    console.error("There was an error reading the backup file!", err);
    return false;
  }

  // Check if old content is already in the backups
  const existingBackup = backups.find(
    (backup) => backup.content === oldContent
  );

  // If it doesn't exist, add new backup
  if (!existingBackup) {
    const backupData = {
      date: new Date().toISOString(),
      content: oldContent,
    };

    backups.push(backupData);

    // Limit the number of backups to amount from settings
    while (backups.length > settings.maxBackupAmount) {
      backups.shift(); // Remove the oldest backup
    }

    fs.writeFileSync(
      path.resolve(__dirname, backupFileLocation),
      JSON.stringify(backups, null, 2),
      "utf8"
    );
  }

  // Then, write the new content to save.txt
  try {
    fs.writeFileSync(
      path.resolve(__dirname, saveFileLocation),
      content,
      "utf8"
    );
    return true;
  } catch (err) {
    console.error("There was an error writing the file!", err);
    return false;
  }
});
