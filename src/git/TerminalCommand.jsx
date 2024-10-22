import { Button, colors, Div, Text } from "../shared";
import { Input } from "../shared";
import { flex, shadows } from "../shared/utils";
import { css } from "@emotion/css";

import Ansi from "ansi-to-react";
import { useContext, useEffect, useRef, useState } from "react";
import { StoreContext } from "../context/store";
import {
  ArrowFatLineDown,
  ArrowsOut,
  ArrowSquareOut,
  CaretDown,
  Function,
  Ghost,
  Plus,
  SignOut,
  Warning,
  X,
} from "phosphor-react";
import { scrollbar } from "../shared/styles";
import { useOutsideClick } from "../shared/use-outside-click";
import { cmd as execCmd } from "../node/node-exports";

const fileMatch = /([a-zA-Z]:\\|\.{1,2}\/|\/)?([\w\s-]+[\/\\])*[\w\s-]+\.\w+/g;

export const TerminalCommand = () => {
  const context = useContext(StoreContext);
  const { store, feeds, terminal, methods } = context;

  const pwdFeeds = feeds?.current?.list?.[store?.settings?.pwd] || {};

  const [displayActions, setDisplayActions] = useState(false);

  const actionsRef = useOutsideClick(() => setDisplayActions(false));
  const terminalInputRef = useRef();

  const [cmd, setCmd] = useState("");

  const handleCmd = async (e) => {
    e.preventDefault();
    terminal?.onSubmit(cmd);
    setCmd("");
  };

  useEffect(() => {
    setTimeout(() => {
      terminalInputRef?.current?.focus();
    }, 200);
  }, [terminal?.updatedAt]);

  const handleTerminalAction = (item) => {
    execCmd(item?.cmd);
    setDisplayActions(false);
  };

  const handleTerminalItem = (item) => {
    if (item?.message?.includes("[eslint]")) {
      const split = item?.message?.split("\n")?.filter((item) => item);
      const firstIndex = split.findIndex((item) => item.includes("[eslint]"));

      let indices = [];
      for (let i = firstIndex + 1; i < split.length; i++) {
        if (fileMatch.test(split[i])) {
          indices.push(i);
        }
      }

      const path = store?.settings?.pwd?.replace("~", store?.settings?.base);
      for (let i = 0; i < indices.length; i++) {
        const file = split[indices[i]];
        for (let j = indices[i]; j < split.length; j++) {
          if (split[j].includes("Line")) {
            const ss = split[j].split(" ").slice(5);
            const s = split[j].split(" ")?.[3];
            const line = s.split(":")?.[0];
            const column = s.split(":")?.[1];
            const label = `${file}:${line}:${column}`;
            handleTerminalAction({
              label,
              type: "eslint",
              description: ss.join(" "),
              cmd: `open -n -b "com.microsoft.VSCode" --args -g "${path}/${file}:${line}"`,
            });
            break;
          }
        }
      }
    }
  };

  const output =
    feeds?.current?.list?.[store?.settings?.pwd]?.[feeds?.current?.selected]
      ?.output;
  return (
    <Div
      css={`
        width: 100%;
      `}
    >
      {/* {Object.keys(store?.terminal?.actions)?.length ? (
        <Div
          css={`
            position: relative;
            ${flex("space-between")}
            border-radius: 8px;
            border: 1px solid ${colors.darkIndigo};
            background-color: rgba(0, 0, 0, 0.2);
            padding: 8px 16px;
            margin: 8px 0;
            :hover {
              background-color: ${colors.darkIndigo};
              cursor: pointer;
            }
          `}
          onClick={() => setDisplayActions(true)}
        >
          <Div
            css={`
              ${flex("left")}
              svg {
                margin-right: 16px;
              }
            `}
          >
            <Warning size={24} color="yellow" />
            <Text>
              Detected Terminal Actions (
              {Object.values(store?.terminal?.actions)[0]?.actions?.length})
            </Text>
          </Div>
          <CaretDown size={24} color="white" />
          {displayActions ? (
            <Div
              ref={actionsRef}
              css={`
                position: absolute;
                max-height: 40vh;
                overflow: hidden;
                overflow-y: auto;
                top: calc(100% + 8px);
                left: 0;
                width: calc(100% - 24px);
                background-color: ${colors.darkIndigo};
                border: 1px solid ${colors.lightBlue};
                border-radius: 8px;
                ${shadows.lg}
                cursor: default;
                padding: 8px 8px;
                z-index: 10000;
              `}
            >
              {Object.keys(store?.terminal?.actions)?.map((item) => {
                return (
                  <Div key={item}>
                    {store?.terminal?.actions?.[item]?.actions?.map(
                      (action) => (
                        <Div
                          css={`
                            ${flex("left")}
                            padding: 8px;
                            border-radius: 8px;
                            :hover {
                              background-color: rgba(0, 0, 0, 0.3);
                              cursor: pointer;
                            }
                          `}
                          onClick={() => handleTerminalAction(action)}
                        >
                          <Div
                            css={`
                              ${flex("center column")}
                              border-radius: 8px;
                              padding: 8px;
                              gap: 8px;
                            `}
                          >
                            {action?.type === "eslint" ? (
                              <Text
                                css={`
                                  color: yellow;
                                  font-weight: bold;
                                  margin-right: 8px;
                                `}
                              >
                                ESLINT
                              </Text>
                            ) : null}
                          </Div>
                          <Div
                            css={`
                              padding: 8px;
                              border-left: 1px solid white;
                            `}
                          >
                            <Text>{action.label}</Text>
                            <pre
                              className={css`
                                word-break: break-word;
                                white-space: pre-wrap;
                                color: white;
                              `}
                            >
                              <Ansi>{action.description}</Ansi>
                            </pre>
                          </Div>
                        </Div>
                      )
                    )}
                  </Div>
                );
              })}
            </Div>
          ) : null}
        </Div>
      ) : null} */}
      <Div
        css={`
          background-color: ${colors.darkIndigo};
          border-radius: 8px;
          overflow: hidden;
          height: calc(100vh - 100px);
          width: 100%;
          box-sizing: border-box;
        `}
      >
        <Div
          css={`
            background-color: rgba(0, 0, 0, 0.2);
            height: 40px;
            width: 100%;
            ${flex("left")}
          `}
        >
          {Object.entries(pwdFeeds || {})?.map(([id, data]) => (
            <Div
              css={`
                ${id === feeds?.current?.selected
                  ? `
                background-color: ${colors.darkIndigo};
              `
                  : ""}
                height: 100%;
                min-width: 8px;
                width: max-content;
                max-width: 200px;
                padding: 0 8px;
                border-right: 1px solid ${colors.darkIndigo};
                ${flex("space-between")}
                cursor: pointer;
                p {
                  margin-right: 8px;
                }
              `}
              onClick={() => terminal.setFeed(id)}
            >
              {data?.name ? <Text ellipsis>{data?.name}</Text> : null}
              <Button
                icon
                sm
                onClick={(e) => {
                  e.stopPropagation();
                  terminal.removeFeed(id);
                }}
              >
                <X />
              </Button>
            </Div>
          ))}
          <Div
            css={`
              height: 100%;
              width: max-content;
              padding-left: 8px;
              ${flex("center")}
            `}
          >
            <Button icon sm onClick={terminal.createFeed}>
              <Plus />
            </Button>
          </Div>
        </Div>
        <Div
          css={`
            width: calc(100% - 32px);
            background: ${colors.darkIndigo};
            height: calc(100% - 180px);
            overflow-y: auto;
            ${scrollbar.style}
            padding: 16px;
            border-bottom: 1px solid black;
          `}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => terminalInputRef?.current?.focus()}
        >
          {output?.slice(-3)?.map((item, idx) => (
            <pre
              className={css`
                border-radius: 8px;
                margin: -4px -16px;
                padding: 6px 16px;
                cursor: default;
                word-break: break-word;
                white-space: pre-wrap;
                color: white;
                ${item?.type !== "input"
                  ? `
                :hover {
                  background-color: rgba(255, 255, 255, 0.05);
                  outline-offset: -3px;
                  outline: 1px solid rgba(255, 255, 255, .2);
                }  
              `
                  : ""}
                ${item?.type === "input"
                  ? `
                  font-weight: bold;
                  background-color: rgba(0, 0, 0, .1);
                  color: ${colors.lightBlue};
                   :hover {
                    background-color: rgba(255, 255, 255, 0.05);
                    outline-offset: -3px;
                    outline: 1px solid rgba(255, 255, 255, .2);
                  }  
                `
                  : item?.type === "error"
                  ? "color: #FF8888;"
                  : item?.type === "close"
                  ? "color: purple;"
                  : ""}
              `}
              onClick={() => handleTerminalItem(item)}
            >
              <Ansi>{item?.message}</Ansi>
            </pre>
          ))}
          {!feeds?.current?.list?.[store?.settings?.pwd]?.[
            feeds?.current?.selected
          ]?.pids?.length ? (
            <form onSubmit={handleCmd}>
              <Input
                css={`
                  background: none;
                  outline: none;
                  border: none;
                  border-radius: 0;
                  color: white;
                  width: 100%;
                  margin: 0 -16px;
                  margin-top: 8px;
                  padding: 4px 16px;
                  font-size: 1em;
                  :focus {
                    background-color: rgba(0, 0, 0, 0.2);
                  }
                `}
                ref={terminalInputRef}
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
              />
            </form>
          ) : null}
        </Div>
      </Div>
    </Div>
  );
};

