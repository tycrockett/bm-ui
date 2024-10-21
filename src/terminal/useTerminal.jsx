import { useRef, useState } from "react";
import { useProcesses } from "./useProcesses";
import { v4 as uuid } from "uuid";

export const useTerminal = (props) => {
  const isInitial = useRef(true);

  const { store, feeds, feedUpdatedAt, setFeedUpdatedAt, methods } = props;
  const [children, _setChildren] = useState({});

  const initiateFeedFromChildren = (data) => {
    for (const [pid, child] of Object.entries(data || {})) {
      const feedId = uuid();
      if (
        feeds?.current?.selected === "" &&
        child?.pwd === store?.settings?.pwd
      ) {
        feeds.current.selected = feedId;
      }
      methods.mergeFeed({
        list: {
          [child?.pwd]: {
            [feedId]: {
              name: child?.command,
              pids: [pid],
              output: child?.output,
            },
          },
        },
      });
    }
  };

  const setChildren = (data) => {
    _setChildren(data);
    if (isInitial.current && !Object.keys(feeds?.current?.list)?.length) {
      initiateFeedFromChildren(data);
      isInitial.current = false;
    }
  };

  const initiateFeed = (data) => {
    setFeedUpdatedAt(new Date().toISOString());
    if (
      !(
        feeds?.current?.selected in
        (feeds?.current?.list?.[store.settings.pwd] || {})
      )
    ) {
      const feedId = uuid();
      methods.mergeFeed({
        selected: feedId,
        list: {
          [store?.settings?.pwd]: {
            [feedId]: {
              name: data?.message,
              pids: [data?.pid],
              output: [data],
            },
          },
        },
      });
      feeds.current = {
        selected: feedId,
        list: {
          ...feeds.current.list,
          [store.settings.pwd]: {
            ...feeds.current?.list?.[store.settings.pwd],
            [feedId]: {
              name: data?.message,
              pids: [data?.pid],
              output: [data],
            },
          },
        },
      };
    } else {
      const feedId = feeds.current.selected;
      feeds.current = {
        ...feeds.current,
        list: {
          ...feeds.current.list,
          [store.settings.pwd]: {
            ...feeds.current?.list?.[store.settings.pwd],
            [feedId]: {
              name: data?.message,
              pids: [
                ...feeds.current?.list?.[store.settings.pwd]?.[feedId]?.pids,
                data?.pid,
              ],
              output: [
                ...feeds.current?.list?.[store.settings.pwd]?.[feedId]?.output,
                data,
              ],
            },
          },
        },
      };
    }
  };

  const updateFeed = (data) => {
    setFeedUpdatedAt(new Date().toISOString());
    const feedId = Object.keys(
      feeds?.current?.list?.[store?.settings?.pwd] || {}
    ).find((feedId) => {
      return feeds?.current?.list?.[store?.settings?.pwd]?.[
        feedId
      ]?.pids?.includes(data?.pid);
    });
    if (feedId) {
      feeds.current = {
        ...feeds.current,
        list: {
          ...feeds.current.list,
          [store.settings.pwd]: {
            ...feeds.current?.list?.[store.settings.pwd],
            [feedId]: {
              ...feeds.current?.list?.[store?.settings?.pwd]?.[feedId],
              output: [
                ...feeds.current?.list?.[store?.settings?.pwd]?.[feedId].output,
                data,
              ],
            },
          },
        },
      };
    }
  };

  const clearPid = (data) => {
    setFeedUpdatedAt(new Date().toISOString());
    const feedId = Object.keys(
      feeds?.current?.list?.[store?.settings?.pwd] || {}
    ).find((feedId) => {
      return feeds?.current?.list?.[store?.settings?.pwd]?.[
        feedId
      ]?.pids?.includes(data?.pid);
    });

    if (feedId) {
      feeds.current = {
        ...feeds.current,
        list: {
          ...feeds.current.list,
          [store.settings.pwd]: {
            ...feeds.current?.list?.[store.settings.pwd],
            [feedId]: {
              ...feeds.current?.list?.[store?.settings?.pwd]?.[feedId],
              output: [],
            },
          },
        },
      };
    }
  };

  const killPid = (data) => {
    const feedId = Object.keys(
      feeds?.current?.list?.[store?.settings?.pwd] || {}
    ).find((feedId) => {
      return feeds?.current?.list?.[store?.settings?.pwd]?.[
        feedId
      ]?.pids?.includes(data?.pid);
    });
    if (feedId) {
      const pids = feeds.current?.list?.[store?.settings?.pwd]?.[
        feedId
      ].pids.filter((pid) => pid !== data?.pid);
      feeds.current = {
        ...feeds.current,
        list: {
          ...feeds.current?.list,
          [store.settings.pwd]: {
            ...feeds.current?.list?.[store.settings.pwd],
            [feedId]: {
              ...feeds.current?.list?.[store?.settings?.pwd]?.[feedId],
              pids,
            },
          },
        },
      };
      setFeedUpdatedAt(new Date().toISOString());
    }
  };

  const processes = useProcesses({
    setChildren,
    updateFeed,
    initiateFeed,
    killPid,
    clearPid,
  });

  const onSubmit = (command) => {
    if (command === "exit") {
      setFeedUpdatedAt(new Date().toISOString());
      delete feeds.current.list[store.settings.pwd][feeds.current.selected];
      feeds.current.selected = "";
    } else {
      processes.spawn({ command, pwd: store?.settings?.pwd });
    }
  };

  const createFeed = () => {
    setFeedUpdatedAt(new Date().toISOString());
    const feedId = uuid();
    feeds.current = {
      selected: feedId,
      list: {
        ...feeds.current.list,
        [store.settings.pwd]: {
          ...feeds.current?.list?.[store.settings.pwd],
          [feedId]: {
            name: "",
            pids: [],
            output: [],
          },
        },
      },
    };
  };

  const removeFeed = (id) => {
    for (const pid of feeds.current.list[store.settings.pwd][id].pids) {
      processes.kill(pid);
    }
    delete feeds.current.list[store.settings.pwd][id];
    if (feeds.current.selected === id) {
      feeds.current.selected = "";
    }
    setFeedUpdatedAt(new Date().toISOString());
  };

  const setFeed = (id) => {
    feeds.current.selected = id;
    setFeedUpdatedAt(new Date().toISOString());
  };

  return {
    setFeed,
    createFeed,
    removeFeed,
    onSubmit,
    updatedAt: feedUpdatedAt,
    children,
  };
};

// function isPidRunning(pid) {
//   try {
//     process.kill(pid, 0); // Signal 0 is used to check if the process exists
//     return true; // If no error is thrown, the process is still running
//   } catch (e) {
//     return false; // If an error is thrown, the process is not running
//   }
// }
