import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { StoreContext } from "../context/store";
import { useKeyboard } from "../hooks/use-keyboard";
import { read } from "../node/fs-utils";
import { colors, Div, Text } from "../shared";
import { Input } from "../shared";
import { animation, flex, shadows } from "../shared/utils";
import { SetupBm } from "./setup-bm";
import {
  addCommitPush,
  checkoutBranch,
  clearBranch,
  createBranch,
  deleteBranch,
  fetch,
  getBranches,
  getStatus,
  openRemote,
  push,
  update,
} from "./utils";
import { CloudCheck, CloudSlash, Tree } from "phosphor-react";
import { css } from "@emotion/css";
import { useAnimation } from "../hooks/use-animation";
import { Status } from "./status";
import { CmdList } from "./cmd-list";
import { Logs } from "./logs";
import { toast } from "react-toastify";
import { Loader } from "../shared/loader";

const fs = window.require("fs");
const chokidar = window.require("chokidar");
const parse = require("parse-gitignore");

const commands = [
  {
    name: "Update",
    command: "update",
    args: "",
    flags: "",
    description:
      "Pulls parent origin and then automatically merges the parent branch into the current branch.",
  },
  {
    name: "Add + Commit + Push",
    command: ".",
    args: "",
    flags: "",
    description:
      "Adds all unstaged files, commits all files with a description message and then pushes everything if a remote branch exists.",
  },
  {
    name: "New",
    command: "new",
    args: "{name}",
    flags: "",
    description:
      "Updates current branch if a remote branch exists and then creates a new branch with the current set as parent.",
  },
  {
    name: "Checkout",
    command: "checkout",
    args: "{name}",
    flags: "-s --stash",
    description: "Checkout a branch.",
  },
  {
    name: "Delete",
    command: "delete",
    args: "",
    flags: "-r --remote",
    description:
      "Delete the current branch. With the -r flag it will delete the remote branch.",
  },
  {
    name: "Push",
    command: "push",
    args: "",
    flags: "",
    description:
      "git push or if no remote branch exists it will automatically set the upstream branch",
  },
  {
    name: "Status",
    command: "status",
    args: "",
    flags: "",
    description: "Refresh displayed status.",
  },

  {
    name: "Clear",
    command: "clear",
    args: "",
    flags: "",
    description: "Clears all uncommitted changes.",
  },
  {
    name: "Rename",
    command: "rename",
    args: "{branchName}",
    flags: "",
    description:
      "Renames local branch and attempts to rename the remote branch.",
  },
  {
    name: "Fetch",
    command: "fetch",
    args: "",
    flags: "",
    description: "git fetch -p",
  },
  {
    name: "Remove (file)",
    command: "rm",
    args: "{relative filepath}",
    flags: "",
    description: "Remove a file by filepath.",
  },
];

