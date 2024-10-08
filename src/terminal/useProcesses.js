import { useContext, useEffect, useRef, useState } from "react";
import { StoreContext } from "../context/store";
const { ipcRenderer } = window.require("electron");

export const useProcesses = (setList) => {
  const context = useContext(StoreContext);
  const [pid, setPid] = useState("");
  const [children, setChildren] = useState({});

  useEffect(() => {
    if (pid) {
      setList(children?.[pid]?.output || []);
    }
  }, [pid]);

  const spawn = (data) => {
    ipcRenderer.send("spawn", data);
  };

  const kill = (pid) => {
    ipcRenderer.send("kill", pid);
  };

  useEffect(() => {
    console.log("listen");
    ipcRenderer.on("pids", (event, data) => setChildren(data));
    ipcRenderer.on("start-spawn", (event, data) => setPid(data));
    ipcRenderer.on("message", (event, data) => setList((c) => [...c, data]));
    ipcRenderer.on("close", (event, data) => {
      setPid((pid) => (pid === data?.pid ? "" : pid));
    });
    ipcRenderer.send("get-pids");
    return () => {
      console.log("Clear");
      ipcRenderer.removeAllListeners("message");
      ipcRenderer.removeAllListeners("pids");
      ipcRenderer.removeAllListeners("start-spawn");
    };
  }, []);

  const setPid_ = (pid) => {
    if (!pid) {
      setList([]);
    }
    setPid(pid);
  };

  return { children, pid, setPid: setPid_, spawn, kill };
};
