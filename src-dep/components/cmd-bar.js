import { css } from "@emotion/css";
import { forwardRef, useCallback, useState } from "react";
import { toast } from "react-toastify";
import { useStore } from "../context/use-store";
import { useAsyncValue } from "../hooks/use-async-value";
import { getFilesInDirectory } from "../node/fs-utils";
import { Button } from "../shared-styles/button";
import { Div } from "../shared-styles/div";
import { Input } from "../shared-styles/input";
import { colors } from "../shared-styles/styles";
import { primaryTags, Text } from "../shared-styles/text";
import {
  addCommitPush,
  checkoutBranch,
  clearBranch,
  createBranch,
  deleteBranch,
  fetch,
  getBranches,
  getCurrentBranch,
  openRemote,
  push,
  renameBranch,
  removeFile,
  update,
} from "./git-utils";
import { cmd as exec } from "../node/node-exports";
import { useTerminal } from "../hooks/use-terminal";
import { useKeyboard } from "../hooks/use-keyboard";
import { ArrowLeft, Plus } from "phosphor-react";

const cmdArgs = {
  open: ["terminal", "editor", "finder"],
  mode: ["terminal", "bm"],
};

const cmdList = [
  ["cd", "..", "bm", "clear", "open", "exit", "mode", "kill"],
  [
    {
      name: ".",
      key: ".",
      args: "{description}",
      flags: "",
      description:
        "Adds all unstaged files, commits all files with a description message and then pushes everything if a remote branch exists.",
    },
    {
      name: "new",
      key: "new",
      args: "{name}",
      flags: "",
      description:
        "Updates current branch if a remote branch exists and then creates a new branch with the current set as parent.",
    },
    {
      name: "log",
      key: "log",
      args: "",
      flags: "",
      description: "Log commits of current branch.",
    },
    {
      name: "list",
      key: "list",
      args: "",
      flags: "",
      description: "Lists all all branches.",
    },
    {
      name: "checkout",
      key: "checkout",
      args: "{name}",
      flags: "-s --stash",
      description: "Checkout a branch.",
    },
    {
      name: "delete",
      key: "delete",
      args: "",
      flags: "-r --remote",
      description:
        "Delete the current branch. With the -r flag it will delete the remote branch.",
    },
    {
      name: "rm",
      key: "remove",
      args: "{relative filepath}",
      flags: "",
      description: "Remove a file by filepath.",
    },
    {
      name: "remote",
      key: "remote",
      args: "",
      flags: "-a --all -c --copy",
      description:
        "Open the remote branch or with -a opens the current repos branch list. -c will copy the url rather than open it.",
    },
    {
      name: "push",
      key: "push",
      args: "",
      flags: "",
      description:
        "git push or if no remote branch exists it will automatically set the upstream branch",
    },
    {
      name: "fetch",
      key: "fetch",
      args: "",
      flags: "",
      description: "git fetch -p",
    },
    {
      name: "update",
      key: "update",
      args: "",
      flags: "",
      description:
        "Pulls parent origin and then automatically merges the parent branch into the current branch.",
    },
    {
      name: "rename",
      key: "rename",
      args: "{branchName}",
      flags: "",
      description:
        "Renames local branch and attempts to rename the remote branch.",
    },
    {
      name: "clear",
      key: "clear",
      args: "",
      flags: "",
      description: "Clears all uncommitted changes.",
    },
    {
      name: "status",
      key: "status",
      args: "",
      flags: "",
      description: "Refresh displayed status.",
    },
  ],
];

