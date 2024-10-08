const path = require("path");
const psTree = require("ps-tree");
const { app, BrowserWindow, ipcMain } = require("electron");
const isDev = require("electron-is-dev");
const { spawn } = require("child_process");
// const { pid } = require("process");

let childProcesses = {};

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 550,
    height: 600,
    title: "BM GUI",
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
    win.webContents.openDevTools({ mode: "detach" });
  }
}

let processes = {};

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
    "-c",
    `source ~/.zshrc && cd ${pwd} && ` + command,
  ]);
  processes[child.pid] = child;
  childProcesses = {
    ...childProcesses,
    [child.pid]: {
      createdAt: new Date().toISOString(),
      output: [
        {
          type: "input",
          message: command,
        },
      ],
      pid: child.pid,
      command,
      pwd,
    },
  };

  event.reply("start-spawn", child.pid);
  event.reply("pids", childProcesses);

  child.stdout.on("data", (data) => {
    const value = {
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
    } else {
      childProcesses[child.pid].output.push(value);
    }
    event.reply("pids", childProcesses);
    event.reply("message", value);
  });

  // Capture stderr
  child.stderr.on("data", (data) => {
    const value = {
      type: "error",
      message: data.toString(),
    };
    childProcesses[child.pid].output.push(value);
    event.reply("pids", childProcesses);
    event.reply("message", value);
  });

  // Handle process close
  child.on("close", (code) => {
    const hasProcess = child.pid in processes;
    delete processes[child.pid];
    delete childProcesses[child.pid];
    if (hasProcess) {
      event.reply("pids", childProcesses);
      event.reply("close", {
        type: "close",
        pid: child.pid,
        message: `closed process ${child.pid}`,
      });
    }
  });

  child.on("exit", (code) => {
    const hasProcess = child.pid in processes;
    delete processes[child.pid];
    delete childProcesses[child.pid];
    if (hasProcess) {
      event.reply("pids", childProcesses);
      event.reply("close", {
        type: "close",
        pid: child.pid,
        message: `closed process ${child.pid}`,
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