// <Div
//               css={`
//                 ${flex("space-between column")}
//                 width: calc(100% - 8px);
//               `}
//               onClick={() => terminalInputRef?.current?.focus()}
//             >
//               <Div
//                 css={`
//                   ${flex("left end")}
//                   border-bottom: 3px solid ${colors.darkIndigo};
//                   gap: 8px;
//                   width: 100%;
//                 `}
//               >
//                 <Div
//                   css={`
//                     width: 32px;
//                     height: 16px;
//                     padding: 8px;
//                     border-radius: 8px;
//                     border-bottom-left-radius: 0;
//                     border-bottom-right-radius: 0;
//                     cursor: pointer;
//                     background-color: ${colors.darkIndigo};
//                     ${!terminal?.processes?.pid
//                       ? `${shadows.md}
//                       border-bottom: 2px solid ${colors.darkIndigo};
//                     `
//                       : `border-bottom: none; margin-bottom: 2px;`}
//                   `}
//                   onClick={() => terminal?.processes?.setPid("")}
//                 />
//                 {processes?.map((item) => (
//                   <Text
//                     css={`
//                       padding: 8px;
//                       border-radius: 8px;
//                       border-bottom-left-radius: 0;
//                       border-bottom-right-radius: 0;
//                       cursor: pointer;
//                       background-color: ${colors.darkIndigo};
//                       ${terminal?.processes?.pid === item?.pid
//                         ? `${shadows.md}
//                         border-bottom: 2px solid ${colors.darkIndigo};
//                       `
//                         : `border-bottom: none; margin-bottom: 2px;`}
//                     `}
//                     onClick={() => terminal?.processes?.setPid(item?.pid)}
//                   >
//                     {item?.command}
//                   </Text>
//                 ))}
//               </Div>
//               <Div
//                 css={`
//                   position: relative;
//                   width: 100%;
//                 `}
//               >
//                 <Div
//                   css={`
//                     flex-grow: 1;
//                     background-color: ${colors.darkIndigo};
//                     border-radius: 16px;
//                     border-top-left-radius: 0;
//                     border-top-right-radius: 0;
//                     border-left: 3px solid ${colors.darkIndigo};
//                     border-right: 3px solid ${colors.darkIndigo};
//                     border-bottom: 3px solid ${colors.darkIndigo};
//                     overflow: hidden;
//                     overflow-y: auto;
//                     padding: 16px;
//                     padding-top: 64px;
//                     height: calc(100vh - 400px);
//                     min-height: 8px;
//                     ${scrollbar.style}
//                   `}
//                 >
//                   {!!terminal?.processes?.pid ? (
//                     <Div
//                       css={`
//                         ${flex("right")}
//                         background-color: rgba(0, 0, 0, 0.6);
//                         position: absolute;
//                         top: 8px;
//                         right: 8px;
//                         padding: 8px 16px;
//                         border-radius: 8px;
//                         gap: 16px;
//                       `}
//                     >
//                       <Text
//                         css={`
//                           color: white;
//                           margin-right: 8px;
//                         `}
//                       >
//                         {Math.abs(listMax)} / {terminal.list.length}
//                       </Text>
//                       <Button icon sm onClick={() => setListMax((l) => -3)}>
//                         <Minus size={24} />
//                       </Button>
//                       <Button
//                         icon
//                         sm
//                         onClick={() =>
//                           setListMax((l) => terminal.list.length * -1)
//                         }
//                       >
//                         <Plus size={24} />
//                       </Button>
//                       <Button
//                         icon
//                         sm
//                         onClick={() =>
//                           terminal.processes.kill(terminal?.processes?.pid)
//                         }
//                       >
//                         <X size={24} />
//                       </Button>
//                     </Div>
//                   ) : null}

