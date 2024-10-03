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
    store: {
      extensions = [],
      settings = {},
      repos = {},
      logs = [],
      lastCommand = "",
    },
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
  const [ports, setPorts] = useState([]);
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

  const updatePort = async () => {
    setPorts([]);
    const list = await execCmd(
      `lsof -iTCP -sTCP:LISTEN -n -P | grep $(whoami) | awk '{print $9, $2}'`
    );
    const ports = list.split("\n");
    let promises = [];
    for (const port of ports) {
      const [, pid] = port.split(" ");
      if (!!pid) {
        try {
          const promise = execCmd(
            `lsof -p ${pid} | grep cwd | awk '{print $9}'`
          );
          promises.push(promise);
        } catch {}
      }
    }
    const results = await Promise.all(promises);
    const path = settings.pwd.replace("~", settings?.base);
    const filtered = results
      .reduce((p, v, idx) => {
        const values = ports[idx].split(" ");
        const port = values?.[0]?.replace("*", "");
        const pid = values?.[1];
        return [...p, { path: v.replace("\n", ""), port, pid }];
      }, [])
      .filter((item) => item?.path?.startsWith(path));
    setPorts(filtered);
  };

  useEffect(() => {
    updatePort();
  }, [lastCmd, settings.pwd]);

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
    setLastCmd(new Date().toISOString());

    if (executingCommand.includes("clear")) {
      console.clear();
    } else if (executingCommand.startsWith(">")) {
      const cmd = executingCommand.replace(">", "").trim();
      console.log(cmd);
      await execCmd(cmd);
      executingCommand = "";
      setLoading(false);
      return;
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
          {ports?.length
            ? ports.map((port) => (
                <Div
                  css={`
                    border-radius: 16px;
                    background-color: ${colors.darkIndigo};
                    padding: 8px;
                    ${flex("right")}
                    cursor: pointer;
                  `}
                >
                  <Div
                    css={`
                      border-radius: 50%;
                      width: 16px;
                      height: 16px;
                      background-color: ${colors.lightGreen};
                      margin-right: 8px;
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
            overflow-y: auto;
            overflow-x: hidden;
            box-sizing: border-box;
            // border: 1px solid;
          `}
        >
          <Div
            css={`
              ${flex("left")}
              width: 100%;
              box-sizing: border-box;
              margin-bottom: 16px;
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
                position: relative;
                width: 200px;
                max-width: max-content;
                transition: width 0.3s ease;
                margin-left: 8px;
                :hover {
                  width: 100%;
                  animation 0.3s ease grow;
                }
              `}
            >
              <Div
                css={`
                  ${flex("space-between")}
                  border: 1px solid ${colors.darkIndigo};
                  border-radius: 50%;
                  padding: 4px;
                  margin: 4px;
                  cursor: pointer;
                  transition: background-color 0.2s ease;
                  background-color: ${colors.darkIndigo};

                  box-sizing: border-box;
                  // :hover {
                  //   outline: 2px solid ${colors.lightIndigo};
                  //   outline-offset: 2px;
                  //   ${shadows.md}
                  // }
                  svg {
                    min-width: 32px;
                  }
                  ${shakeTree}
                `}
              >
                <Tree size={32} color="white" weight="bold" className={css``} />
              </Div>
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
