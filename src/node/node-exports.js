const { spawn, exec } = window.require("child_process");

export const cmd = (value) =>
  new Promise((resolve, reject) => {
    exec(value, { shell: "/bin/zsh" }, (error, stdout, stderror) => {
      if (error) {
        reject(error);
      }
      if (stderror) {
        resolve(stderror);
      }
      resolve(stdout);
    });
  });

export const setupChild = (child, { onOut, onClose }) => {
  child?.on("error", (data) => {
    console.error(`error: ${data}`);
    onOut(child.pid, { type: "error", data });
  });

  child.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    onOut(child.pid, { type: "data", data: data.toString() });
  });

  child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
    onOut(child.pid, { type: "error", data: data.toString() });
  });

  child?.on("close", () => {
    onClose(child.pid);
  });

  return child;
};

export const terminal = ({ command, onOut, onClose }) => {
  const server = spawn("zsh", ["-c", "source ~/.zshrc && " + command]);

  server.on("error", (data) => {
    onOut(server.pid, { type: "error", data });
  });

  server.stdout.on("data", (data) => {
    onOut(server.pid, { type: "data", data: data.toString() });
  });

  server.stderr.on("data", (data) => {
    onOut(server.pid, { type: "error", data: data.toString() });
  });

  server.on("close", () => {
    onClose(server.pid);
  });

  return server;
};

export const startServer = () => {
  const server = spawn("node", ["server.js"]);

  server.on("error", (data) => {
    console.error(`error: ${data}`);
  });

  server.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
  });

  server.stderr.on("data", (data) => {
    console.log(data);
    console.error(`stderr: ${data}`);
  });

  return server;
};

// kill $(lsof -t -i:8080)
