import { toast } from "react-toastify";
import { cmd } from "../node/node-exports";
const { spawn } = window.require("child_process");

export const checkoutBranch = async (branch, options = {}) => {
  const { flags = "" } = options;
  try {
    const isStashing = flags.includes("-s") || flags.includes("--stash");
    if (isStashing) {
      await cmd(`git stash`);
    }
    await cmd(`git checkout ${branch}`);
    if (isStashing) {
      await cmd(`git stash apply`);
    }
  } catch (err) {
    if (
      err
        .toString()
        .includes(
          "Your local changes to the following files would be overwritten by checkout"
        )
    ) {
      toast.error(
        `Commit local changes or stash them before switching branches.`
      );
    }
    throw err;
  }
};

export const createBranch = async (name, options = {}) => {
  const { flags = "" } = options;
  if (name) {
    try {
      const hasStatus = !!(await cmd(`git status --porcelain`));
      if (hasStatus) {
        await cmd(`git stash`);
      }
      const currentBranch = await getCurrentBranch();
      const hasRemote = await hasRemoteBranch(currentBranch);
      if (hasRemote) {
        await cmd(`git pull origin ${currentBranch}`);
      }
      await cmd(`git checkout -b ${name}`);
      if (hasStatus) {
        await cmd(`git stash apply`);
      }
    } catch (err) {
      console.log(err);
      throw err;
    }
  } else {
    toast.error(`New branches need a name!`);
    throw "New branches need a name!";
  }
};

export const deleteBranch = async (options = {}) => {
  const { flags = "", currentBranch = "", parentBranch = "" } = options;
  try {
    if (parentBranch && parentBranch !== currentBranch) {
      await cmd(`git checkout ${parentBranch}`);
      await cmd(`git branch -D ${currentBranch}`);
      if (flags.includes("-r") || flags.includes("--remote")) {
        await cmd(`git push origin -d ${currentBranch}`);
      }
      await fetch();
    } else {
      throw `Error: ${parentBranch} -- ${currentBranch}`;
    }
  } catch (err) {
    throw err;
  }
};

export const clearBranch = async (options = {}) => {
  const { flags = "" } = options;
  try {
    if (flags.includes("--undo") || flags.includes("-u")) {
      await cmd(`git stash pop`);
    } else {
      await cmd(`git add .`);
      await cmd(`git stash`);
    }
  } catch (err) {
    throw err;
  }
};

export const push = async (options) => {
  const { flags = "", currentBranch = "" } = options;
  try {
    const hasRemote = await hasRemoteBranch(currentBranch);
    if (hasRemote) {
      await cmd(`git push`);
    } else if (!flags.includes("--disable-set-upstream")) {
      await cmd(`git push --set-upstream origin ${currentBranch}`);
      await cmd(`git push`);
    }
  } catch (err) {
    throw err;
  }
};

