import {
  ArrowLeft,
  ArrowSquareOut,
  BookmarkSimple,
  CaretDown,
  File,
  Folder,
  Gear,
  GitBranch,
  List,
  Note,
  Plug,
  Terminal,
  X,
} from "phosphor-react";
import { useContext, useEffect, useState } from "react";
import { StoreContext } from "./context/store";
import { Finder } from "./directory/finder";
import { Git } from "./git/git";
import { useKeyboard } from "./hooks/use-keyboard";
import { Settings } from "./settings/settings";
import { Div, Text, Button, colors } from "./shared";
import { animation, flex, shadows } from "./shared/utils";
import { cmd } from "./node/node-exports";
import { defaultActions } from "./settings/actions";
import { defaultExtensions, Extensions } from "./extensions/extensions";
import { Logs } from "./logs/logs";
import { useOutsideClick } from "./shared/use-outside-click";
import { useInterval } from "./hooks/useInterval";
import { Tooltip } from "./shared/Tooltip";
import { useActions } from "./hooks/useActions";
import { Shortkey } from "./Shortkey";
import { useProcesses } from "./terminal/useProcesses";
import { ipcRenderer } from "electron";
import { useAnimation } from "./hooks/use-animation";

const header = `
  padding: 8px 16px;
  margin-top: 16px;
`;

