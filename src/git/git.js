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
import {
  Cloud,
  CloudCheck,
  CloudSlash,
  FileArrowUp,
  FileDotted,
  FileX,
  MinusCircle,
  Plug,
  Plugs,
  PlugsConnected,
  Plus,
  PlusCircle,
  Tree,
} from "phosphor-react";
import { css } from "@emotion/css";
import { useAnimation } from "../hooks/use-animation";

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

  const [index, setIndex] = useState(0);
  const [cmd, setCmd] = useState("");
  const [loading, setLoading] = useState(false);

  const [branches, setBranches] = useState({});
  const [status, setStatus] = useState({});

  const [showBranches, setShowBranches] = useState(false);

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

  const handleCmd = async (event) => {
    event?.preventDefault();
    if (cmd.includes("clear")) {
      console.clear();
    }

    const { command } = list[index];

    const [value, ...args] = cmd.split(" ");
    setLoading(true);

    const parentBranch =
      repos?.[settings?.pwd]?.branches?.[branches?.current]?.parentBranch ||
      repos?.[settings?.pwd]?.defaultBranch;

    const options = {
      flags: cmd,
      parentBranch,
      currentBranch: branches?.current,
    };
    setCmd("");
    try {
      methods.set("lastCommand", `${command}-${new Date().toISOString()}`);
      if (command === "checkout") {
        await checkoutBranch(checkoutList?.[0], options);
      } else if (command === "delete") {
        await deleteBranch(options);
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
        await createBranch(args[0], options);
        methods.updateRepos({
          [settings?.pwd]: {
            ...repos?.[settings?.pwd],
            branches: {
              ...(repos?.[settings?.pwd]?.branches || {}),
              [args[0]]: {
                parentBranch: options?.currentBranch,
              },
            },
          },
        });
      }
      refreshGit();
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
      openRemote({
        flags: cmd,
        currentBranch: branches?.current,
      });
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
  return (
    <Div
      css={`
        padding: 16px;
      `}
    >
      {settings?.pwd in repos ? (
        <Div>
          <Div
            css={`
              ${flex("left")}
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
              {loading ? (
                <Text
                  css={`
                    ${flex("left")}
                    padding: 0 16px;
                    font-weight: bold;
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    pointer-events: none;
                    color: ${colors.lightBlue};
                  `}
                >
                  Loading...
                </Text>
              ) : null}
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
                width: 150px;
                border: 1px solid transparent;
                border-radius: 16px;
                padding: 8px 16px;
                cursor: pointer;
                transition: background-color 0.2s ease;
                :hover {
                  background-color: ${colors.lightIndigo};
                }
                background-color: ${colors.indigo};
                p {
                  margin-right: 16px;
                  flex-grow: 1;
                }
              `}
              onClick={() => {
                openRemote({
                  flags: "",
                  currentBranch: branches?.current,
                });
              }}
              onContextMenu={() => {
                setShowBranches(true);
              }}
            >
              <Text h3 ellipsis>
                {branches?.current}
              </Text>
              {branches?.hasRemote ? (
                <CloudCheck size={32} color={colors.lightGreen} weight="bold" />
              ) : (
                <CloudSlash size={32} color={colors.red} weight="bold" />
              )}
            </Div>
          </Div>
          <Div
            css={`
              ${flex("start column")}
              ${shadows.lg}
              border-radius: 16px;
              padding: 16px;
            `}
          >
            <Div
              css={`
                width: 100%;
                ${flex("left start wrap")}
                overflow-x: auto;
                flex-grow: 1;
              `}
            >
              {list?.length > 1 ? (
                list.map((item, idx) => (
                  <Div
                    css={`
                      min-width: max-content;
                      background-color: ${colors.indigo};
                      padding: 4px 8px;
                      border-radius: 16px;
                      margin-right: 8px;
                      margin-bottom: 8px;
                      cursor: pointer;
                      border: 2px solid ${colors.indigo};
                      ${idx === index && !!cmd
                        ? `
                      font-weight: bold;
                      border: 2px solid ${colors.lightBlue};
                    `
                        : ""}
                    `}
                    onClick={() => console.log()}
                  >
                    <Text>{item.name}</Text>
                  </Div>
                ))
              ) : (
                <Div
                  css={`
                    width: 100%;
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
                      `}
                    >
                      <Text
                        h3
                        bold
                        css={`
                          padding: 4px 16px;
                          border-radius: 16px;
                          background-color: ${colors.lightIndigo};
                          margin-right: 16px;
                        `}
                      >
                        {list[0]?.name}
                      </Text>
                      <Text h4 bold>
                        {list[0]?.args}
                      </Text>
                      <Text
                        h4
                        css={`
                          margin-left: 16px;
                        `}
                      >
                        {list[0]?.flags}
                      </Text>
                    </Div>
                    <Text
                      h3
                      bold
                      css={`
                        padding: 4px 16px;
                        border-radius: 16px;
                        ${shadows.lg}
                        background-color: ${colors.indigo};
                        color: white;
                        margin-right: 16px;
                      `}
                    >
                      {list[0]?.command}
                    </Text>
                  </Div>
                  <Text
                    css={`
                      margin: 16px;
                    `}
                  >
                    {list[0]?.description}
                  </Text>
                  {list[0]?.command === "checkout" ? (
                    <Div
                      css={`
                        ${flex("left")}
                      `}
                    >
                      {checkoutList?.map((item, idx) => (
                        <Text
                          css={`
                            ${animation("fadeIn", ".2s ease")}
                            padding: 8px 16px;
                            border: 2px solid transparent;
                            ${idx === 0
                              ? `background-color: ${colors.lightIndigo}; border: 2px solid ${colors.lightBlue}; font-weight: bold;`
                              : `background-color: ${colors.indigo};`}
                            ${shadows.md}
                            border-radius: 30px;
                            margin-right: 8px;
                          `}
                        >
                          {item}
                        </Text>
                      ))}
                    </Div>
                  ) : null}
                </Div>
              )}
            </Div>
          </Div>

          <Div
            css={`
              margin-bottom: 32px;
            `}
          >
            {status?.untracked?.map((item) => (
              <Div
                css={`
                  ${flex("space-between")}
                  padding: 8px 0;
                `}
              >
                <Div
                  css={`
                    ${flex("left")}
                    p {
                      margin-left: 16px;
                    }
                  `}
                >
                  <FileDotted
                    size={24}
                    color={colors.lightBlue}
                    weight="bold"
                  />
                  <Text h4>{item}</Text>
                </Div>
              </Div>
            ))}

            {status?.deleted?.map((item) => (
              <Div
                css={`
                  ${flex("space-between")}
                  padding: 8px 0;
                `}
              >
                <Div
                  css={`
                    ${flex("left")}
                    p {
                      margin-left: 16px;
                    }
                  `}
                >
                  <FileX size={24} color={colors.red} weight="bold" />
                  <Text h4>{item}</Text>
                </Div>
                <Div
                  css={`
                    ${flex("left")}
                    p {
                      margin-left: 4px;
                    }
                  `}
                >
                  <Div
                    css={`
                      ${flex("left")}
                      padding: 4px 8px;
                      border-radius: 30px;
                      border: 1px solid ${colors.darkIndigo};
                      ${shadows.lg}
                      margin: 0 8px;
                      font-weight: bold;
                    `}
                  >
                    <PlusCircle size={24} color={colors.green} weight="bold" />
                    <Text>{status?.files?.[item]?.adds}</Text>
                  </Div>

                  <Div
                    css={`
                      ${flex("left")}
                      padding: 4px 8px;
                      border-radius: 30px;
                      border: 1px solid ${colors.darkIndigo};
                      ${shadows.lg}
                      margin: 0 8px;
                      font-weight: bold;
                    `}
                  >
                    <MinusCircle size={24} color={colors.red} weight="bold" />
                    <Text>{status?.files?.[item]?.deletes}</Text>
                  </Div>
                </Div>
              </Div>
            ))}

            {status?.modified?.map((item) => (
              <Div
                css={`
                  ${flex("space-between")}
                  padding: 8px 0;
                `}
              >
                <Div
                  css={`
                    ${flex("left")}
                    p {
                      margin-left: 16px;
                    }
                  `}
                >
                  <FileArrowUp size={24} color={colors.green} weight="bold" />
                  <Text h4>{item}</Text>
                </Div>
                <Div
                  css={`
                    ${flex("left")}
                    p {
                      margin-left: 4px;
                    }
                  `}
                >
                  <Div
                    css={`
                      ${flex("left")}
                      padding: 4px 8px;
                      border-radius: 30px;
                      border: 1px solid ${colors.darkIndigo};
                      ${shadows.lg}
                      margin: 0 8px;
                      font-weight: bold;
                    `}
                  >
                    <PlusCircle size={24} color={colors.green} weight="bold" />
                    <Text>{status?.files?.[item]?.adds}</Text>
                  </Div>

                  <Div
                    css={`
                      ${flex("left")}
                      padding: 4px 8px;
                      border-radius: 30px;
                      border: 1px solid ${colors.darkIndigo};
                      ${shadows.lg}
                      margin: 0 8px;
                      font-weight: bold;
                    `}
                  >
                    <MinusCircle size={24} color={colors.red} weight="bold" />
                    <Text>{status?.files?.[item]?.deletes}</Text>
                  </Div>
                </Div>
              </Div>
            ))}
          </Div>
        </Div>
      ) : (
        <SetupBm />
      )}
    </Div>
  );
};
