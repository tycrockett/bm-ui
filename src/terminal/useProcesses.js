import { useEffect, useState } from "react";
const { ipcRenderer } = window.require("electron");

const ansiEscapePattern = /\x1Bc|\033c/g;

export const useProcesses = (setList) => {
  const [pid, setPid] = useState("");
  const [children, setChildren] = useState({});

  useEffect(() => {
    if (pid) {
      const child = children[pid];
      setList(child?.output || []);
    } else {
      setList([]);
    }
  }, [pid]);

  const spawn = (data) => {
    if (pid) {
      setList([{ type: "input", message: data?.command }]);
    } else {
      setList((c) => [...c, { type: "input", message: data?.message }]);
    }
    ipcRenderer.send("spawn", data);
  };

  useEffect(() => {
    console.log("listen");
    ipcRenderer.on("pids", (event, data) => {
      console.log(data);
      setChildren(data);
    });
    ipcRenderer.on("message", (event, data) => {
      console.log(data);
      if (data?.message === "[3J[H[2J" || ansiEscapePattern.test(data?.message)) {
        setList([]);
      } else {
        setList((c) => [...c, data]);
      }
      if (data?.type === "close" && pid === data?.pid) {
        setPid("");
      }
    });
    ipcRenderer.send("get-pids");
    return () => {
      console.log("Clear");
      ipcRenderer.removeAllListeners("message");
      ipcRenderer.removeAllListeners("pids");
    };
  }, []);

  return { children, pid, setPid, spawn };
};
