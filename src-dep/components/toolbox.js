import { css } from "@emotion/css";
import { format } from "date-fns";
import { ArrowSquareOut, Bug, CaretDown, CaretUp, X } from "phosphor-react";
import { useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useStore } from "../context/use-store";
import { useForm } from "../hooks/use-form";
import { write } from "../node/fs-utils";
import { cmd } from "../node/node-exports";
import { Button } from "../shared-styles/button";
import { Div } from "../shared-styles/div";
import { Input } from "../shared-styles/input";
import { Text } from "../shared-styles/text";

export const linkOutLocalBuild = async (localBuildDomain) => {
  const text = await navigator.clipboard.readText();
  try {
    const url = new URL(text);
    const nextUrl = `${localBuildDomain}${url?.pathname}`;
    await cmd(`open "${nextUrl}"`);
  } catch (err) {
    console.warn(err);
    toast.error(`Error getting local link`);
    toast.info(`ERROR: ${text}`);
  }
};

export const Toolbox = ({ onClose }) => {
  const {
    store: { settings, cacheKey },
    setStore,
  } = useStore();

  // localBuildDomain: "http://localhost:3000",

  const updateSettings = (updates) => {
    const data = { ...settings, ...updates };
    if (cacheKey) {
      write(`${cacheKey}/settings.json`, data);
    }
    setStore("settings", data);
  };

  const onBlur = (e) => {
    const { name } = e;
    updateSettings({ [name]: form?.[name] });
  };

  const [bug, setBug] = useState("");
  const [bugOptions, setBugOptions] = useState({});

  const handleBug = async (e) => {
    e.preventDefault();
    const text = await navigator.clipboard.readText();
    setBug(text);
  };

  const { getProperty, form } = useForm(settings, [settings]);

  const handleBmCodePath = async (e) => {
    e.preventDefault();
    const path = form?.bmCodePath.replace("~", settings.base);
    const bmEditorCmd = settings?.cmds?.codeEditorCmd?.replace("$PWD", path);
    try {
      await cmd(bmEditorCmd);
    } catch (err) {
      console.warn(err);
      toast.error(`Error...`);
    }
  };

  const handleLinkOut = (e) => {
    e.preventDefault();
    linkOutLocalBuild(form?.localBuildDomain);
  };

  const valueBug = useMemo(() => {
    if (bug) {
      let data = JSON.parse(bug);

      data.localPathname = "";

      try {
        const url = new URL(data?.pathname);
        data.localPathname = `${form?.localBuildDomain}${url?.pathname}`;
      } catch (err) {
        console.warn(err);
      }

      return data;
    }
    return {};
  }, [bug, form?.localBuildDomain]);

  return (
    <Div styles="modal" onClose={onClose}>
      {!!bug ? (
        <Div
          className={css`
            width: 100vw;
            height: 100vh;
            overflow: scroll;
          `}
        >
          <Div
            className={css`
              padding: 32px;
            `}
          >
            <Text styles="h3">
              {format(new Date(valueBug?.timestamp), "MMM dd, yyyy | h:mm a")}
            </Text>
            <Div
              className={css`
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 0;
              `}
            >
              <Div
                className={css`
                  display: flex;
                  align-items: center;
                  justify-content: left;
                `}
              >
                <Button
                  className={css`
                    margin-right: 16px;
                  `}
                  onClick={() => cmd(`open "${valueBug?.pathname}"`)}
                >
                  View Live
                </Button>
                <Button
                  onClick={() => cmd(`open "${valueBug?.localPathname}"`)}
                >
                  View Local
                </Button>
              </Div>
              <Button styles="icon" onClick={() => setBug("")}>
                <X />
              </Button>
            </Div>
            <Div styles="jc:sb ai:c">
              <Text
                className={css`
                  font-weight: bold;
                  font-size: 1.2em;
                `}
              >
                Logs
              </Text>
              <Button
                onClick={() => setBugOptions((e) => ({ ...e, logs: !e.logs }))}
                styles="icon"
              >
                {bugOptions?.logs ? <CaretUp /> : <CaretDown />}
              </Button>
            </Div>
            {bugOptions?.logs &&
              valueBug?.logs?.map((item) => (
                <Div
                  className={css`
                    display: flex;
                    align-items: start;
                    margin: 16px 0;
                    background-color: rgba(0, 0, 0, 0.2);
                    padding: 8px;
                    border-radius: 16px;
                  `}
                >
                  <Text
                    className={css`
                      font-weight: bold;
                      ${item?.type === "error"
                        ? "color: red;"
                        : "color: yellow;"}
                    `}
                  >
                    {item?.type}
                  </Text>
                  <Text
                    className={css`
                      margin-left: 32px;
                    `}
                  >
                    {JSON.stringify(item?.value)}
                  </Text>
                </Div>
              ))}

            <Div
              styles="jc:sb ai:c"
              className={css`
                margin-top: 32px;
              `}
            >
              <Text
                className={css`
                  font-weight: bold;
                  font-size: 1.2em;
                `}
              >
                Request Errors
              </Text>
              <Button
                onClick={() =>
                  setBugOptions((e) => ({
                    ...e,
                    requestErrors: !e.requestErrors,
                  }))
                }
                styles="icon"
              >
                {bugOptions?.requestErrors ? <CaretUp /> : <CaretDown />}
              </Button>
            </Div>
            {bugOptions?.requestErrors &&
              valueBug?.requestErrors?.map((item) => (
                <Div
                  className={css`
                    margin: 16px 0;
                    background-color: rgba(0, 0, 0, 0.2);
                    padding: 8px;
                    border-radius: 16px;
                  `}
                >
                  <Text
                    className={css`
                      margin: 16px 32px;
                      font-weight: bold;
                    `}
                  >
                    {item?.url}
                  </Text>
                  <Text
                    className={css`
                      margin: 16px 32px;
                    `}
                  >
                    {item?.message}
                  </Text>
                  <Div
                    className={css`
                      margin: 16px 32px;
                    `}
                  >
                    <Text>
                      <strong>BusinessID</strong> {item?.headers?.BusinessID}
                    </Text>
                    <Text>
                      <strong>ParentID</strong> {item?.headers?.ParentID}
                    </Text>
                  </Div>
                </Div>
              ))}
          </Div>
        </Div>
      ) : (
        <Div
          className={css`
            width: 100vw;
            height: 100vh;
          `}
        >
          <Div
            styles="jc:sb ai:c"
            className={css`
              padding: 32px;
            `}
          >
            <Text styles="h1">Toolbox</Text>
            <Button styles="icon" onClick={onClose}>
              <X />
            </Button>
          </Div>

          <form onSubmit={handleBug}>
            <Div
              styles="jc:sb ai:c"
              className={css`
                padding: 8px 32px;
              `}
            >
              <Text>View Bug</Text>
              <Div
                styles="jc:r ai:c"
                className={css`
                  width: 50%;
                `}
              >
                <Button type="submit">
                  <Bug size={32} />
                </Button>
              </Div>
            </Div>
          </form>

          <form onSubmit={handleBmCodePath}>
            <Div
              styles="jc:sb ai:c"
              className={css`
                padding: 8px 32px;
              `}
            >
              <Text>Open BM-UI Code</Text>
              <Div
                styles="ai:c"
                className={css`
                  width: 50%;
                `}
              >
                <Input
                  className={css`
                    margin-right: 16px;
                    width: 100%;
                  `}
                  {...getProperty("bmCodePath")}
                  onBlur={onBlur}
                />
                <Button type="submit">
                  <ArrowSquareOut weight="bold" />
                </Button>
              </Div>
            </Div>
          </form>

          <form onSubmit={handleLinkOut}>
            <Div
              styles="jc:sb ai:c"
              className={css`
                padding: 8px 32px;
              `}
            >
              <Text>Local Build Link Opener</Text>
              <Div
                styles="ai:c"
                className={css`
                  width: 50%;
                `}
              >
                <Input
                  className={css`
                    margin-right: 16px;
                    width: 100%;
                  `}
                  {...getProperty("localBuildDomain")}
                  onBlur={onBlur}
                />
                <Button type="submit">
                  <ArrowSquareOut weight="bold" />
                </Button>
              </Div>
            </Div>
          </form>
        </Div>
      )}
    </Div>
  );
};