export const Git = () => {
  const {
    store: { settings = {}, repos = {}, lastCommand = "" },
    methods,
  } = useContext(StoreContext);

  const ref = useRef();
  const positionRef = useRef();

  const [index, setIndex] = useState(0);
  const [cmd, setCmd] = useState("");
  const [lastCmd, setLastCmd] = useState("");
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState({});
  const [status, setStatus] = useState({});

  const [showBranches, setShowBranches] = useState(false);

  const parentBranch =
    repos?.[settings?.pwd]?.branches?.[branches?.current]?.parentBranch ||
    repos?.[settings?.pwd]?.defaultBranch;

  const animateShake = {
    animation: animation("shake", ".35s ease"),
    timing: 400,
  };
  const { animation: shakeTree } = useAnimation(animateShake, [lastCmd]);

  const refreshGit = async () => {
    const branches = await getBranches();
    setBranches(branches);
    const status = await getStatus();
    setStatus(status);
  };

  useEffect(() => {
    let watcher = null;
    if (settings?.pwd) {
      try {
        const ignore = parse(fs.readFileSync(".gitignore")) || [];
        watcher = chokidar
          .watch(".", {
            ignored: [...ignore.patterns, /(^|[\/\\])\../],
            ignoreInitial: true,
          })
          .on("all", (event, path) => {
            refreshGit();
          });
      } catch (err) {
        console.log(err);
      }
    }
    return () => watcher?.close();
  }, [settings?.pwd]);

  const [_, cmd2 = ""] = cmd?.split(" ") || [];
  const checkoutList = branches?.list?.filter?.((item) =>
    item.toLowerCase().includes(cmd2.toLowerCase())
  );

  const handleCmd = async (event, executingCommand = cmd) => {
    event?.preventDefault();
    if (executingCommand.includes("clear")) {
      console.clear();
    }

    const { command } = list[index];

    const [value, ...args] = executingCommand.split(" ");
    setLoading(true);

    const options = {
      flags: executingCommand,
      parentBranch,
      currentBranch: branches?.current,
    };
    setCmd("");
    setLastCmd(new Date().toISOString());
    try {
      if (command === "checkout") {
        await checkoutBranch(checkoutList?.[0], options);
      } else if (command === "delete") {
        await deleteBranch(options);
        if (settings?.[settings?.pwd]?.branches?.[options?.currentBranch]) {
          let nextBranches = settings?.[settings?.pwd]?.branches;
          delete nextBranches[options.currentBranch];
          methods.updateRepos({
            [settings?.pwd]: {
              ...repos?.[settings?.pwd],
              branches,
            },
          });
        }
      } else if (command === "update") {
        await update(options);
      } else if (command === "push") {
        await push(options);
      } else if (command === "clear") {
        await clearBranch(options);
      } else if (command === "fetch") {
        await fetch();
      } else if (command === ".") {
        const description = args.filter((v) => !v.startsWith("-")).join(" ");
        await addCommitPush(description, options);
      } else if (command === "new") {
        console.log(command, args[0]);
        await createBranch(args[0], options);
        methods.updateRepos({
          [settings?.pwd]: {
            ...repos?.[settings?.pwd],
            branches: {
              ...(repos?.[settings?.pwd]?.branches || {}),
              [args[0]]: {
                parentBranch: options?.currentBranch,
                createdAt: new Date().toISOString(),
              },
            },
          },
        });
      }
      refreshGit();
      methods.set("lastCommand", `${command}-${new Date().toISOString()}`);
    } catch (err) {
      console.log(err);
      toast.error("There was an error.");
    } finally {
      setLoading(false);
    }
  };

  const completeMerge = async () => {
    try {
      setLoading(true);
      const description = `Merge branch '${parentBranch}' into '${branches.current}'`;
      await addCommitPush(description);
      refreshGit();
      methods.set("lastCommand", `complete-merge-${new Date().toISOString()}`);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIndex(0);
  }, [cmd]);

  useEffect(() => {
    const data = read(`${settings.base}/bm-cache/repos.json`, {});
    methods.updateRepos(data);

    refreshGit();

    // fetchCurrentBranch();
  }, [settings.pwd]);

  const list = useMemo(() => {
    if (!cmd) {
      return commands;
    }
    let value = cmd;
    if (cmd.includes(" ")) {
      const [command] = cmd.split(" ");
      value = command;
    }

    const lowerCase = value?.toLowerCase();

    const filtered = commands.filter(
      (item) =>
        item?.name?.toLowerCase().includes(lowerCase) ||
        item?.command?.toLowerCase().includes(lowerCase)
    );

    return filtered.sort((a, b) => {
      const aCommand = a?.command?.toLowerCase();
      const bCommand = b?.command?.toLowerCase();
      const acIdx = aCommand.indexOf(lowerCase);
      const bcIdx = bCommand.indexOf(lowerCase);

      if (acIdx > -1 && bcIdx > -1) {
        return acIdx - bcIdx;
      }

      const aName = a?.name?.toLowerCase();
      const bName = b?.name?.toLowerCase();
      const anIdx = aName.indexOf(lowerCase);
      const bnIdx = bName.indexOf(lowerCase);

      if (anIdx > -1 && bnIdx > -1) {
        return anIdx - bnIdx;
      }
      return -1;
    });
  }, [cmd]);

  const handleRemote = async () => {
    if (branches.hasRemote) {
      openRemote({
        flags: "",
        currentBranch: branches?.current,
      });
    } else {
      try {
        setLoading(true);
        await push({ currentBranch: branches.current });
        await refreshGit();
      } catch (err) {
        console.log(err);
        toast.error("Error setting upstream branch.");
      } finally {
        setLoading(false);
      }
    }
  };

  const keydown = async (captured, event) => {
    if (captured === "+Tab") {
      event.preventDefault();
      let nextIndex = index + 1;
      if (nextIndex >= list.length) {
        nextIndex = 0;
      }
      setIndex(nextIndex);
    } else if (captured === "+Escape") {
      setCmd("");
    } else if (captured === "+Space") {
      if (!cmd.includes(" ")) {
        const command = list[index]?.command;
        setCmd(command);
      }
    } else if (captured === "meta+KeyR") {
      event.stopPropagation();
      event.preventDefault();
      if (branches.hasRemote) {
        openRemote({
          flags: cmd,
          currentBranch: branches?.current,
        });
      } else {
        toast.error(`No remote branch detected.`);
      }
    } else {
      ref.current.focus();
    }
  };

  useKeyboard({ keydown });

  useEffect(() => {
    document.addEventListener("click", () => setShowBranches(false));
    return () =>
      document.removeEventListener("click", () => setShowBranches(false));
  }, []);
  const box = positionRef?.current?.getBoundingClientRect();
  return (
    <Div
      ref={positionRef}
      css={`
        padding: 0 16px;
        margin: 16px 0;
      `}
    >
      {settings?.pwd in repos ? (
        <Div
          css={`
            height: calc(100vh - ${box?.top + 16}px);
            ${flex("start column")}
            overflow-y: auto;
            overflow-x: hidden;
            box-sizing: border-box;
          `}
        >
          <Div
            css={`
              ${flex("left")}
              width: 100%;
              box-sizing: border-box;
              select {
                width: 200px;
                padding: 12px 8px;
                border-radius: 8px;
                outline: none;
                cursor: pointer;
              }
              form {
                position: relative;
                flex-grow: 1;
                margin-right: 8px;
                input {
                  width: calc(100% - 24px);
                  transition: background-color 0.25s ease;
                }
              }
              svg {
                min-width: 32px;
              }
            `}
          >
            <Tree
              size={32}
              color="white"
              weight="bold"
              className={css`
                padding-right: 8px;
                ${shakeTree}
              `}
            />
            <form onSubmit={handleCmd}>
              {loading ? <Loader /> : null}
              <Input
                disabled={loading}
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                ref={ref}
              />
            </form>
            <Div
              css={`
                position: relative;
                ${flex("space-between")}
                border: 1px solid transparent;
                border-radius: 16px;
                padding: 8px 16px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                width: 150px;
                max-width: max-content;
                min-width: 150px;
                transition: width 0.3s ease;
                :hover {
                  width: 100%;
                  animation 0.3s ease grow;
                  background-color: ${colors.lightIndigo};
                  ${shadows.md}
                }
                background-color: ${colors.indigo};
                p {
                  margin-right: 16px;
                }
                svg {
                  min-width: 32px;
                }
              `}
              onClick={handleRemote}
              onContextMenu={() => {
                setShowBranches(true);
              }}
            >
              <Text h3 ellipsis>
                {branches?.current}
              </Text>
              {branches?.hasRemote ? (
                <CloudCheck size={32} color={colors.lightGreen} weight="fill" />
              ) : (
                <CloudSlash size={32} color={colors.red} weight="fill" />
              )}
            </Div>
          </Div>

          <CmdList
            list={list}
            index={index}
            cmd={cmd}
            setCmd={(value) => {
              setCmd(`${value} `);
              ref?.current?.focus();
            }}
            checkoutList={checkoutList}
          />
          <Status
            status={status}
            currentBranch={branches?.current}
            parentBranch={parentBranch}
            completeMerge={completeMerge}
          />
          <Logs
            parentBranch={parentBranch}
            lastCommand={lastCommand}
            pwd={settings?.pwd}
          />
        </Div>
      ) : (
        <SetupBm />
      )}
    </Div>
  );
};
