import { css } from "@emotion/css";
import {
  ArrowLeft,
  ArrowSquareOut,
  Gear,
  Monitor,
  Plus,
  Tree,
} from "phosphor-react";
import { useContext, useEffect, useMemo, useState } from "react";
import { StoreContext } from "./context/store";
import { Finder } from "./directory/finder";
import { Git } from "./git/git";
import { useAnimation } from "./hooks/use-animation";
import { useKeyboard } from "./hooks/use-keyboard";
import { Settings } from "./settings/settings";
import { Div, Text, Button, colors } from "./shared";
import { animation, flex, shadows } from "./shared/utils";
import { cmd } from "./node/node-exports";

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

  const keydown = (captured, event) => {
    if (captured === "meta+KeyF") {
      event.stopPropagation();
      setMode("finder");
    } else if (captured === "meta+KeyD") {
      event.stopPropagation();
      setMode("git");
    } else if (captured === "meta+KeyS") {
      event.stopPropagation();
      setMode("settings");
    } else if (captured === "meta+KeyO") {
      event.preventDefault();
      event.stopPropagation();
      cmd(`open -n -b "com.microsoft.VSCode" --args "$PWD"`);
    } else if (captured.startsWith("meta+Digit")) {
      event.stopPropagation();
      const index = Number(captured.replace("meta+Digit", "")) - 1;
      const [path = ""] = Object.entries(settings?.bookmarks || {})?.[index];
      if (path) {
        directory.change(path);
      }
    } else if (captured === "meta+Equal") {
      event.stopPropagation();
      event.preventDefault();
      createBookmark();
    }
  };

  useKeyboard({ keydown, options: { useCapture: true } });

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
                border-radius: 7px;
                transition: border-bottom 0.15s ease-in-out;
              }
            `}
          >
            <Div
              css={
                mode === "git"
                  ? `border-bottom: 6px solid ${colors.lightBlue};`
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
                  ? `border-bottom: 6px solid ${colors.lightBlue};`
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
                  ? `border-bottom: 6px solid ${colors.lightBlue};`
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
