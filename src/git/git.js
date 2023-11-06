import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { StoreContext } from "../context/store";
import { useKeyboard } from "../hooks/use-keyboard";
import { read } from "../node/fs-utils";
import { cmd as execCmd } from "../node/node-exports";
import { Button, colors, Div, Text } from "../shared";
import { Input } from "../shared";
import { animation, flex, shadows } from "../shared/utils";
import { SetupBm } from "./setup-bm";
import {
  addCommitPush,
  checkoutBranch,
  fetch,
  getBranches,
  getStatus,
  openRemote,
  push,
} from "./utils";
import {
  ArrowFatLineRight,
  ArrowSquareRight,
  CloudCheck,
  CloudSlash,
  Copy,
  GitBranch,
  KeyReturn,
  Terminal,
  TerminalWindow,
  Tree,
} from "phosphor-react";
import { css } from "@emotion/css";
import { useAnimation } from "../hooks/use-animation";
import { Status } from "./status";
import { CmdList } from "./cmd-list";
import { Logs } from "./logs";
import { toast } from "react-toastify";
import { Loader } from "../shared/loader";
import { defaultActions } from "../settings/actions";
import { useOutsideClick } from "../shared/use-outside-click";

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

  const [branchOptions, setBranchOptions] = useState(false);
  const branchRef = useOutsideClick(() => setBranchOptions(false));

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
      parentBranch,
      flags: executingCommand,
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

      if (executingCommand.startsWith("git")) {
        await execCmd(executingCommand);
        methods.set(
          "lastCommand",
          `${executingCommand}-${new Date().toISOString()}`
        );
      } else {
        await commandDetails.function({
          command,
          context,
        });
        methods.set(
          "lastCommand",
          `${commandDetails.command}-${new Date().toISOString()}`
        );
      }
      refreshGit();
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

  const handleCheckout = async (branch) => {
    try {
      await checkoutBranch(branch);
      refreshGit();
    } catch {}
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

            <form
              onSubmit={handleCmd}
              className={css`
                position: relative;
              `}
            >
              {loading ? <Loader /> : null}
              <Input
                disabled={loading}
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                ref={ref}
              />
              <Button
                css={`
                  position: absolute;
                  top: 0;
                  right: 8px;
                  transition: color 0.2s ease;
                  color: ${colors.darkIndigo};
                  :hover {
                    background: none;
                    color: ${colors.lightIndigo};
                  }
                  svg {
                    border-radius: 30px;
                  }
                `}
                onClick={handleCmd}
                icon
                dark
              >
                <ArrowSquareRight weight="fill" size={40} />
              </Button>
            </form>
            <Div
              css={`
                position: relative;
                width: 150px;
                max-width: max-content;
                min-width: 250px;
                transition: width 0.3s ease;
                :hover {
                  width: 100%;
                  animation 0.3s ease grow;
                }
              `}
            >
              <Div
                css={`
                  width: 100%;
                  ${flex("space-between")}
                  border: 1px solid transparent;
                  border-radius: 16px;
                  padding: 8px 16px;
                  cursor: pointer;
                  transition: background-color 0.2s ease;
                  background-color: ${colors.indigo};
                  box-sizing: border-box;
                  :hover {
                    background-color: ${colors.lightIndigo};
                    ${shadows.md}
                  }
                  p {
                    margin-right: 16px;
                  }
                  svg {
                    min-width: 32px;
                  }
                `}
                onClick={(e) => {
                  setBranchOptions(true);
                }}
              >
                <Text h3 ellipsis>
                  {branches?.current}
                </Text>
                {branches?.hasRemote ? (
                  <CloudCheck
                    size={32}
                    color={colors.lightGreen}
                    weight="fill"
                  />
                ) : (
                  <CloudSlash size={32} color={colors.red} weight="fill" />
                )}
              </Div>
              {branchOptions ? (
                <Div
                  ref={branchRef}
                  css={`
                    ${animation("fadeIn", ".2s ease")}
                    position: absolute;
                    pointer-events: all;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 300px;
                    background-color: ${colors.indigo};
                    border: 1px solid white;
                    border-radius: 16px;
                    z-index: 100000;
                    overflow: auto;
                    overflow-x: hidden;
                    max-height: 500px;
                    ${shadows.lg}
                    > div {
                      ${flex("space-between")}
                      cursor: pointer;
                      padding: 0 8px;
                      padding-left: 16px;
                      width: 100%;
                      transition: background-color 0.2s ease;
                      font-weight: bold;
                      box-sizing: border-box;
                      height: 40px;
                      :hover {
                        background-color: ${colors.darkIndigo};
                      }
                      :not(:hover) {
                        button {
                          visibility: hidden;
                        }
                      }
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <Div css={``} onClick={handleRemote}>
                    <Text ellipsis>
                      {branches.hasRemote
                        ? `Open Remote - ${branches?.current}`
                        : `Create Remote - ${branches?.current}`}
                    </Text>
                  </Div>
                  <hr
                    className={css`
                      padding: 0;
                      margin: 0;
                    `}
                  />
                  {branches?.list?.map((item) => (
                    <Div
                      css={``}
                      onClick={(e) => {
                        handleCheckout(item);
                        setBranchOptions(false);
                      }}
                    >
                      <Text
                        css={`
                          ${item === branches?.current
                            ? `color: ${colors.lightGreen};`
                            : ""}
                        `}
                      >
                        {item}
                      </Text>
                      <Button
                        icon
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(item);
                        }}
                      >
                        <Copy size={16} />
                      </Button>
                    </Div>
                  ))}
                </Div>
              ) : null}
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
