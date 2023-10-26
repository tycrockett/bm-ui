import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { StoreContext } from "../context/store";
import { useKeyboard } from "../hooks/use-keyboard";
import { read } from "../node/fs-utils";
import { Button, colors, Div, Text } from "../shared";
import { Input } from "../shared";
import { animation, flex, shadows } from "../shared/utils";
import { SetupBm } from "./setup-bm";
import {
  addCommitPush,
  getBranches,
  getStatus,
  openRemote,
  push,
} from "./utils";
import { CloudCheck, CloudSlash, Tree } from "phosphor-react";
import { css } from "@emotion/css";
import { useAnimation } from "../hooks/use-animation";
import { Status } from "./status";
import { CmdList } from "./cmd-list";
import { Logs } from "./logs";
import { toast } from "react-toastify";
import { Loader } from "../shared/loader";
import { defaultActions } from "../settings/actions";

const fs = window.require("fs");
const chokidar = window.require("chokidar");
const parse = require("parse-gitignore");

export const Git = () => {
  const context = useContext(StoreContext);
  const {
    store: { extensions = [], settings = {}, repos = {}, lastCommand = "" },
    methods,
  } = context;

  const commands = extensions
    .filter((item) => item?.executionType === "command")
    .map((item) => item.command);

  const actions = {
    ...defaultActions,
    ...(settings?.actions || {}),
  };

  const ref = useRef();
  const positionRef = useRef();

  const [index, setIndex] = useState(0);
  const [cmd, setCmd] = useState("");
  const [lastCmd, setLastCmd] = useState("");
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState({});
  const [status, setStatus] = useState({});

  const [showBranches, setShowBranches] = useState(false);

  const repo = repos?.[settings?.pwd]?.branches?.[branches?.current];

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

    const commandDetails = list[index];

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
      const command = {
        args,
        options,
        filteredBranchList: checkoutList,
      };

      await commandDetails.function({
        command,
        context,
      });
      refreshGit();
      methods.set(
        "lastCommand",
        `${commandDetails.command}-${new Date().toISOString()}`
      );
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
    methods.setRepos(data);
    refreshGit();
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

  const handleGit = (key, list) => {
    if (key === "open-github") {
      if (branches.hasRemote) {
        openRemote({
          flags: cmd,
          currentBranch: branches?.current,
        });
      } else {
        toast.error(`No remote branch detected.`);
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
    } else {
      const entries = Object.entries(actions);
      const entry = entries?.find(([_, item]) => item?.shortkey === captured);

      if (entry?.length) {
        const [key, item] = entry;
        if (item?.type === "git") {
          event.preventDefault();
          event.stopPropagation();
          handleGit(key, item?.list);
        }
      } else {
        ref.current.focus();
      }
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
            <Button
              icon
              css={`
                margin-right: 8px;
              `}
              onClick={(e) => handleCmd(e, "fetch")}
            >
              <Tree
                size={32}
                color="white"
                weight="bold"
                className={css`
                  ${shakeTree}
                `}
              />
            </Button>

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
            handleCmd={handleCmd}
            setCmd={(value) => {
              setCmd(`${value} `);
              ref?.current?.focus();
            }}
            checkoutList={checkoutList}
          />
          <Text
            css={`
              margin-bottom: 8px;
              width: 100%;
              text-align: left;
            `}
            h3
          >
            {repo?.description}
          </Text>

          <Status
            status={status}
            currentBranch={branches?.current}
            parentBranch={parentBranch}
            completeMerge={completeMerge}
          />
          <Logs
            currentBranch={branches?.current}
            repo={repos?.[settings?.pwd]}
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
