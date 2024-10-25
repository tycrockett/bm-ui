const path = require("path");
const psTree = require("ps-tree");
const { app, BrowserWindow, ipcMain } = require("electron");
const isDev = require("electron-is-dev");
const { spawn } = require("child_process");
// const { pid } = require("process");

let childProcesses = {};
let openDevTools = null;

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 600,
    height: 1000,
    frame: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  });

  // and load the index.html of the app.
  // win.loadFile("index.html");
  win.loadURL(
    isDev
      ? "http://localhost:3030"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  // Open the DevTools.
  if (isDev) {
    openDevTools = () => win.webContents.openDevTools({ mode: "detach" });
  }
}

let processes = {};

ipcMain.on("open-dev-tools", (event, pid) => {
  if (isDev) {
    openDevTools?.();
  }
});

ipcMain.on("kill", (event, pid) => {
  console.log(pid);
  psTree(pid, (err, children) => {
    console.log(children);
    if (err) {
      console.error(err);
      return;
    }

    // Kill all child processes
    [pid].concat(children.map((p) => p.PID)).forEach((tpid) => {
      try {
        process.kill(tpid);
      } catch (e) {
        console.error(`Failed to kill process ${tpid}: ${e.message}`);
      }
    });
  });
});

// Function to handle spawning a child process
ipcMain.on("spawn", (event, { pwd, command }) => {
  // Spawn the child process
  const child = spawn("zsh", [
    "-l",
    "-c",
    `source ~/.zshrc && cd ${pwd} && ${command}`,
  ]);
  const initialMessage = {
    pid: child.pid,
    createdAt: new Date().toISOString(),
    type: "input",
    message: command,
  };
  event.reply("start-spawn", initialMessage);
  processes[child.pid] = child;
  childProcesses = {
    ...childProcesses,
    [child.pid]: {
      createdAt: new Date().toISOString(),
      output: [initialMessage],
      pid: child.pid,
      command,
      pwd,
    },
  };

  event.reply("pids", childProcesses);

  child.stdout.on("data", (data) => {
    const value = {
      pid: child.pid,
      createdAt: new Date().toISOString(),
      type: "data",
      message: data.toString(),
    };
    const output = data.toString("utf-8");
    if (
      output.includes("\x1Bc") ||
      output.includes("\u001b[2J") ||
      output.includes("\x1b[2J") ||
      output.includes("\x1b[H") ||
      output.includes("\x1b[3J") ||
      output.includes("\x1b[2J\x1b[0;0H")
    ) {
      childProcesses[child.pid].output = [];
      event.reply("clear", { pid: child.pid });
    } else {
      childProcesses[child.pid].output.push(value);
      event.reply("message", value);
    }
    event.reply("pids", childProcesses);
  });

  // Capture stderr
  child.stderr.on("data", (data) => {
    const value = {
      pid: child.pid,
      createdAt: new Date().toISOString(),
      type: "error",
      message: data.toString(),
    };
    childProcesses[child.pid].output.push(value);
    event.reply("pids", childProcesses);
    event.reply("message", value);
  });

  // Handle process close
  child.on("close", (code, data) => {
    const hasProcess = child.pid in processes;
    delete processes[child.pid];
    delete childProcesses[child.pid];
    if (hasProcess) {
      event.reply("pids", childProcesses);
      event.reply("close", {
        pid: child.pid,
        createdAt: new Date().toISOString(),
        type: "close",
        pid: child.pid,
        message: `closed process ${child.pid}`,
        data,
      });
    }
  });

  child.on("exit", (code, data) => {
    const hasProcess = child.pid in processes;
    delete processes[child.pid];
    delete childProcesses[child.pid];
    if (hasProcess) {
      event.reply("pids", childProcesses);
      event.reply("close", {
        pid: child.pid,
        createdAt: new Date().toISOString(),
        type: "exit",
        pid: child.pid,
        message: `closed process ${child.pid}`,
        data,
      });
    }
  });
});

ipcMain.on("get-pids", (event) => {
  console.log(childProcesses);
  event.reply("pids", childProcesses);
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
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
