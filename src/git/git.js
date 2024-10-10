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
  getBranches,
  getStatus,
  openRemote,
  push,
} from "./utils";
import {
  ArrowElbowRightDown,
  CaretDown,
  CloudCheck,
  CloudSlash,
  Command,
  Copy,
  Terminal,
  Tree,
  Warning,
  X,
} from "phosphor-react";
import { css } from "@emotion/css";
import { useAnimation } from "../hooks/use-animation";
import { Status } from "./status";
import { CmdList } from "./cmd-list";
import { Commits } from "./commits";
import { toast } from "react-toastify";
import { Loader } from "../shared/loader";
import { defaultActions } from "../settings/actions";
import { useOutsideClick } from "../shared/use-outside-click";

import { useTerminal } from "../terminal/useTerminal";
import Ansi from "ansi-to-react";
import { scrollbar } from "../shared/styles";
import { set } from "lodash";

const fs = window.require("fs");
const chokidar = window.require("chokidar");
const parse = require("parse-gitignore");

export const Git = () => {
  const terminalRef = useRef();
  const context = useContext(StoreContext);
  const {
    store: {
      extensions = [],
      settings = {},
      ports = {},
      repos = {},
      logs = [],
      lastCommand = "",
    },
    methods,
  } = context;

  const terminal = useTerminal();

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
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState({});
  const [status, setStatus] = useState({});
  const [branchOptions, setBranchOptions] = useState(false);
  const [displayActions, setDisplayActions] = useState(false);
  const branchRef = useOutsideClick(() => setBranchOptions(false));
  const actionsRef = useOutsideClick(() => setDisplayActions(false));

  const [tab, setTab] = useState("git");

  const repo = repos?.[settings?.pwd]?.branches?.[branches?.current];

  const parentBranch =
    repos?.[settings?.pwd]?.branches?.[branches?.current]?.parentBranch ||
    repos?.[settings?.pwd]?.defaultBranch;

  const animateShake = {
    animation: animation("shake", ".35s ease"),
    timing: 400,
  };

  const { animation: shakeTree } = useAnimation(animateShake, [lastCommand]);

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

    setCmd("");
    setLoading(true);
    const lastCommand = `${executingCommand}-${new Date().toISOString()}`;

    if (executingCommand.includes("clear")) {
      console.clear();
    }

    const commandDetails = list[index];
    const [value, ...args] = executingCommand.split(" ");

    if (!commandDetails) {
      terminal.onSubmit(cmd);
      setLoading(false);
      setTab("terminal");
      methods.set("lastCommand", lastCommand);
      return;
    }
    if (tab === "terminal") {
      setTab("git");
    }

    const options = {
      parentBranch,
      executingCommand,
      flags: executingCommand,
      currentBranch: branches?.current,
      defaultBranch: repos?.[settings?.pwd]?.defaultBranch,
    };

    const command = {
      args,
      options,
      filteredBranchList: checkoutList,
      branches: branches.list,
    };

    try {
      if (executingCommand.startsWith("git")) {
        await execCmd(executingCommand);
      } else {
        await commandDetails.function({
          command,
          context,
        });
      }
      refreshGit();
    } catch (err) {
      console.log(err);
      methods.set("logs", [
        {
          timestamp: new Date().toISOString(),
          pwd: settings?.pwd,
          type: "command",
          title: `Error executing command - ${commandDetails?.command}`,
          message: err?.message || "",
          data: command,
        },
        ...logs,
      ]);
      toast.error("There was an error. Check logs for more information.");
    } finally {
      methods.set("lastCommand", lastCommand);
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
    } else if (cmd === "*") {
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

  useEffect(() => {
    if (cmd) {
      if (list[index]) {
        setTab("git");
      } else {
        setTab("terminal");
      }
    }
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

  const killMainPID = async (pid) => {
    await process.kill(pid);
    methods.set("lastCommand", `kill-pid-${new Date().toISOString()}`);
  };

  const basePath = settings?.pwd?.replace("~", settings?.base);

  const processes = Object.values(terminal?.processes?.children || {})?.filter(
    (item) =>
      new Date(item?.createdAt) < Date.now() - 1000 &&
      item?.pwd === settings?.pwd
  );

  const [terminalActions, setTerminalActions] = useState([]);

  const handleTerminalAction = (item) => {
    execCmd(item?.cmd);
    setDisplayActions(false);
  };

  const handleTerminalItem = (terminals) => {
    const fileMatch =
      /([a-zA-Z]:\\|\.{1,2}\/|\/)?([\w\s-]+[\/\\])*[\w\s-]+\.\w+/g;
    let processActions = {};
    for (const terminal of terminals) {
      const item = terminal?.output?.at(-1);
      if (!item) {
        return;
      }
      if (item?.message?.includes("[eslint]")) {
        const split = item?.message?.split("\n")?.filter((item) => item);
        const firstIndex = split.findIndex((item) => item.includes("[eslint]"));

        let indices = [];
        for (let i = firstIndex + 1; i < split.length; i++) {
          if (fileMatch.test(split[i])) {
            indices.push(i);
          }
        }

        let paths = [];
        const path = settings?.pwd?.replace("~", settings?.base);
        for (let i = 0; i < indices.length; i++) {
          const file = split[indices[i]];
          for (let j = indices[i]; j < split.length; j++) {
            if (split[j].includes("Line")) {
              const ss = split[j].split(" ").slice(5);
              const s = split[j].split(" ")?.[3];
              const line = s.split(":")?.[0];
              const column = s.split(":")?.[1];
              const label = `${file}:${line}:${column}`;
              paths.push({
                type: "eslint",
                label,
                description: ss.join(" "),
                cmd: `open -n -b "com.microsoft.VSCode" --args -g "${path}/${file}:${line}"`,
              });
            }
          }
        }
        processActions = {
          ...processActions,
          [terminal.pid]: {
            command: terminal.command,
            actions: paths,
          },
        };
      }
    }
    setTerminalActions(processActions);
  };

  useEffect(() => {
    const relevantTerminals = Object.values(terminal.processes.children).filter(
      (process) => process.pwd === settings.pwd
    );
    console.log(relevantTerminals);
    handleTerminalItem(relevantTerminals);
  }, [terminal.processes.children, settings.pwd]);

  useEffect(() => {
    terminalRef?.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminal.list?.length]);

  return (
    <Div
      ref={positionRef}
      css={`
        ${flex("column")}
        padding: 0 16px;
        margin: 8px 0;
      `}
    >
      <Div
        css={`
          ${flex("space-between")}
        `}
      >
        <Div
          css={`
            position: relative;
            ${flex("left")}
            margin: 16px 0;
            width: max-content;
            height: 32px;
          `}
          onClick={(e) => {
            setBranchOptions(true);
          }}
        >
          <Div
            css={`
              width: 32px;
              height: 24px;
              ${flex("center")}
              background-color: ${branches?.hasRemote
                ? colors.lightGreen
                : colors.red};
              padding: 8px;
              padding-left: 16px;
              border-radius: 30px;
              border-top-right-radius: 0;
              border-bottom-right-radius: 0;
              cursor: pointer;
            `}
          >
            {branches.hasRemote ? (
              <CloudCheck size={24} color="white" weight="bold" />
            ) : (
              <CloudSlash size={24} color="white" weight="bold" />
            )}
          </Div>
          <Div
            flex="left"
            css={`
              min-width: 100px;
              height: 24px;
              padding: 16px;
              padding-top: 12px;
              padding-bottom: 4px;
              border-radius: 30px;
              border-top-left-radius: 0;
              border-bottom-left-radius: 0;
              background-color: ${colors.darkIndigo};
              cursor: pointer;
            `}
          >
            <Text bold>{branches?.current}</Text>
          </Div>
          {branchOptions ? (
            <Div
              ref={branchRef}
              css={`
                ${animation("fadeIn", ".2s ease")}
                position: absolute;
                pointer-events: all;
                top: calc(100% + 16px);
                left: 0;
                width: 300px;
                background-color: ${colors.darkIndigo};
                border-radius: 16px;
                z-index: 100000;
                overflow: auto;
                overflow-x: hidden;
                max-height: 500px;
                padding-bottom: 8px;
                ${shadows.lg}
                > div {
                  ${flex("space-between")}
                  cursor: pointer;
                  padding: 4px 16px;
                  padding-left: 16px;
                  width: 100%;
                  box-sizing: border-box;
                  :hover {
                    background-color: rgba(0, 0, 0, 0.4);
                  }
                  :not(:hover) {
                    button {
                      visibility: hidden;
                    }
                  }
                  button {
                    :hover {
                      background-color: ${colors.darkIndigo};
                    }
                  }
                }
              `}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <Div
                css={`
                  ${flex("space-between")}
                `}
                onClick={handleRemote}
              >
                <Text
                  ellipsis
                  css={`
                    padding: 8px 0;
                  `}
                >
                  {branches.hasRemote
                    ? `Open Remote - ${branches?.current}`
                    : `Create Remote - ${branches?.current}`}
                </Text>
                <Div
                  css={`
                    ${flex("right")}
                    svg {
                      min-width: 16px;
                    }
                  `}
                >
                  <Command color="white" size={16} />
                  <Text>R</Text>
                </Div>
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
                    sm
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(item);
                    }}
                  >
                    <Copy />
                  </Button>
                </Div>
              ))}
            </Div>
          ) : null}
        </Div>
        <Div
          css={`
            ${flex("right")}
            ${animation("fadeIn", ".35s ease")}
          `}
        >
          {ports?.[basePath]?.length
            ? ports?.[basePath]?.map((port) => (
                <Div
                  css={`
                    border-radius: 16px;
                    background-color: ${colors.darkIndigo};
                    padding: 8px;
                    ${flex("right")}
                    cursor: pointer;
                  `}
                  onClick={() => killMainPID(port.pid)}
                >
                  <Div
                    css={`
                      border-radius: 50%;
                      width: 6px;
                      height: 6px;
                      background-color: ${colors.lightGreen};
                      margin-right: 8px;
                      border: 3px solid ${colors.green};
                    `}
                  />
                  <Text bold>{port.port}</Text>
                </Div>
              ))
            : null}
        </Div>
      </Div>
      {settings?.pwd in repos ? (
        <Div
          css={`
            height: calc(100vh - ${box?.top + 96}px);
            ${flex("start column")}
            overflow: hidden;
            box-sizing: border-box;
          `}
        >
          <Div
            css={`
              ${flex("left")}
              width: 100%;
              box-sizing: border-box;
              margin-bottom: 16px;
              margin: 8px 0;
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
            <form onSubmit={handleCmd}>
              {loading ? <Loader /> : null}
              <Div
                css={`
                  position: relative;
                  transition: opacity 0.2s ease;
                  opacity: 0.3;
                  :focus-within {
                    opacity: 0.8;
                  }
                  border: 1px solid ${colors.darkIndigo};
                  ${shadows.lg}
                  ${loading
                    ? `
                    background-color: white;
                    padding-right: 0;
                  `
                    : `
                    background-color: white;
                    padding-right: 32px;
                  `}
                  border-radius: 8px;
                `}
              >
                <Input
                  disabled={loading}
                  value={cmd}
                  onChange={(e) => setCmd(e.target.value)}
                  ref={ref}
                />
                {!loading ? (
                  <Button
                    dark
                    icon
                    sm
                    css={`
                      position: absolute;
                      top: 0;
                      right: 0;
                      transition: color 0.2s ease;
                      transition: background-color 0.2s ease;
                      color: ${colors.darkIndigo};
                      border-radius: 50%;
                      background-color: ${colors.darkIndigo};
                      color: white;
                      border: none;
                      margin: 8px;
                      :hover {
                        background: ${colors.lightIndigo};
                        color: white;
                      }
                    `}
                    onClick={handleCmd}
                  >
                    <ArrowElbowRightDown weight="bold" />
                  </Button>
                ) : null}
              </Div>
            </form>

            <Div
              css={`
                ${flex("center")}
                border: 4px solid ${colors.darkIndigo};
                border-radius: 50%;
                padding: 8px;
                margin: 4px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                background-color: ${colors.darkIndigo};
                width: 40px;
                height: 40px;
                box-sizing: border-box;
                ${tab === "git"
                  ? `background-color: ${colors.lightIndigo};`
                  : ""}
                :hover {
                  outline: 2px solid ${colors.lightIndigo};
                  ${shadows.md}
                }
                svg {
                  min-width: 32px;
                }
                ${shakeTree}
              `}
              onClick={() => setTab("git")}
            >
              <Tree size={24} color="white" weight="bold" className={css``} />
            </Div>
            <Div
              css={`
                ${flex("center")}
                border: 4px solid ${colors.darkIndigo};
                border-radius: 50%;
                padding: 8px;
                margin: 4px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                background-color: ${colors.darkIndigo};
                width: 40px;
                height: 40px;
                box-sizing: border-box;
                ${tab === "terminal"
                  ? `background-color: ${colors.lightIndigo};`
                  : ""}
                :hover {
                  outline: 2px solid ${colors.lightIndigo};
                  ${shadows.md}
                }
                svg {
                  min-width: 24px;
                }
                ${shakeTree}
              `}
              onClick={() => setTab("terminal")}
            >
              <Terminal
                size={24}
                color="white"
                weight="bold"
                className={css``}
              />
            </Div>
          </Div>
          {Object.keys(terminalActions)?.length ? (
            <Div
              css={`
                position: relative;
                ${flex("space-between")}
                border-radius: 8px;
                border: 1px solid ${colors.darkIndigo};
                background-color: rgba(0, 0, 0, 0.2);
                width: calc(100% - 32px);
                padding: 8px 16px;
                margin: 8px 0;
                :hover {
                  background-color: ${colors.darkIndigo};
                  cursor: pointer;
                }
              `}
              onClick={() => setDisplayActions(true)}
            >
              <Div
                css={`
                  ${flex("left")}
                  svg {
                    margin-right: 16px;
                  }
                `}
              >
                <Warning size={24} color="yellow" />
                <Text>Detected Terminal Actions</Text>
              </Div>
              <CaretDown size={24} color="white" />
              {displayActions ? (
                <Div
                  ref={actionsRef}
                  css={`
                    position: absolute;
                    max-height: 40vh;
                    overflow: hidden;
                    overflow-y: auto;
                    top: calc(100% + 8px);
                    left: 0;
                    width: 100%;
                    background-color: ${colors.darkIndigo};
                    border-radius: 8px;
                    ${shadows.lg}
                    cursor: default;
                    padding: 8px 0;
                  `}
                >
                  {Object.keys(terminalActions)?.map((item) => {
                    return (
                      <Div>
                        <Text
                          bold
                          css={`
                            padding: 8px;
                          `}
                        >
                          {item} - {terminalActions?.[item]?.command}
                        </Text>
                        {terminalActions?.[item]?.actions?.map((action) => (
                          <Div
                            css={`
                              ${flex("left start")}
                              padding: 8px;
                              margin-left: 8px;
                              padding-left: 8px;
                              border-left: 1px solid white;
                              :hover {
                                background-color: rgba(0, 0, 0, 0.3);
                                cursor: pointer;
                              }
                            `}
                            onClick={() => handleTerminalAction(action)}
                          >
                            {action?.type === "eslint" ? (
                              <Text
                                css={`
                                  color: yellow;
                                  font-weight: bold;
                                  margin-right: 8px;
                                `}
                              >
                                ESLINT:
                              </Text>
                            ) : null}
                            <Div>
                              <Text>{action.label}</Text>
                              <pre
                                className={css`
                                  word-break: break-word;
                                  white-space: pre-wrap;
                                  color: white;
                                `}
                              >
                                <Ansi>{action.description}</Ansi>
                              </pre>
                            </Div>
                          </Div>
                        ))}
                      </Div>
                    );
                  })}
                </Div>
              ) : null}
            </Div>
          ) : null}
          {tab === "git" ? (
            <Div
              css={`
                ${flex("column")}
                width: 100%;
                height: calc(100vh - 500px);
                flex-grow: 1;
              `}
            >
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
              >
                {repo?.description}
              </Text>
              {repo?.notes?.length ? (
                <Div
                  css={`
                    padding: 8px 0;
                    padding-bottom: 16px;
                  `}
                >
                  {repo?.notes?.map((item) => (
                    <Text>{item}</Text>
                  ))}
                </Div>
              ) : null}

              <Status
                status={status}
                currentBranch={branches?.current}
                parentBranch={parentBranch}
                completeMerge={completeMerge}
                settings={settings}
              />
              <Commits
                currentBranch={branches?.current}
                repo={repos?.[settings?.pwd]}
                parentBranch={parentBranch}
                lastCommand={lastCommand}
                pwd={settings?.pwd}
              />
            </Div>
          ) : tab === "terminal" ? (
            <Div
              css={`
                ${flex("space-between column")}
                width: calc(100% - 8px);
              `}
            >
              <Div
                css={`
                  ${flex("left end")}
                  margin-bottom: 8px;
                  border-bottom: 3px solid ${colors.darkIndigo};
                  gap: 8px;
                  width: 100%;
                `}
              >
                <Div
                  css={`
                    width: 32px;
                    height: 16px;
                    padding: 8px;
                    border-radius: 8px;
                    border-bottom-left-radius: 0;
                    border-bottom-right-radius: 0;
                    cursor: pointer;
                    background-color: ${colors.darkIndigo};
                    ${!terminal?.processes?.pid
                      ? `${shadows.md}
                      border-bottom: 2px solid ${colors.darkIndigo};
                    `
                      : `border-bottom: none; margin-bottom: 2px;`}
                  `}
                  onClick={() => terminal?.processes?.setPid("")}
                />
                {processes?.map((item) => (
                  <Text
                    css={`
                      padding: 8px;
                      border-radius: 8px;
                      border-bottom-left-radius: 0;
                      border-bottom-right-radius: 0;
                      cursor: pointer;
                      background-color: ${colors.darkIndigo};
                      ${terminal?.processes?.pid === item?.pid
                        ? `${shadows.md}
                        border-bottom: 2px solid ${colors.darkIndigo};
                      `
                        : `border-bottom: none; margin-bottom: 2px;`}
                    `}
                    onClick={() => terminal?.processes?.setPid(item?.pid)}
                  >
                    {item?.command}
                  </Text>
                ))}
              </Div>
              <Div
                css={`
                  position: relative;
                  width: 100%;
                `}
              >
                <Div
                  css={`
                    flex-grow: 1;
                    background-color: #121212;
                    border-radius: 8px;
                    overflow: hidden;
                    overflow-y: auto;
                    padding: 16px;
                    max-height: calc(100vh - 400px);
                    min-height: 8px;
                    ${scrollbar.style}
                  `}
                >
                  {!!terminal?.processes?.pid ? (
                    <Button
                      icon
                      sm
                      css={`
                        position: absolute;
                        top: 8px;
                        right: 8px;
                      `}
                      onClick={() =>
                        terminal.processes.kill(terminal?.processes?.pid)
                      }
                    >
                      <X size={24} />
                    </Button>
                  ) : null}
                  {terminal.list.slice(-10).map((item, idx) => (
                    <pre
                      onClick={() => handleTerminalItem(item, idx)}
                      className={css`
                        border-radius: 8px;
                        padding: 4px 8px;
                        margin: -4px -8px;
                        :hover {
                          background-color: rgba(0, 0, 0, 0.3);
                          outline: 3px solid ${colors.lightPurple};
                          outline-offset: -3px;
                        }
                        cursor: default;
                        word-break: break-word;
                        white-space: pre-wrap;
                        color: white;
                        ${item?.type === "error"
                          ? "color: #FF8888;"
                          : item?.type === "close"
                          ? "color: purple;"
                          : ""}
                      `}
                    >
                      <Ansi>{item?.message}</Ansi>
                    </pre>
                  ))}
                  <div ref={terminalRef} />
                </Div>
              </Div>
            </Div>
          ) : null}
        </Div>
      ) : (
        <SetupBm />
      )}
    </Div>
  );
};
