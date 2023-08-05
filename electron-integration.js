// Electron
const { ipcRenderer } = require("electron");

// Read from the file
async function readFile() {
  try {
    const data = await ipcRenderer.invoke("read-file");
    return data;
  } catch (err) {
    console.error("There was an error reading the file!", err);
  }
}

// Write to the file
async function writeFile(content) {
  try {
    const result = await ipcRenderer.invoke("write-file", content);
    console.log(result ? "File written successfully" : "Error writing file");
  } catch (err) {
    console.error("There was an error writing the file!", err);
  }
}

async function readFileAndLoadGame() {
  const file = await readFile();
  const fixed = file.replace(/\x0D\x0A|\x0D|\x0A/g, "");
  GameLoad(fixed);
}

function getRPCData() {
  return {
    currentZone: Uf[h],
    lvl: Mb[0],
    money: dc,
    squad: [Jc[ec[0]], Jc[ec[1]], Jc[ec[2]], Jc[ec[3]]],
  };
}

ipcRenderer.on("electron-get", () => {
  writeFile(GameSave("0"));
});

ipcRenderer.on("electron-set", async () => {
  readFileAndLoadGame();
});

ipcRenderer.on("update-image-rendering", (event, newRendering) => {
  let cv = document.getElementById("cv");
  if (cv) {
    cv.style.imageRendering = newRendering;
  }
});

ipcRenderer.invoke("get-discord-rpc-enabled").then((discordRPCEnabled) => {
  if (discordRPCEnabled) {
    ipcRenderer.send("update-rpc", getRPCData());
  }
});

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey && event.key === "f") {
    event.preventDefault(); // prevent the default action, find (Ctrl + F)

    var canvas = document.getElementById("cv");

    if (!document.fullscreenElement) {
      if (canvas.requestFullscreen) {
        canvas.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }
});

function startDiscordRpcInterval() {
  setInterval(() => {
    ipcRenderer.invoke("get-discord-rpc-enabled").then((discordRPCEnabled) => {
      if (discordRPCEnabled) {
        ipcRenderer.send("update-rpc", getRPCData());
      }
    });
  }, 15000);
}

async function getAutoSaveFrequency() {
  try {
    const frequency = await ipcRenderer.invoke("get-auto-save-frequency");
    return frequency;
  } catch (err) {
    console.error("There was an error getting the auto-save frequency!", err);
  }
}

async function loadGameAndStartAutoSave() {
  readFileAndLoadGame();

  const autoSaveFrequency = await getAutoSaveFrequency();

  if (autoSaveFrequency > 0) {
    setInterval(() => {
      writeFile(GameSave("0"));
    }, autoSaveFrequency * 1000);
  }
}

loadGameAndStartAutoSave();
startDiscordRpcInterval();

/* CHEATS */
ipcRenderer.on("convert-all-maps", () => {
  uncoveredMapsIntoBook();
});

function uncoveredMapsIntoBook() {
  Ae = Ae.map((value) => {
    if (value === 3) {
      return 7;
    }
    return value;
  });
}