const App = () => {
  const context = useContext(StoreContext);
  const {
    store,
    methods: { set, setSettings, directory },
  } = context;
  const setMode = (mode) => set("mode", mode);

  const { ports = {}, logs = [] } = store;

  const basePath = store?.settings?.pwd?.replace("~", store?.settings?.base);

  const [dropdown, setDropdown] = useState(false);

  const dirRef = useOutsideClick(
    () => dropdown === "directory" && setDropdown("")
  );

  const settingsRef = useOutsideClick(
    () => dropdown === "settings" && setDropdown("")
  );

  const portsRef = useOutsideClick(() => setDisplayPorts(false));

  const [displayPorts, setDisplayPorts] = useState(false);

  const { settings, mode = "finder" } = store;
  const actions = {
    ...defaultActions,
    ...(settings?.actions || {}),
  };

  const animateShake = {
    animation: animation("shake", ".5s ease"),
    timing: 500,
  };

  const callAttentionBookmark = !(settings?.pwd in (settings?.bookmarks || {}));
  const { animation: shake } = useAnimation(animateShake, [
    callAttentionBookmark,
  ]);

  const killMainPID = async (pid) => {
    await process.kill(pid);
    set("lastCommand", `kill-pid-${new Date().toISOString()}`);
  };

  const splitDir = settings?.pwd?.split("/");
  const displayDirectory = settings?.pwd?.split("/").slice(-1)?.join("/");

  const updatePort = async () => {
    const list = await cmd(
      `lsof -iTCP -sTCP:LISTEN -n -P | grep $(whoami) | awk '{print $9, $2}'`
    );
    const ports = list.split("\n");
    let promises = [];
    for (const port of ports) {
      const [, pid] = port.split(" ");
      if (!!pid) {
        try {
          const promise = cmd(`lsof -p ${pid} | grep cwd | awk '{print $9}'`);
          promises.push(promise);
        } catch {}
      }
    }
    const results = await Promise.all(promises);
    const grouped = results.reduce((p, v, idx) => {
      const values = ports[idx].split(" ");
      const path = v.replace("\n", "");
      const port = values?.[0]?.replace("*", "");
      const pid = values?.[1];
      if (path.startsWith(settings?.base)) {
        return {
          ...p,
          [path]: [
            ...(p?.[path] || []),
            {
              path,
              port,
              pid,
              isClosing: false,
            },
          ],
        };
      }
      return p;
    }, {});
    set("ports", grouped);
  };

  useInterval(updatePort, 5000);

  useEffect(() => {
    updatePort();
  }, [settings?.base, store.lastCommand]);

  useEffect(() => {
    const extensions = defaultExtensions;
    set("extensions", extensions);
  }, []);

  const updateMode = () => {
    const isDirectoryGit = directory.checkGit(settings?.pwd);
    if (isDirectoryGit) {
      setMode("git");
    } else {
      setMode("finder");
    }
  };

  useEffect(() => {
    updateMode();
  }, [settings?.pwd]);

  const goBack = () => {
    let nextPath = settings?.pwd;
    const split = nextPath.split("/");
    if (nextPath !== "~") {
      nextPath = split.slice(0, -1).join("/");
    }
    directory.change(nextPath);
  };

  const createBookmark = () => {
    const current = settings?.pwd?.split("/")?.at(-1);
    setSettings({
      ...settings,
      bookmarks: {
        ...settings?.bookmarks,
        [settings?.pwd]: current,
      },
    });
    setDropdown("");
  };

  const removeBookmark = (e, key) => {
    e.stopPropagation();
    let bookmarks = { ...settings?.bookmarks };
    delete bookmarks[key];
    setSettings({ ...settings, bookmarks });
  };

  useActions({
    "execute-command": (payload) => cmd(payload),
    navigate: (payload) => {
      if (payload.startsWith("mode")) {
        const split = payload.split(".");
        if (split?.length > 1) {
          setMode(split[1]);
        }
      } else if (payload?.startsWith("external")) {
        const to = payload.split(".")?.[1] || "";
        if (to === "vscode") {
          cmd(`open -n -b "com.microsoft.VSCode" --args "$PWD"`);
        } else if (to === "") {
        }
      } else if (payload?.startsWith("internal")) {
        ipcRenderer.send("open-dev-tools");
      }
    },
    create: (payload) => {
      if (payload === "bookmark") {
        createBookmark();
      }
    },
    extension: (payload) => {
      const extension = defaultExtensions?.find((item) => item?.id === payload);
      if (extension) {
        extension?.function({ context });
      }
    },
  });

  const keydown = (captured, event) => {
    if (captured.startsWith("meta+Digit")) {
      const index = Number(captured.replace("meta+Digit", "")) - 1;
      const [path = ""] = Object.entries(settings?.bookmarks || {})?.[index];
      if (path) {
        directory.change(path);
      }
    } else {
      const values = Object.values(actions);
      const entry = values?.find((item) => item?.shortkey === captured);
      if (!!entry) {
        const item = entry;
        event.preventDefault();
        event.stopPropagation();
        set("action", {
          item,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  const openBookmark = (pwd) => {
    const path = pwd?.replace("~", store?.settings?.base);
    cmd(`open -n -b "com.microsoft.VSCode" --args "${path}"`);
  };

  useKeyboard({ keydown });

  const updateDirectory = (key) => {
    directory.change(key);
    updateMode();
  };

  const modeStyle = (current) => `
    ${flex("center")}
    position: relative;
    svg {
      z-index: 1;
      cursor: pointer;
      transition: color 0.2s ease;
      ${
        mode === current
          ? `color: ${colors.darkIndigo};`
          : `color: ${colors.light};`
      }
      :hover {
        outline: 2px solid ${colors.lightBlue};
        outline-offset: 6px;
        border-radius: 50%;
      }
    }
    border-radius: 50%;
    ::before {
      content: "";
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      border-radius: 50%;
      transition: background-color 0.3s ease;
      ${mode === current ? `background-color: ${colors.lightBlue};` : ""}
    }
  `;

  return (
    <Div
      css={`
        width: 100vw;
        height: 100vh;
        overflow: auto;
      `}
    >
      <Div
        css={`
          -webkit-app-region: drag;
          ${flex("space-between")}
          padding: 16px;
          padding-left: 24px;
          margin-bottom: -8px;
          background: linear-gradient(
            100deg,
            ${colors.darkIndigo},
            ${colors.dark}
          );
          gap: 24px;
        `}
      >
        <Text bold>
          {mode === "finder"
            ? "Finder"
            : mode === "git"
            ? "Git Command"
            : mode === "settings"
            ? "Settings"
            : mode === "extensions"
            ? "Extensions"
            : mode === "logs"
            ? "Logs"
            : null}
        </Text>
        <Div
          css={`
            ${flex(`right`)}
            gap: 24px;
          `}
        >
          <Tooltip label="Git Command" shortkey="navigate-git">
            <Div css={modeStyle("git")} onClick={() => setMode("git")}>
              <GitBranch size={24} weight="fill" />
            </Div>
          </Tooltip>
          <Tooltip label="Finder" shortkey="navigate-finder">
            <Div css={modeStyle("finder")} onClick={() => setMode("finder")}>
              <Folder size={24} weight="fill" />
            </Div>
          </Tooltip>
          <Tooltip label="Logs" shortkey="navigate-logs">
            <Div css={modeStyle("logs")} onClick={() => setMode("logs")}>
              <Note size={24} weight="fill" />
            </Div>
          </Tooltip>
          <Tooltip label="Extensions" shortkey="navigate-extensions">
            <Div
              css={modeStyle("extensions")}
              onClick={() => setMode("extensions")}
            >
              <Plug size={24} weight="fill" />
            </Div>
          </Tooltip>
          <Tooltip label="Settings" shortkey="navigate-settings">
            <Div
              css={modeStyle("settings")}
              onClick={() => setMode("settings")}
            >
              <Gear size={24} weight="fill" />
            </Div>
          </Tooltip>
        </Div>
      </Div>
      <Div css={header}>
        <Div
          css={`
            ${flex("left")}
          `}
        >
          <Tooltip label="Move up a directory">
            <Button
              icon
              onClick={settings?.pwd === "~" ? null : goBack}
              css={`
                margin-right: 8px;
                padding: 16px;
              `}
            >
              <ArrowLeft weight="bold" />
            </Button>
          </Tooltip>
          <Div
            css={`
              position: relative;
              border-radius: 8px;
              background-color: ${colors.darkIndigo}33;
              border: 1px solid ${colors.darkIndigo};
              padding: 0 8px;
              flex-grow: 1;
              width: 100%;
              margin-right: 16px;
              ${flex("space-between")}
              cursor: pointer;
              transition: background 0.2s ease;
              :hover {
                background-color: ${colors.darkIndigo};
              }
            `}
            onClick={() => setDropdown(dropdown ? "" : "directory")}
          >
            <Text h3>
              {splitDir?.length > 2 ? "../" : ""}
              {displayDirectory}
            </Text>
            <Button icon>
              <CaretDown />
            </Button>
            {dropdown === "directory" ? (
              <Div
                css={`
                  position: absolute;
                  top: calc(100% + 8px);
                  left: 0;
                  right: 0;
                  background-color: ${colors.darkIndigo};
                  z-index: 1000;
                  border-radius: 8px;
                  overflow: hidden;
                  padding: 8px 0;
                  ${shadows.lg}
                `}
                ref={dirRef}
              >
                {!(settings?.pwd in (settings?.bookmarks || {})) ? (
                  <Div
                    css={`
                      padding: 16px;
                      height: 16px;
                      :hover {
                        background-color: rgba(0, 0, 0, 0.5);
                      }
                      :not(:hover) {
                        button {
                          display: none;
                        }
                      }

                      ${flex("space-between")}
                      svg {
                        margin-left: 8px;
                      }
                    `}
                    onClick={() => createBookmark()}
                  >
                    <Text bold>{settings?.pwd}</Text>
                    <Div
                      css={`
                        ${flex("right")}
                        background-color: ${colors.dark};
                        border-radius: 8px;
                        padding: 8px;
                        margin: -8px;
                        ${shake}
                      `}
                    >
                      <Text>
                        <span>Bookmark</span>
                      </Text>
                      <BookmarkSimple color="white" />
                    </Div>
                  </Div>
                ) : null}
                {Object.entries(settings?.bookmarks || {}).map(
                  ([key, value], idx) => (
                    <Div
                      css={`
                        padding: 8px 16px;
                        height: 16px;
                        :hover {
                          background-color: rgba(0, 0, 0, 0.5);
                        }
                        :not(:hover) {
                          button {
                            display: none;
                          }
                        }
                        :hover {
                          .shortkey {
                            display: none;
                          }
                        }

                        ${flex("space-between")}
                      `}
                      onClick={() => updateDirectory(key)}
                    >
                      <Text>{value}</Text>
                      <Div
                        css={`
                          ${flex("right")}
                        `}
                      >
                        <Shortkey
                          value={`meta+Digit${idx + 1}`}
                          className="shortkey"
                        />
                        <Button
                          icon
                          xs
                          onClick={(e) => {
                            e.stopPropagation();
                            openBookmark(key);
                          }}
                        >
                          <ArrowSquareOut />
                        </Button>
                        <Button icon xs onClick={(e) => removeBookmark(e, key)}>
                          <X />
                        </Button>
                      </Div>
                    </Div>
                  )
                )}
              </Div>
            ) : null}
          </Div>

          {ports?.[basePath]?.length ? (
            <Div
              css={`
                position: relative;
                border-radius: 16px;
                background-color: ${colors.darkIndigo};
                padding: 8px;
                padding-right: 12px;
                margin-right: 8px;

                cursor: pointer;
              `}
              onClick={() => setDisplayPorts(true)}
            >
              <Tooltip label="Active Ports">
                <Div
                  css={`
                    ${flex("right")}
                  `}
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
                  <Text bold>{ports?.[basePath]?.length}</Text>
                </Div>
              </Tooltip>
              {displayPorts ? (
                <Div
                  css={`
                    position: absolute;
                    top: calc(100% + 8px);
                    right: 0;
                    width: 300px;
                    background-color: ${colors.darkIndigo};
                    border-radius: 8px;
                    z-index: 100000;
                    overflow: auto;
                    max-height: 45vh;
                    padding: 8px 0;
                  `}
                  ref={portsRef}
                >
                  {ports?.[basePath]?.map((port) => (
                    <Div
                      css={`
                        padding: 8px 16px;
                        ${flex("space-between")}
                        :hover {
                          background-color: rgba(0, 0, 0, 0.3);
                        }
                      `}
                      onClick={() => killMainPID(port.pid)}
                    >
                      <Text>{port.pid}</Text>
                      <Text bold>{port.port}</Text>
                    </Div>
                  ))}
                </Div>
              ) : null}
            </Div>
          ) : null}
          <Tooltip label="Open directory" shortkey="open-vscode">
            <Button
              icon
              disabled={settings?.pwd === "~"}
              css={`
                padding: 16px;
              `}
              onClick={() =>
                cmd('open -n -b "com.microsoft.VSCode" --args "$PWD"')
              }
            >
              <ArrowSquareOut weight="bold" />
            </Button>
          </Tooltip>
        </Div>
      </Div>
      <Div>
        {mode === "finder" ? (
          <Finder />
        ) : mode === "git" ? (
          <Git />
        ) : mode === "settings" ? (
          <Settings />
        ) : mode === "extensions" ? (
          <Extensions />
        ) : mode === "logs" ? (
          <Logs />
        ) : null}
      </Div>
    </Div>
  );
};

export default App;
