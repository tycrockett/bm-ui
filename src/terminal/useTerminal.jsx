import { useContext, useEffect, useState } from "react";
import { cmd, setupChild, terminal } from "../node/node-exports";
import { StoreContext } from "../context/store";
import { deleteFile, getFilesInDirectory, read, write } from "../node/fs-utils";
import { useProcesses } from "./useProcesses";

function isPidRunning(pid) {
  try {
    process.kill(pid, 0); // Signal 0 is used to check if the process exists
    return true; // If no error is thrown, the process is still running
  } catch (e) {
    return false; // If an error is thrown, the process is not running
  }
}

export const useTerminal = () => {
  // console.log(processes);

  const [list, setList] = useState([]);
  const processes = useProcesses(setList);
  const context = useContext(StoreContext);
  const { store } = context;

  const readProcess = async () => {
    // console.log(window.processes);
  };

  useEffect(() => {
    readProcess();
  }, []);

  // const onOut = (pid, update) => {
  //   console.log(update?.data);
  //   if (update?.data === "[3J[H[2J" || ansiEscapePattern.test(update?.data)) {
  //     setList([]);
  //   } else {
  //     setList((c) => [...c, update]);
  //   }
  // };

  // const onClose = (pid) => {
  //   setList((c) => [...c, { type: "close", data: `close process ${pid}` }]);
  // };

  const onSubmit = (command) => {
    processes.spawn({ command, pwd: store?.settings?.pwd });
    // const child = terminal({ command, onOut, onClose });
    // window.processes = [...(window.processes || []), child];
  };

  return {
    onSubmit,
    list,
    processes,
  };
};
