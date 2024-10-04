const fs = require("fs");

const deleteFile = (path) => {
  try {
    fs.unlinkSync(path);
  } catch {}
};

const write = (path, data, options = {}) => {
  const dir = path.substring(0, path.lastIndexOf("/"));
  if (dir) {
    const exists = fs.existsSync(dir);
    if (!exists) {
      console.log(">>>", dir, "<<<<");
      fs.mkdirSync(dir, { recursive: true });
    }

    if (options?.type === "raw") {
      fs.writeFileSync(path, data);
    } else {
      const json = JSON.stringify(data, null, 2);
      fs.writeFileSync(path, json);
    }
  }
};

const read = (path, defaultValue) => {
  try {
    const raw = fs.readFileSync(path, "utf8");
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
};

const getFilesInDirectory = (dir, showHidden = false) => {
  try {
    const dirs = fs.readdirSync(dir, { withFileTypes: true }).map((file) => {
      return {
        name: file.name,
        isFile: file.isFile(),
        isFolder: file.isDirectory(),
      };
    });
    const list = showHidden
      ? dirs
      : dirs.filter(({ name }) => !name.startsWith("."));
    return list;
  } catch {
    return [];
  }
};

module.exports = { read, write, getFilesInDirectory, deleteFile };
