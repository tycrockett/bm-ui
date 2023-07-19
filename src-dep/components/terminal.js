import { css } from "@emotion/css";
import { useEffect } from "react";
import { Div } from "../shared-styles/div";
import { Select } from "../shared-styles/Select";
import { useStore } from "../context/use-store";
import { useTerminal } from "../hooks/use-terminal";

export const Terminal = ({ display }) => {

  const { store: { output = [], sessions = [], sessionIdx = 0 }, setStore} = useStore();
  const { killSession } = useTerminal();

  const current = sessions?.[sessionIdx] || {};

  const selectSession = (event) => {
    const value = sessions.findIndex(({ pid }) => event.target.value === pid);
    if (value > -1) {
      setStore('sessionIdx', value);
    }
  }

  const handleKeydown = (event) => {
    const { key, metaKey, altKey, ctrlKey, shiftKey } = event;
    const code = `${metaKey ? 'meta+' : ''}${altKey ? 'alt+' : ''}${ctrlKey ? 'ctrl+' : ''}${shiftKey ? 'shift+' : ''}${key}`;
    if (code === 'ctrl+c' && current) {
      event.preventDefault();
      killSession(current);
    }
  }

  useEffect(() => {
    setStore('sessionIdx', sessions.length - 1);
  }, [sessions.length]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown, null);
    return () => document.removeEventListener('keydown', handleKeydown, null);
  }, [current]);

  if (!display) {
    return null;
  }

  const displaySession = (id) => {
    if (sessions.length) {
      const session = sessions.find(({ pid }) => (pid === id));
      return `${session?.sessionsByPwd > 0 ? `(${session?.sessionsByPwd})` : ''} ${session?.pwd} - ${session?.cmd}`;
    } else {
      return '';
    }
  }

  const outputList = output.filter(({ pid }) => !pid || pid === current?.pid);

  return (
    <Div>
      <Div
        className={`
          display: flex;
          flex-direction: column-reverse;
          overflow: auto;
          height: calc(100vh - 200px);
          background-color: black;
          color: white;
          font-family: monospace;
          padding: 4px 0;
          font-size: 1.2em;
          cursor: text;
          border: 1px solid #666;
      `}>
        {outputList?.map(({ pid, data }, idx) =>
          <pre key={pid + idx} className={css`margin: 0; padding: 0 4px; white-space: pre-wrap;`}>
            {data}
          </pre>
        )}
      </Div>
      <Select
        reverse
        disabled={!sessions?.length}
        styles="dark"
        value={current?.pid}
        onChange={selectSession}
        displayFn={displaySession}
      >
        {sessions?.map((value) => (
          <option value={value.pid} key={value.pid}>
            {`${value.pwd} ${value.cmd}`}
          </option>
        ))}
      </Select>
    </Div>
  );
}