import { toast } from 'react-toastify';
import { cmd } from '../node/node-exports';
const { spawn } = window.require('child_process');

export const getCurrentBranch = async () => {
  try {
    return (await cmd(`git branch --show-current`)).trim();
  } catch (err) {
    return '';
  }
}

export const hasRemoteBranch = async (currentBranch = '') => {
  try {
    await cmd(`git show-branch remotes/origin/${currentBranch}`);
    return true;
  } catch (err) {
    return false;
  }
}

export const createBranch = async (name) => {
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
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }

  } else {
    return false;
  }
}

export const checkoutBranch = async (branch, fallback) => {
  try {
    if (branch) {
      await cmd(`git checkout ${branch}`);
    } else {
      await cmd(`git checkout ${fallback}`);
    }
    return true;
  } catch (err) {
    console.log(err);
    if (err.toString().includes('Your local changes to the following files would be overwritten by checkout')) {
      toast.error(`Commit local changes or stash them before switching branches.`);
    }
    return false;
  }
}

export const getBranches = async () => {
  const data = await cmd(`git for-each-ref --format='%(refname:short)' refs/heads/`);
  const list = data.split('\n').filter((item) => (!!item))
  const current = await getCurrentBranch();
  return { current, list }
}

const getParentBranch = () => false;

export const deleteBranch = async (defaultBranch, flags = '') => {
  try {
    const currentBranch = await getCurrentBranch();
    const parentBranch = getParentBranch(currentBranch) || defaultBranch;
    if (parentBranch && parentBranch !== currentBranch) {
      await cmd(`git checkout ${parentBranch}`);
      await cmd(`git branch -D ${currentBranch}`);
      if (flags.includes('-r') || flags.includes('--remote')) {
        await cmd(`git push origin -d ${currentBranch}`);
      }
      await fetch();
      return true;
    } else {
      return false;
    }
  } catch (err) {
    console.log(err);
    console.log('FALSE');
    return false;
  }
}

export const openRemote = async (flags = '') => {
  try {
    const currentBranch = await getCurrentBranch();
    const base = (await cmd(`git config remote.origin.url | cut -f2 -d. | tr ':' /`)).trim();
    if (flags.includes('--all') || flags.includes('-a')) {
      await cmd(`open https://github.${base}/branches`);
    } else {
      await cmd(`open "https://github.${base}/branches/all?query=${currentBranch}"`);
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const push = async (flags = []) => {
  try {
    const currentBranch = await getCurrentBranch();
    const hasRemote = await hasRemoteBranch(currentBranch);
    if (hasRemote) {
      await cmd(`git push`);
    } else if (!flags.includes('--disable-set-upstream')) {
      await cmd(`git push --set-upstream origin ${currentBranch}`);
      await cmd(`git push`);
    }
    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
}

export const fetch = async () =>
  new Promise((res, rej) => {
    const spn = spawn('git', ['fetch', '-p']);
    spn.on('error', (data) => {
      console.error(`error: ${data}`);
      rej(false);
    });

    spn.stdout.on('data', (data) => {
      res(true);
    });

    spn.stderr.on('data', (data) => {
      res(true);
    });

    spn.on('close', () => { res(true); });

    spn.on('exit', () => { res(true); });
  });

  export const update = async (defaultBranch, flags) => {

    try {
  
      let branch = defaultBranch;
      const currentBranch = await getCurrentBranch();
      if (!flags.includes('-s') && !flags.includes('--self')) {
        if (currentBranch !== branch) {
          branch = getParentBranch(currentBranch) || defaultBranch;
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
      if (!flags.includes('-s') && !flags.includes('--self')) {
        await cmd(`git checkout ${currentBranch}`);
        await cmd(`git merge ${branch}`);
      }
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  
  }

  export const clearBranch = async () => {
    try {
      await cmd(`git add .`);
      await cmd(`git stash`);
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  export const addCommitPush = async (des = '') => {
    try {
      if (des) {
        const description = des.replace(/"'/g, '');
        await cmd(`git add .`);
        await cmd(`git commit -m "${description}"`);
        await push(['--disable-set-upstream']);
        return true;
      } else {
        toast.error(`You need to add a description`);
      }
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  export const logCommits = async (defaultBranch) => {

    const currentBranch = await getCurrentBranch();
    const parentBranch = getParentBranch(currentBranch) || defaultBranch;
    if (parentBranch) {
      try {
        console.log();
        const files = await cmd(`git show --name-only --oneline ${parentBranch}..HEAD`);
        const split = files.split('\n');
        let key = '';
        return split.reduce((prev, item) => {
          if (item.includes(' ')) {
            key = item;
          }
          if (key !== item) {
            return { ...prev, [key]: [ ...(prev[key] || []), item ] }
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
  }

  export const renameBranch = async (branchName, flags) => {
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
      return true;
    } catch (err) {
      console.log(err);
      return false;
    }
  }