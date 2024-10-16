import {
  ArrowLeft,
  ArrowSquareOut,
  BookmarkSimple,
  CaretDown,
  Command,
  Gear,
  X,
} from "phosphor-react";
import { useContext, useEffect, useState } from "react";
import { StoreContext } from "./context/store";
import { Finder } from "./directory/finder";
import { Git } from "./git/git";
import { useKeyboard } from "./hooks/use-keyboard";
import { Settings } from "./settings/settings";
import { Div, Text, Button, colors } from "./shared";
import { flex, shadows } from "./shared/utils";
import { cmd } from "./node/node-exports";
import { defaultActions } from "./settings/actions";
import { defaultExtensions, Extensions } from "./extensions/extensions";
import { Logs } from "./logs/logs";
import { useOutsideClick } from "./shared/use-outside-click";
import { useInterval } from "./hooks/useInterval";

const header = `
  padding: 8px 16px;
  margin-top: 32px;
`;

const App = () => {
  const context = useContext(StoreContext);
  const {
    store,
    methods: { set, setSettings, directory },
  } = context;
  const setMode = (mode) => set("mode", mode);

  const { ports = {} } = store;

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

  const killMainPID = async (pid) => {
    await process.kill(pid);
    set("lastCommand", `kill-pid-${new Date().toISOString()}`);
  };

  const { settings, mode = "finder" } = store;
  const actions = {
    ...defaultActions,
    ...(settings?.actions || {}),
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
  }, [store.lastCommand]);

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

  const handleActionList = (list) => {
    for (const item of list) {
      const { type, payload } = item;
      if (type === "execute-command") {
        console.log(payload);
        cmd(payload);
      }
    }
  };

  const keydown = (captured, event) => {
    if (captured.startsWith("meta+Digit")) {
      const index = Number(captured.replace("meta+Digit", "")) - 1;
      const [path = ""] = Object.entries(settings?.bookmarks || {})?.[index];
      if (path) {
        directory.change(path);
      }
    } else {
      const entries = Object.entries(actions);
      const entry = entries?.find(([_, item]) => item?.shortkey === captured);

      if (entry?.length) {
        const [key, item] = entry;
        if (item?.type === "bm") {
          event.preventDefault();
          event.stopPropagation();
          if (key === "mode-finder") {
            setMode("finder");
          } else if (key === "mode-git") {
            setMode("git");
          } else if (key === "mode-command-center") {
            setMode("extensions");
          } else if (key === "mode-settings") {
            setMode("settings");
          } else if (key === "create-bookmark") {
            createBookmark();
          }
        } else if (item?.type === "action") {
          event.preventDefault();
          event.stopPropagation();
          handleActionList(item?.list);
        }
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

  return (
    <Div
      css={`
        width: 100vw;
        height: 100vh;
        overflow: auto;
      `}
    >
      <Div css={header}>
        <Div
          css={`
            ${flex("left")}
            margin-bottom: 16px;
          `}
        >
          <Button
            icon
            disabled={settings?.pwd === "~"}
            onClick={goBack}
            css={`
              margin-right: 16px;
              padding: 16px;
            `}
          >
            <ArrowLeft weight="bold" />
          </Button>
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
                  ([key, value]) => (
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
                ${flex("right")}
                cursor: pointer;
              `}
              onClick={() => setDisplayPorts(true)}
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
          <Div
            css={`
              position: relative;
            `}
            ref={settingsRef}
          >
            <Button
              icon
              onClick={() => setDropdown(dropdown ? "" : "settings")}
            >
              <Gear weight="bold" />
            </Button>

            {dropdown === "settings" ? (
              <Div
                css={`
                  position: absolute;
                  top: calc(100% + 8px);
                  right: 0;
                  width: 250px;
                  background-color: ${colors.darkIndigo};
                  z-index: 1000;
                  border-radius: 8px;
                  overflow: hidden;
                  padding: 8px 0;
                  cursor: pointer;
                  ${shadows.lg}
                `}
                onClick={() => setDropdown("")}
              >
                <Div
                  css={`
                    ${flex("space-between")}
                    padding: 8px 16px;
                    :hover {
                      background-color: rgba(0, 0, 0, 0.5);
                    }
                  `}
                  onClick={() => setMode("git")}
                >
                  <Text>Git Command</Text>
                  <Div
                    css={`
                      ${flex("right")}
                      svg {
                        min-width: 16px;
                      }
                    `}
                  >
                    <Command color={colors.light} size={16} />
                    <Text
                      css={`
                        color: ${colors.light};
                      `}
                    >
                      G
                    </Text>
                  </Div>
                </Div>
                <Div
                  css={`
                    ${flex("space-between")}
                    padding: 8px 16px;
                    :hover {
                      background-color: rgba(0, 0, 0, 0.5);
                    }
                  `}
                  onClick={() => setMode("finder")}
                >
                  <Text>Finder</Text>
                  <Div
                    css={`
                      ${flex("right")}
                      svg {
                        min-width: 16px;
                      }
                    `}
                  >
                    <Command color={colors.light} size={16} />
                    <Text
                      css={`
                        color: ${colors.light};
                      `}
                    >
                      F
                    </Text>
                  </Div>
                </Div>
                <Div
                  css={`
                    ${flex("space-between")}
                    padding: 8px 16px;
                    :hover {
                      background-color: rgba(0, 0, 0, 0.5);
                    }
                  `}
                  onClick={() => setMode("logs")}
                >
                  <Text>Logs</Text>
                  <Div
                    css={`
                      ${flex("right")}
                      svg {
                        min-width: 16px;
                      }
                    `}
                  >
                    <Command color={colors.light} size={16} />
                    <Text
                      css={`
                        color: ${colors.light};
                      `}
                    >
                      D
                    </Text>
                  </Div>
                </Div>
                <Div
                  css={`
                    ${flex("space-between")}
                    padding: 8px 16px;
                    :hover {
                      background-color: rgba(0, 0, 0, 0.5);
                    }
                  `}
                  onClick={() => setMode("extensions")}
                >
                  <Text>Extensions</Text>
                  <Div
                    css={`
                      ${flex("right")}
                      svg {
                        min-width: 16px;
                      }
                    `}
                  >
                    <Command color={colors.light} size={16} />
                    <Text
                      css={`
                        color: ${colors.light};
                      `}
                    >
                      D
                    </Text>
                  </Div>
                </Div>

                <Div
                  css={`
                    ${flex("space-between")}
                    padding: 8px 16px;
                    :hover {
                      background-color: rgba(0, 0, 0, 0.5);
                    }
                  `}
                  onClick={() => setMode("settings")}
                >
                  <Text>Settings</Text>
                  <Div
                    css={`
                      ${flex("right")}
                      svg {
                        min-width: 16px;
                      }
                    `}
                  >
                    <Command color={colors.light} size={16} />
                    <Text
                      css={`
                        color: ${colors.light};
                      `}
                    >
                      S
                    </Text>
                  </Div>
                </Div>
                <Div
                  css={`
                    ${flex("space-between")}
                    padding: 8px 16px;
                    :hover {
                      background-color: rgba(0, 0, 0, 0.5);
                    }
                  `}
                  onClick={() => setMode("settings")}
                >
                  <Text>Create Bookmark</Text>
                  <Div
                    css={`
                      ${flex("right")}
                      svg {
                        min-width: 16px;
                      }
                    `}
                  >
                    <Command color={colors.light} size={16} />
                    <Text
                      css={`
                        color: ${colors.light};
                      `}
                    >
                      +
                    </Text>
                  </Div>
                </Div>
              </Div>
            ) : null}
          </Div>
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
