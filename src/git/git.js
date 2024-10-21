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
  CloudCheck,
  CloudSlash,
  Command,
  Copy,
  NoteBlank,
  Terminal,
  Tree,
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

import { useEvent } from "../hooks/use-event";
import { useStateSync } from "../hooks/use-state-sync";
import { Tooltip } from "../shared/Tooltip";
import { TerminalCommand } from "./TerminalCommand";
import { useActions } from "../hooks/useActions";
import { Shortkey } from "../Shortkey";
import { Collapse } from "../shared/Collapse";

const fs = window.require("fs");
const chokidar = window.require("chokidar");
const parse = require("parse-gitignore");

export const Git = () => {
  const context = useContext(StoreContext);
  const {
    store: {
      extensions = [],
      settings = {},
      repos = {},
      logs = [],
      lastCommand = "",
      terminal = {},
      action,
    },
    methods,
  } = context;

  const terminalActions = {};

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
  const notesRef = useRef();

  const updateNotesTextarea = () => {
    if (notesRef?.current) {
      notesRef.current.style.height = "auto";
      notesRef.current.style.height = `${
        notesRef?.current?.scrollHeight + 8
      }px`;
    }
  };

  useEvent("input", updateNotesTextarea, { element: notesRef.current });

  const [tab, setTab] = useState("command");

  useEffect(() => {
    updateNotesTextarea();
  }, [tab]);
  const repo = repos?.[settings?.pwd]?.branches?.[branches?.current];

  const [notes, setNotes] = useStateSync(repo?.notes || "");

  const blurNotes = () => {
    context.methods.setRepos({
      ...context.store?.repos,
      [context.store?.settings?.pwd]: {
        ...context.store?.repos?.[context.store?.settings?.pwd],
        branches: {
          ...branches,
          [branches?.current]: {
            ...(branches?.[branches?.current] || {}),
            notes,
          },
        },
      },
    });
  };

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
    if (executingCommand.startsWith("/")) {
      return;
    }

    setLoading(true);
    const lastCommand = `${executingCommand}-${new Date().toISOString()}`;

    if (executingCommand.includes("clear")) {
      console.clear();
    }

    const commandDetails = list[index];
    const [value, ...args] = executingCommand.split(" ");

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
      if (executingCommand.startsWith("command")) {
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
    let inputCmd = cmd;
    if (!inputCmd) {
      return commands;
    } else if (inputCmd?.startsWith("/")) {
      if (inputCmd === "/") {
        return commands;
      } else {
        return commands.filter(
          (item) =>
            item?.command?.includes(inputCmd.replace("/", "")) ||
            item?.name
              ?.toLowerCase()
              ?.includes(inputCmd.toLowerCase().replace("/", ""))
        );
      }
    }
    let value = inputCmd;
    if (inputCmd.includes(" ")) {
      const [command] = inputCmd.split(" ");
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

  const handleGithub = () => {
    if (branches.hasRemote) {
      openRemote({
        flags: cmd,
        currentBranch: branches?.current,
      });
    } else {
      toast.error(`No remote branch detected.`);
    }
  };

  useActions({
    navigate: (payload) => {
      const split = payload.split(".");
      if (split[0] === "mode" && split.length === 3) {
        setTab(split[2]);
        if (split[2]) {
          setTimeout(() => {
            notesRef?.current?.focus();
          }, 100);
        }
      } else if (payload === "external.github") {
        handleGithub();
      }
    },
  });

  const handleCheckout = async (branch) => {
    try {
      await checkoutBranch(branch);
      refreshGit();
    } catch {}
  };

  const keydown = async (captured, event) => {
    if (tab === "command") {
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
        if (!cmd.startsWith("/") && !cmd.includes(" ")) {
          const command = list[index]?.command;
          if (command) {
            setCmd(command);
          }
        }
      } else if (!captured.includes("meta")) {
        ref?.current?.focus();
      }
    }
  };

  useKeyboard({ keydown });
  const box = positionRef?.current?.getBoundingClientRect();

  return (
    <Div
      ref={positionRef}
      css={`
        ${flex("column")}
        padding: 0 16px;
        margin: 0;
      `}
    >
      <Div
        css={`
          ${flex("space-between")}
        `}
      >
        <Div
          css={`
            ${flex("left")}
            ${animation("fadeIn", ".35s ease")}
          `}
        >
          <Tooltip label="Git Command" shortkey="navigate-git-command">
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
                ${tab === "command"
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
              onClick={() => setTab("command")}
            >
              <Tree size={24} color="white" weight="bold" />
            </Div>
          </Tooltip>
          <Tooltip label="Terminal" shortkey="open-internal-terminal">
            <Div
              css={`
                position: relative;
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
              {terminal?.count > 0 ? (
                <Div
                  css={`
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    background-color: ${colors.red};
                    border-radius: 50%;
                    width: 8px;
                    height: 8px;
                  `}
                />
              ) : null}
              <Terminal size={24} color="white" weight="bold" />
            </Div>
          </Tooltip>
          <Tooltip label="Branch Notes" shortkey="open-branch-notes">
            <Div
              css={`
                position: relative;
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
                ${tab === "notes"
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
              onClick={() => setTab("notes")}
            >
              {repo?.notes ? (
                <Div
                  css={`
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    background-color: white;
                    border-radius: 50%;
                    width: 8px;
                    height: 8px;
                  `}
                />
              ) : null}
              <NoteBlank size={24} color="white" weight="bold" />
            </Div>
          </Tooltip>
        </Div>
        <Div
          css={`
            position: relative;
            ${flex("left")}
            margin: 16px 0;
            width: max-content;
            height: 32px;
            margin-right: 8px;
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
                right: 0;
                width: 300px;
                background-color: ${colors.darkIndigo};
                border-radius: 8px;
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
                <Shortkey type="open-github" />
              </Div>
              <hr
                className={css`
                  padding: 0;
                  margin: 0;
                `}
              />
              {branches?.list?.map((item) => (
                <Tooltip
                  label={
                    item === repos?.[settings?.pwd]?.defaultBranch
                      ? "Default Branch"
                      : ""
                  }
                >
                  <Div
                    onClick={(e) => {
                      handleCheckout(item);
                      setBranchOptions(false);
                    }}
                  >
                    <Text
                      bold
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
                </Tooltip>
              ))}
            </Div>
          ) : null}
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
          <Collapse
            isOpen={tab === "command"}
            css={`
              width: 100%;
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
              <form
                onSubmit={handleCmd}
                className={css`
                  position: relative;
                `}
              >
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
                    placeholder={loading ? "" : "/ for augmented git list"}
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
              </form>
            </Div>
          </Collapse>
          {tab === "command" ? (
            <Div
              css={`
                ${flex("column")}
                width: 100%;
                height: calc(100vh - 500px);
                flex-grow: 1;
              `}
            >
              <Text
                css={`
                  margin-bottom: 8px;
                  width: 100%;
                  text-align: left;
                `}
              >
                {repo?.description}
              </Text>

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
            <TerminalCommand />
          ) : tab === "notes" ? (
            <Div
              css={`
                width: 100%;
                border-radius: 8px;
                box-sizing: border-box;
                margin-top: 8px;
              `}
            >
              <textarea
                ref={notesRef}
                className={css`
                  box-sizing: border-box;
                  width: calc(100% - 8px);
                  padding: 8px;
                  border-radius: 8px;
                  outline: none;
                  background-color: ${colors.darkIndigo};
                  color: white;
                  max-height: calc(100vh - 400px);
                  resize: none;
                  font-size: 14px;
                `}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={blurNotes}
              />
            </Div>
          ) : null}
        </Div>
      ) : (
        <SetupBm />
      )}
    </Div>
  );
};
