import { ArrowLeft, Gear, Monitor, Plus, Tree } from "phosphor-react";
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

const header = `
  padding: 8px 16px;
`;

const App = () => {
  const {
    store,
    methods: { setSettings, directory },
  } = useContext(StoreContext);
  const [mode, setMode] = useState("finder");

  const { settings } = store;
  const actions = {
    ...defaultActions,
    ...(settings?.actions || {}),
  };

  const splitDir = settings?.pwd?.split("/");
  const displayDirectory = settings?.pwd?.split("/").slice(-2)?.join("/");

  useEffect(() => {
    const isDirectoryGit = directory.checkGit(settings?.pwd);
    if (isDirectoryGit) {
      setMode("git");
    } else {
      setMode("finder");
    }
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
  };

  const handleActionList = (list) => {
    for (const item of list) {
      const { type, payload } = item;
      if (type === "execute-command") {
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
      const entry = entries?.find(([_, item]) => {
        console.log(item);
        return item?.shortkey === captured;
      });

      if (entry?.length) {
        const [key, item] = entry;
        if (item?.type === "bm") {
          event.preventDefault();
          event.stopPropagation();
          if (key === "mode-finder") {
            setMode("finder");
          } else if (key === "mode-git") {
            setMode("git");
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

  useKeyboard({ keydown });

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
            ${flex("space-between")}
            margin-bottom: 16px;
          `}
        >
          <Div
            css={`
              ${flex("left")}
            `}
          >
            <Button
              icon
              disabled={settings?.pwd === "~"}
              onClick={goBack}
              css={`
                margin-right: 16px;
              `}
            >
              <ArrowLeft />
            </Button>
            <Text
              h2
              css={`
                cursor: pointer;
                :hover {
                  text-decoration: underline;
                }
              `}
              onClick={() =>
                cmd(`open -n -b "com.microsoft.VSCode" --args "$PWD"`)
              }
            >
              {splitDir?.length > 2 ? "../" : ""}
              {displayDirectory}
            </Text>
          </Div>

          <Div
            css={`
              ${flex("right")}
              > div {
                padding-bottom: 0;
                transition: border-radius 0.1s ease,
                  border-bottom-right-radius 0.1s ease,
                  border-bottom-left-radius 0.1s ease;
              }
            `}
          >
            <Div
              css={
                mode === "git"
                  ? `
                    border-bottom: 6px solid ${colors.lightBlue};
                    border-radius: 16px;
                    border-bottom-right-radius: 3px;`
                  : "border-bottom: 6px solid transparent;"
              }
            >
              <Button icon onClick={() => setMode("git")}>
                <Tree weight="bold" />
              </Button>
            </Div>
            <Div
              css={
                mode === "finder"
                  ? `border-bottom: 6px solid ${colors.lightBlue}; border-radius: 5px;`
                  : "border-bottom: 6px solid transparent;"
              }
            >
              <Button icon onClick={() => setMode("finder")}>
                <Monitor weight="bold" />
              </Button>
            </Div>
            <Div
              css={
                mode === "settings"
                  ? `border-bottom: 6px solid ${colors.lightBlue};
                    border-radius: 16px;
                    border-bottom-left-radius: 3px;
                    `
                  : "border-bottom: 6px solid transparent;"
              }
            >
              <Button icon onClick={() => setMode("settings")}>
                <Gear weight="bold" />
              </Button>
            </Div>
          </Div>
        </Div>

        <Div
          css={`
            ${flex("space-between")}
          `}
        >
          <Div
            css={`
              ${flex("right grow")}
              overflow-x: auto;
              padding: 8px 0;
            `}
          >
            {Object.entries(settings?.bookmarks || {}).map(([key, value]) => (
              <Div
                css={`
                  border-radius: 8px;
                  padding: 8px;
                  margin-right: 2px;
                  font-weight: bold;
                  cursor: pointer;
                  ${key === settings?.pwd
                    ? `
                        background-color: ${colors.green};
                        ${shadows.lg}
                        ${animation("shake", ".2s ease")}
                      `
                    : `
                        background-color: rgba(0, 0, 0, .2);
                      `}
                `}
                onClick={() => directory.change(key)}
              >
                <Text>{value}</Text>
              </Div>
            ))}
          </Div>
          <Div
            css={`
              padding-left: 8px;
              margin-left: 16px;
              border-left: 4px solid ${colors.indigo};
            `}
            style={{ borderRadius: 0 }}
          >
            <Button icon onClick={createBookmark}>
              <Plus weight="bold" />
            </Button>
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
        ) : null}
      </Div>
    </Div>
  );
};

export default App;