//                   {terminal.list.slice(listMax).map((item, idx) => (
//                     <pre
//                       onClick={() => handleTerminalItem(item, idx)}
//                       className={css`
//                         border-radius: 8px;
//                         padding: 4px 8px;
//                         margin: -4px -8px;
//                         :hover {
//                           background-color: rgba(255, 255, 255, 0.05);
//                           outline-offset: -3px;
//                           outline: 1px solid white;
//                         }
//                         cursor: default;
//                         word-break: break-word;
//                         white-space: pre-wrap;
//                         color: white;
//                         ${item?.type === "error"
//                           ? "color: #FF8888;"
//                           : item?.type === "close"
//                           ? "color: purple;"
//                           : ""}
//                       `}
//                     >
//                       <Ansi>{item?.message}</Ansi>
//                     </pre>
//                   ))}
//                   {terminal.processes.pid ? null : (
//                     <form onSubmit={handleCmd}>
//                       <Input
//                         css={`
//                           background: none;
//                           outline: none;
//                           border: none;
//                           color: white;
//                           margin: 0 -8px;
//                         `}
//                         ref={terminalInputRef}
//                         value={cmd}
//                         onChange={(e) => setCmd(e.target.value)}
//                       />
//                     </form>
//                   )}

//                   <div ref={terminalRef} />
//                 </Div>
//               </Div>
//             </Div>
