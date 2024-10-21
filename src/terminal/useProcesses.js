import { useContext, useEffect, useRef, useState } from "react";
import { StoreContext } from "../context/store";
const { ipcRenderer } = window.require("electron");

export const useProcesses = (props) => {
  const methods = useRef();
  methods.current = props;

  const spawn = (data) => {
    ipcRenderer.send("spawn", data);
  };

  const kill = (pid) => {
    ipcRenderer.send("kill", pid);
  };

  useEffect(() => {
    console.log("listen");
    ipcRenderer.on("pids", (event, data) => methods.current?.setChildren(data));
    ipcRenderer.on("start-spawn", (event, pid) =>
      methods.current?.initiateFeed(pid)
    );
    ipcRenderer.on("message", (event, data) =>
      methods.current?.updateFeed(data)
    );
    ipcRenderer.on("close", (event, data) => methods.current?.killPid(data));
    ipcRenderer.on("clear", (event, data) => methods.current?.clearPid(data));
    ipcRenderer.send("get-pids");
    return () => {
      console.log("Clear");
      ipcRenderer.removeAllListeners("message");
      ipcRenderer.removeAllListeners("pids");
      ipcRenderer.removeAllListeners("start-spawn");
    };
  }, []);

  return { spawn, kill };
};