export const CmdBar = forwardRef(({ settings, setSettings, setMode }, ref) => {
  const {
    store: { cmd = "", repos, lastCommand = "" },
    setStore,
  } = useStore();

  const [display, setDisplay] = useState(false);
  const [loading, setLoading] = useState(false);
  const [displayUpstream, setDisplayUpstream] = useState(false);
  const [text, setText] = useState("");

  const { submit: submitCommand } = useTerminal();

  const setCmd = (value) => {
    setStore("cmd", value);
  };

  const [current] = useAsyncValue(getCurrentBranch, [
    settings.pwd,
    lastCommand,
  ]);

  const createBookmark = () => {
    const name = settings?.pwd?.split("/").at(-1);
    setSettings({
      ...settings,
      bookmarks: {
        ...(settings?.bookmarks || {}),
        [settings?.pwd]: { name },
      },
    });
  };

  const updateList = useCallback(async () => {
    try {
      let filterFn = (item) => item;
      const split = cmd?.split(" ") || [];
      let cmdIndex = split.length - 1;
      let list = cmdList[cmdIndex];
      let detail = [];
      if (!cmd) {
        return { list, filterFn };
      }

      if (!cmd.includes(" ")) {
        list = list.filter((item) => item.startsWith(cmd.toLowerCase()));
      }
      if (cmd.includes(" ")) {
        if (split[0] === "cd") {
          const path = settings?.pwd?.replace("~", settings.base);
          filterFn = ({ name }) => name;
          list =
            getFilesInDirectory(path)?.filter((match) =>
              filterFn(match).startsWith(split[cmdIndex])
            ) ?? [];
        } else if (split[0] === "..") {
          const backSplit = settings?.pwd.split("/").slice(0, -1).join("/");
          const path = backSplit?.replace("~", settings?.base);
          filterFn = ({ name }) => name;
          list =
            getFilesInDirectory(path)?.filter((match) =>
              filterFn(match).startsWith(split[cmdIndex])
            ) ?? [];
        } else if (split[0] === "bm") {
          cmdIndex = 1;
          list =
            cmdList[1]?.filter(({ name }) =>
              name?.startsWith(split[cmdIndex].toLowerCase())
            ) ?? [];
          filterFn = ({ name }) => name;
          if (
            split.length > 1 &&
            !split.includes("-h") &&
            !split.includes("--help") &&
            (list[0].key === "list" || list[0].key === "checkout")
          ) {
            const branches = (await getBranches()) || [];
            detail = split[2]
              ? branches.list.filter((branch) =>
                  branch.toLowerCase().includes(split[2].toLowerCase())
                )
              : branches.list;
          }
        } else if (split[0] === "open" || split[0] === "mode") {
          list = cmdArgs[split[0]];
          if (split.length > 1 && !!split[1]) {
            list = list.filter((item) =>
              item.toLowerCase().includes(split[1].toLowerCase())
            );
          }
        }
      }
      return {
        list,
        filterFn,
        detail,
      };
    } catch (err) {
      console.log(err);
      return {};
    }
  }, [cmd, settings?.pwd]);

  const [{ filterFn, list, detail }] = useAsyncValue(
    updateList,
    [cmd, settings?.pwd],
    { filterFn: () => null, list: [] }
  );

  const clickCmd = (value) => {
    let split = cmd.split(" ");
    split.splice(split.length - 1, 1, value);
    setCmd(split.join(" "));
  };

  const goBack = () => {
    const split = settings?.pwd?.split("/");
    const path = split.slice(0, split.length - 1).join("/");
    let data = { ...settings };
    data.pwd = path;
    setSettings(data);
  };

  const executeCommand = async (e, command = cmd) => {
    e?.preventDefault();
    const args = command?.split(" ");
    if (args.includes("-h") || args.includes("--help")) {
      setCmd("");
      toast.warn(`command was discarded because --help flag was detected`);
      return;
    }
    try {
      ref.current.blur();

      setLoading(true);
      const [_, value] = command.split(" ");
      const secondaryCommand = list?.[0]?.key || value;
      const timestamp = `${new Date().toISOString()}-${secondaryCommand}`;
      setCmd("");

      let data = { ...settings };
      let hasChanges = false;
      let success = false;
      if (command === "..") {
        const split = settings?.pwd?.split("/");
        const path = split.slice(0, split.length - 1).join("/");
        if (path) {
          data.pwd = path;
          hasChanges = true;
        }
      } else if (args?.[0] === "..") {
        hasChanges = true;
        const backSplit = settings?.pwd.split("/").slice(0, -1).join("/");
        const path = backSplit + "/" + list[0].name;
        data.pwd = path;
      } else if (args?.[0] === "mode") {
        if (!args?.[1]) {
          setMode((m) => (m === "bm" ? "terminal" : "bm"));
        } else {
          setMode(list?.[0]);
        }
      } else if (args?.[0] === "open") {
        if (list?.[0] === "terminal") {
          await exec(`open -a terminal .`);
        } else if (list?.[0] === "editor") {
          await exec(settings?.cmds?.codeEditorCmd);
        } else if (list?.[0] === "finder") {
          await exec(`open .`);
        }
      } else if (command.startsWith("cd")) {
        hasChanges = true;
        if (args[0] === "..") {
          const split = settings?.pwd?.split("/");
          const path = split.slice(0, split.length - 1).join("/");
          data.pwd = path;
        } else if (command === "cd") {
          data.pwd = "~";
        } else {
          const path = settings?.pwd + "/" + list[0].name;
          data.pwd = path;
        }
      } else if (command.startsWith("bm")) {
        const defaultBranch = repos?.[settings?.pwd]?.defaultBranch;
        if (secondaryCommand === "new" && args?.[2]) {
          success = await createBranch(args?.[2]);
          if (!success) {
            toast.error(`Failed to create new branch`);
          }
        } else if (secondaryCommand === "checkout") {
          success = await checkoutBranch(detail[0], defaultBranch, command);
          if (!success && success !== null) {
            toast.error(`Failed to checkout ${args?.[2]}`);
          }
        } else if (secondaryCommand === "delete") {
          success = await deleteBranch(defaultBranch, command);
          if (!success) {
            toast.error(`Failed to delete ${args?.[2]}`);
          }
        } else if (secondaryCommand === "remote") {
          setLoading(false);
          success = await openRemote(command);
          if (!success) {
            toast.error(`Set upstream branch first.`);
          }
        } else if (secondaryCommand === "push") {
          success = await push(command);
          if (!success) {
            toast.error(`Failed to push branch.`);
          }
        } else if (secondaryCommand === "fetch") {
          success = await fetch();
          if (!success) {
            toast.error(`Failed to fetch.`);
          }
        } else if (secondaryCommand === "update") {
          success = await update(defaultBranch, command);
          if (!success) {
            toast.error(`Failed to update.`);
          }
        } else if (secondaryCommand === "clear") {
          success = await clearBranch();
          if (!success) {
            toast.error(`Failed to clear uncommitted changes.`);
          }
        } else if (secondaryCommand === "status") {
          success = true;
        } else if (secondaryCommand === "remove") {
          if (args[2]) {
            success = await removeFile(args[2], defaultBranch, command);
          } else {
            toast.warn(`You need to add the relative filepath to remove.`);
          }
        } else if (secondaryCommand === "rename") {
          if (args[2]) {
            success = await renameBranch(args[2], command);
          } else {
            toast.warn(`You need to add a new branch name.`);
          }
        } else if (secondaryCommand === ".") {
          const description = args
            .filter((v) => !v.startsWith("-"))
            .slice(2)
            .join(" ");
          success = await addCommitPush(description);
          if (success) {
            toast.success(`Committed: ${description}`);
          }
        } else if (secondaryCommand === "log") {
          success = true;
        }
      } else if (command === "clear") {
        console.clear();
        setStore("output", []);
        toast.dismiss();
      } else if (command === "exit") {
        window.close();
      } else {
        setMode("terminal");
        await submitCommand(command);
      }

      if (hasChanges) {
        setSettings(data);
      }
      if (success) {
        setStore("lastCommand", timestamp);
      }
    } catch (err) {
      console.log(err);
      toast.error(`There was an error running that command`);
      setCmd("");
    } finally {
      setLoading(false);
    }
  };

  const keydown = (captured, event) => {
    if (document.activeElement === ref.current) {
      if (captured === "+Tab") {
        event.preventDefault();
        event.stopPropagation();
        let split = cmd.split(" ");
        const isDetail = split.length > 2;
        const data = isDetail && detail.length ? detail[0] : filterFn(list[0]);
        if (split[split.length - 1] !== data) {
          split.splice(split.length - 1, 1, data);
          setCmd(split.join(" "));
        }
      } else if (captured === "+Escape") {
        event.preventDefault();
        event.stopPropagation();
        setDisplay(false);
        setStore(
          "lastCommand",
          `${new Date().toISOString()}-hide-branches-dropdown`
        );
      } else if (!display) {
        setDisplay(true);
      }
    }

    if (captured === "meta+KeyS") {
      event.stopPropagation();
      executeCommand(null, "bm status");
    } else if (captured === "meta+KeyL") {
      event.stopPropagation();
      executeCommand(null, "bm log");
    } else if (captured === "meta+KeyR") {
      event.stopPropagation();
      event.preventDefault();
      executeCommand(null, "bm remote");
    } else if (captured === "meta+KeyP") {
      event.stopPropagation();
      executeCommand(null, "bm push");
    } else if (captured.startsWith("meta+Digit")) {
      const index = captured.replace("meta+Digit", "");
      const paths = Object.keys(settings?.bookmarks || {});
      const path = paths?.[index - 1];
      if (path) {
        let data = { ...settings };
        data.pwd = path;
        setSettings(data);
      }
    }
  };

  useKeyboard({ keydown, options: { useCapture: true } });

  const args = cmd.split(" ");
  const cmdCount = args.length;

  return (
    <>
      <Div
        className={`display: flex; justify-content: space-between; align-items: center;`}
      >
        <Button styles="icon-dark" onClick={goBack}>
          <ArrowLeft size={24} weight="bold" color="white" />
        </Button>

        <Div
          className={`display: flex; justify-content: right; align-items: center; flex-grow: 1; overflow-x: auto;`}
        >
          {Object.entries(settings?.bookmarks || {}).map(
            ([path, { name }], idx) => (
              <Div
                className={css`
                  min-width: 0;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  padding: 4px 8px;
                  margin: 0 4px;
                  ${path === settings?.pwd
                    ? `
                      background-color: ${colors.green};
                      border: 1px solid ${colors.green};
                    `
                    : `
                      background-color: #6500b0;
                      border: 1px solid #4b0082;
                  `};
                  border-radius: 30px;
                  cursor: pointer;
                  p {
                    padding: 0;
                    margin: 0;
                    font-weight: bold;
                    min-width: 50px;
                    flex-grow: 1;
                    ${primaryTags?.ellipsis}
                  }
                `}
                onClick={() => {
                  let data = { ...settings };
                  data.pwd = path;
                  setSettings(data);
                }}
              >
                <Text>{name}</Text>
              </Div>
            )
          )}
          <Button styles="icon-dark" onClick={createBookmark}>
            <Plus color="white" weight="bold" size={24} />
          </Button>
        </Div>
      </Div>

      <form
        className={css`
          position: relative;
          flex-grow: 1;
          display: flex;
          align-items: center;
          z-index: 10;
        `}
        onSubmit={executeCommand}
      >
        <Input
          placeholder={loading ? "Loading..." : "$"}
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onFocus={() => setDisplay(true)}
          onBlur={() => setDisplay(false)}
          styles="fg mv-sm"
          ref={ref}
          disabled={loading}
        />
      </form>
      {display && !!list?.length && (
        <Div
          styles="absolute radius pad-xs zi-10"
          bgColor={colors.black}
          className="max-width: calc(100% - 40px); border: 1px solid white;"
        >
          <Div styles="flex wrap">
            {list?.map((item, idx) =>
              typeof item === "string" ? (
                <Div
                  styles="hover pointer radius-30px m-xs pad-xs"
                  onClick={() => clickCmd(item)}
                >
                  <Text styles="bold no-word-wrap">{item}</Text>
                </Div>
              ) : cmd.startsWith("cd ") || cmd.startsWith(".. ") ? (
                <Div
                  styles={`hover pointer radius-30px m-xs pad-xs ${
                    idx === 0 ? "selected" : ""
                  }`}
                  onClick={() => clickCmd(item.name)}
                >
                  <Text styles="no-word-wrap">{item.name}</Text>
                </Div>
              ) : cmd.startsWith("bm ") ? (
                <Div>
                  <Div styles="ai:c">
                    <Div
                      styles={`hover pointer radius-30px m-xs pad-xs ${
                        idx === 0 ? "selected" : ""
                      }`}
                    >
                      <Text styles="no-word-wrap">{item.name}</Text>
                    </Div>
                    {(args.includes("-h") || args.includes("--help")) &&
                      cmdCount > 2 && (
                        <Div styles="fg jc:sb ai:c padl-sm padv-sm padr">
                          <Text>{item.args}</Text>
                          <Text styles="mh" color={colors.light}>
                            {item.flags || "no flags"}
                          </Text>
                        </Div>
                      )}
                  </Div>
                  {(args.includes("-h") || args.includes("--help")) &&
                    cmdCount > 2 && (
                      <Div styles="flex">
                        <Text
                          styles="radius-30px pad-xs mv-xs"
                          color={colors.light}
                        >
                          {item.description}
                        </Text>
                      </Div>
                    )}
                </Div>
              ) : null
            )}
            {!!detail?.length &&
              detail.map((item, idx) => (
                <Div
                  styles={`hover pointer radius-30px m-xs pad-xs ${
                    (list[0]?.key === "list" ? item === current : idx === 0)
                      ? "selected"
                      : ""
                  }`}
                >
                  <Text styles="no-word-wrap" color={colors.green}>
                    {item}
                  </Text>
                </Div>
              ))}
          </Div>
        </Div>
      )}

      {displayUpstream && (
        <Div styles="modal pad" className="width: 450px;">
          <Text styles="h3 center" color={colors.black}>
            Set Upstream Command
          </Text>
          <Div styles="jc:sa ai:c pad">
            <Text color={colors.black}>Command</Text>
            <Input
              styles="ml fg"
              value={text}
              onChange={(e) => {
                e.stopPropagation();
                setText(e.target.value);
              }}
            />
          </Div>
          <Div styles="jc:r ">
            <Button
              styles="text"
              color={colors.black}
              onClick={() => setDisplayUpstream(false)}
            >
              Close
            </Button>
            <Button styles="ml">Add Command</Button>
          </Div>
        </Div>
      )}
    </>
  );
});
