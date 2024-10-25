import React, { useEffect, useReducer, useRef, useState } from "react";
import { getFilesInDirectory, read, write } from "../node/fs-utils";
import { cmd } from "../node/node-exports";
import { useTerminalActions } from "./use-terminal-actions";
import { merge } from "lodash";
import { useTerminal } from "../terminal/useTerminal";

// "open -n -b "com.microsoft.VSCode" --args "$PWD""

const initialState = {
  settings: {
    pwd: "~",
  },
};

const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE":
      return {
        ...state,
        [action.key]: {
          ...state?.[action.key],
          ...action.payload,
        },
      };
    case "SET":
      return {
        ...state,
        [action.key]: action.payload,
      };
    default:
      return state;
  }
};

export const StoreContext = React.createContext();

export const StoreProvider = (props) => {
  const [data, dispatchStore] = useReducer(reducer, initialState);
  const [cachePath, setCachePath] = useState("");
  const [feedUpdatedAt, setFeedUpdatedAt] = useState(null);

  const feeds = useRef({
    selected: "",
    list: {},
  });

  const updateStore = (key, value) => {
    dispatchStore({
      type: "UPDATE",
      payload: value,
      key,
    });
  };

  const setStore = (key, value) => {
    dispatchStore({
      type: "SET",
      payload: value,
      key,
    });
  };

  const setSettings = (data, options = {}) => {
    const { path = cachePath, updateCache = true } = options;
    if (updateCache) {
      write(path, data);
    }
    setStore("settings", data);
  };

  const setRepos = (updates, options = {}) => {
    let next = { ...(data?.repos || {}), ...updates };
    // data = set;

    const { updateCache = true } = options;
    if (data?.settings?.base && updateCache) {
      write(`${data?.settings?.base}/bm-cache/repos.json`, next);
    }
    setStore("repos", next);
  };

  const changeDirectory = (pwd, base = data.settings.base) => {
    const path = pwd.replace("~", base);
    const newSettings = { ...data.settings, pwd };
    setSettings(newSettings);
    if (path) {
      process.chdir(path);
    }
  };

  const checkGit = (pwd) => {
    try {
      const path = pwd?.replace("~", data?.settings?.base);
      const list = getFilesInDirectory(path, true);
      return list?.findIndex(({ name }) => name === ".git") > -1;
    } catch (err) {
      return false;
    }
  };

  const initialize = async () => {
    try {
      const baseRawPwd = await cmd(`cd ~ && pwd`);
      const base = baseRawPwd.replace(/\n/g, "");
      const cacheKey = `${base}/bm-cache`;
      const cachePath = `${cacheKey}/settings.json`;
      setCachePath(cachePath);
      let data = read(cachePath, { pwd: "~" });
      data = { ...data, base, pwd: data.pwd || "~", cacheKey };
      setStore("settings", { ...data });
      const path = data.pwd.replace("~", base);
      if (path) {
        process.chdir(path);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    initialize();
  }, []);

  const directory = { change: changeDirectory, checkGit };

  const mergeFeed = (updates) => {
    const next = merge({}, feeds.current, updates);
    feeds.current = next;
    setFeedUpdatedAt(new Date().toISOString());
  };

  const setFeed = (feed, updates) => {
    feeds.current = {};
  };

  const methods = {
    directory,
    setSettings,
    setRepos,
    set: setStore,
    update: updateStore,
    executeCommand: cmd,
    clipboard: navigator.clipboard,
    mergeFeed,
  };

  const store = data;

  const value = {
    store,
    feeds,
    setFeedUpdatedAt,
    feedUpdatedAt,
    methods,
  };

  const terminal = useTerminal(value);
  useTerminalActions(value);

  return (
    <StoreContext.Provider value={{ ...value, terminal }}>
      {props.children}
    </StoreContext.Provider>
  );
};