export const addCommitPush = async (des = "", options = {}) => {
  try {
    if (des) {
      const description = des.replace(/"'/g, "");
      await cmd(`git add .`);
      await cmd(`git commit -m "${description}"`);
      await push({ ...options, flags: "--disable-set-upstream" });
    } else {
      toast.error(`You need to add a description`);
    }
  } catch (err) {
    throw err;
  }
};

export const update = async (options) => {
  const { flags = "", currentBranch = "", parentBranch = "" } = options;
  try {
    let branch = parentBranch;
    if (!flags.includes("-s") && !flags.includes("--self")) {
      if (currentBranch !== branch) {
        branch = parentBranch;
        if (!branch) {
          console.log(`Can't seem to detect a parent branch.`);
          return;
        }
      }
    } else {
      branch = currentBranch;
    }

    await cmd(`git checkout ${branch}`);
    await cmd(`git pull origin ${branch}`);
    if (!flags.includes("-s") && !flags.includes("--self")) {
      await cmd(`git checkout ${currentBranch}`);
      await cmd(`git merge ${branch}`);
    }
  } catch (err) {
    throw err;
  }
};

export const openRemote = async (options) => {
  const { flags = "", currentBranch = "" } = options;
  try {
    const base = (
      await cmd(`git config remote.origin.url | cut -f2 -d. | tr ':' /`)
    ).trim();
    let url = "";
    if (flags.includes("--all") || flags.includes("-a")) {
      url = `https://github.${base}/branches`;
    } else {
      url = `https://github.${base}/branches/all?query=${currentBranch}`;
    }
    if (flags.includes("-c") || flags.includes("--copy")) {
      navigator.clipboard.writeText(url);
      toast.success(`Copied branch URL`);
    } else {
      await cmd(`open "${url}"`);
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

export const hasRemoteBranch = async (currentBranch = "") => {
  try {
    await cmd(`git show-branch remotes/origin/${currentBranch}`);
    return true;
  } catch (err) {
    return false;
  }
};

export const fetch = async () =>
  new Promise((res, rej) => {
    const spn = spawn("git", ["fetch", "-p"]);
    spn.on("error", (data) => {
      console.error(`error: ${data}`);
      rej(false);
    });

    spn.stdout.on("data", (data) => {
      res(true);
    });

    spn.stderr.on("data", (data) => {
      res(true);
    });

    spn.on("close", () => {
      res(true);
    });

    spn.on("exit", () => {
      res(true);
    });
  });

export const logCommits = async (parentBranch) => {
  if (parentBranch) {
    try {
      console.log();
      const files = await cmd(
        `git show --name-only --oneline ${parentBranch}..HEAD`
      );
      const split = files.split("\n");
      let key = "";
      return split.reduce((prev, item) => {
        if (item.includes(" ")) {
          key = item;
        }
        if (key !== item) {
          return { ...prev, [key]: [...(prev[key] || []), item] };
        }
        return prev;
      }, {});
      return split;
    } catch (err) {
      console.log(err);
      return [];
    }
  } else {
    return [];
  }
};

export const handleFile = async (filepath, options) => {
  const { flags = "", parentBranch = "" } = options;
  if (flags.includes("-ch") || flags.includes("--checkout")) {
    try {
      await cmd(`git checkout ${parentBranch} -- ${filepath}`);
    } catch (err) {
      throw err;
    }
  }
};

export const renameBranch = async (branchName, options) => {
  const { flags = "" } = options;
  try {
    if (branchName) {
      const currentBranch = await getCurrentBranch();
      const hasRemote = await hasRemoteBranch(currentBranch);
      await cmd(`git branch -m ${branchName}`);
      // TODO: Update repos.json
      toast.success(`Renamed local branch ${currentBranch} -> ${branchName}`);
      if (hasRemote) {
        await cmd(`git push origin -u ${branchName}`);
        toast.success(`Update remote branch to ${branchName}`);
      } else {
        toast.warn(`Couldn't find a remote branch for ${currentBranch}`);
      }
    }
  } catch (err) {
    throw err;
  }
};

///// ***************
export const getCurrentBranch = async () => {
  try {
    return (await cmd(`git branch --show-current`)).trim();
  } catch (err) {
    return "";
  }
};

export const getBranches = async () => {
  const data = await cmd(
    `git for-each-ref --format='%(refname:short)' refs/heads/`
  );
  const list = data.split("\n").filter((item) => !!item);
  const current = await getCurrentBranch();
  const hasRemote = await hasRemoteBranch(current);
  return { current, list, hasRemote };
};

const getParentBranch = () => false;

export const getStatus = async () => {
  try {
    const promises = await Promise.allSettled([
      cmd(`git ls-files --others --exclude-standard`),
      cmd(`git ls-files --deleted`),
      cmd(`git ls-files --modified`),
      cmd(`git diff --numstat`),
    ]);
    const keys = ["untracked", "deleted", "modified"];

    let prev = { lastUpdate: new Date().toISOString() };

    for (let idx = 0; idx < promises.length; idx++) {
      const item = promises[idx];
      if (item.status === "fulfilled") {
        const value = (item?.value?.split("\n") || []).filter((v) => !!v);
        if (idx < 3) {
          if (idx === 0) {
            let fileCount = {};
            for (const filename of value) {
              let data = await cmd(`wc -l ${filename}`);
              data = data.replace(/\n/g, "");
              data = data.split(" ").filter((v) => !!v);
              const [count, file] = data;
              fileCount = { ...fileCount, [file]: Number(count) + 1 };
            }
            prev = { ...prev, fileCount };
          } else if (idx === 2) {
            const list = value.filter((item) => !prev.deleted.includes(item));
            prev = { ...prev, [keys[idx]]: list };
            continue;
          }
          prev = { ...prev, [keys[idx]]: value };
          continue;
        } else {
          const files = value.reduce((p, item) => {
            const [adds, deletes, filename] = item.split("\t");
            return { ...p, [filename]: { adds, deletes } };
          }, {});
          prev = { ...prev, files };
        }
      }
    }
    return prev;
  } catch (err) {
    console.log(err);
    return {
      untracked: [],
      modified: [],
      deleted: [],
      lastUpdate: "",
    };
  }
  // { untracked, modified, deleted };
};
