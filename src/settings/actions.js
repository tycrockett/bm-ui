import {
  NavigationArrow,
  Plus,
  PlusCircle,
  Terminal,
  TrashSimple,
  X,
} from "phosphor-react";
import { useEffect, useRef, useState } from "react";
import { Button, colors, Div, Input, Modal, Text } from "../shared";
import { flex, styles } from "../shared/utils";
import uuid4 from "uuid4";
import { useKeyboard } from "../hooks/use-keyboard";
import { Select } from "../shared/select";
import { isEqual } from "lodash";
import { Shortkey } from "../Shortkey";

const splice = (array, idx, deleteCount, ...items) => {
  let next = [...array];
  next.splice(idx, deleteCount, ...items);
  return next;
};

export const Actions = ({ settings, setSettings }) => {
  const actions = {
    ...defaultActions,
    ...(settings?.actions || {}),
  };

  const [actionKey, setActionKey] = useState("");
  const [action, setAction] = useState(null);
  const [focus, setFocus] = useState(false);
  const shortkeyRef = useRef(null);

  const closeAction = () => {
    setActionKey("");
    setAction(null);
  };

  useEffect(() => {
    if (actionKey === "create-action") {
      setAction({ name: "", type: "action" });
    } else if (actionKey) {
      setAction(actions[actionKey]);
    }
  }, [actionKey]);

  const saveAction = () => {
    const key = actionKey === "create-action" ? uuid4() : actionKey;
    let actions = {
      ...(settings?.actions || {}),
      [key]: action,
    };
    actions = Object.entries(actions).reduce((acc, [key, value]) => {
      if (isEqual(value, defaultActions[key])) {
        return acc;
      }
      return {
        ...acc,
        [key]: value,
      };
    }, {});
    setSettings({ ...settings, actions });
    closeAction();
  };

  const removeAction = () => {
    const nextActions = { ...actions };
    delete nextActions[actionKey];
    setSettings({
      ...settings,
      actions: nextActions,
    });
    closeAction();
  };

  const keydown = (captured, event) => {
    if (focus) {
      event.stopPropagation();
      event.preventDefault();
      setAction({
        ...action,
        shortkey: captured,
      });
    }
  };

  useKeyboard({ keydown, options: { capture: true } });

  return (
    <>
      <Div
        css={`
          ${flex("space-between")}
          margin-top: 24px;
          margin-bottom: 8px;
        `}
      >
        <Text
          h2
          css={`
            margin: 8px 0;
          `}
        >
          Actions
        </Text>
        <Button icon onClick={() => setActionKey("create-action")}>
          <Plus />
        </Button>
      </Div>
      {Object.entries(actions)?.map(([key, item]) => (
        <Div
          css={`
            padding: 8px 16px;
            margin: 0 -16px;
            ${styles.hover}
          `}
        >
          <Div
            css={`
              ${flex("space-between")}
              gap: 8px;
              svg {
                color: white;
              }
            `}
            onClick={() => setActionKey(key)}
          >
            {item?.list?.[0]?.type === "navigate" ? (
              <NavigationArrow />
            ) : item?.list?.[0]?.type === "create" ? (
              <PlusCircle />
            ) : item?.list?.[0]?.type === "execute-command" ? (
              <Terminal />
            ) : null}
            <Div
              css={`
                flex-grow: 1;
              `}
            >
              <Text>{item.name}</Text>
            </Div>
            <Shortkey value={item.shortkey} />
          </Div>
        </Div>
      ))}
      {!!actionKey ? (
        <Modal
          css={`
            width: 400px;
            padding: 24px;
          `}
        >
          <Div
            css={`
              ${flex("space-between")}
            `}
          >
            <Text h2>Action</Text>
            <Button icon onClick={closeAction}>
              <X />
            </Button>
          </Div>
          <Div
            css={`
              ${flex("space-between")}
              padding: 8px 0;
              padding-top: 16px;
            `}
          >
            <Text h3 bold>
              Display Name
            </Text>
            <Input
              css={`
                width: 50%;
              `}
              value={action?.name || ""}
              onChange={(e) => setAction({ ...action, name: e.target.value })}
            />
          </Div>
          <Div
            css={`
              ${flex("space-between")}
              padding: 8px 0;
              padding-top: 16px;
            `}
          >
            <Text h3 bold>
              Shortkey
            </Text>
            <Div
              css={`
                ${flex("center")}
                border: 1px solid ${colors.darkIndigo};
                border-radius: 8px;
                background-color: ${colors.darkIndigo};
                width: 50%;
                padding: 8px 8px;
                :focus-within {
                  outline: 2px solid ${colors.lightBlue};
                }
                cursor: pointer;
              `}
              onClick={() => shortkeyRef?.current?.focus()}
            >
              <Input
                ref={shortkeyRef}
                css={`
                  width: 0;
                  height: 0;
                  padding: 0;
                `}
                value={action?.shortkey || ""}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
              />
              <Shortkey value={action?.shortkey} />
            </Div>
          </Div>

          <Div
            css={`
              margin-top: 8px;
            `}
          >
            <Div
              css={`
                ${flex("space-between")}
                margin-top: 4px;
              `}
            >
              <Text h3 bold>
                Actions
              </Text>
              <Button
                icon
                onClick={() =>
                  setAction({
                    ...action,
                    list: [...(action.list || []), { type: "execute-command" }],
                  })
                }
              >
                <Plus />
              </Button>
            </Div>
            <Div
              css={`
                max-height: 45vh;
                overflow: auto;
              `}
            >
              {action?.list?.map((item, idx) => (
                <Div
                  css={`
                    ${flex("left start")}
                    margin: 4px 0;
                    padding: 16px;
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 8px;
                  `}
                >
                  <Div
                    css={`
                      flex-grow: 1;
                      margin-right: 8px;
                    `}
                  >
                    <Div
                      css={`
                        ${flex("space-between")}
                      `}
                    >
                      <Text bold>Action Type</Text>
                      <Select
                        value={item?.type}
                        onChange={(e) =>
                          setAction({
                            ...action,
                            list: splice(action?.list, idx, 1, {
                              ...item,
                              type: e.target.value,
                            }),
                          })
                        }
                      >
                        <option value="execute-command">Execute Command</option>
                        <option value="navigate">Navigate</option>
                        <option value="create">Create</option>
                      </Select>
                    </Div>
                    {item?.type === "execute-command" ? (
                      <Input
                        value={item?.payload}
                        onChange={(e) =>
                          setAction({
                            ...action,
                            list: splice(action?.list, idx, 1, {
                              ...item,
                              payload: e.target.value,
                            }),
                          })
                        }
                        css={`
                          margin: 8px 0;
                          width: calc(100% - 16px);
                        `}
                      />
                    ) : item?.type === "navigate" ? (
                      <Select
                        value={item?.payload}
                        onChange={(e) =>
                          setAction({
                            ...action,
                            list: splice(action?.list, idx, 1, {
                              ...item,
                              payload: e.target.value,
                            }),
                          })
                        }
                        css={`
                          width: 100%;
                          margin-top: 8px;
                        `}
                      >
                        <option value="">N/A</option>
                        {Object.values(navigate)?.map((value) => (
                          <option value={value}>{value}</option>
                        ))}
                      </Select>
                    ) : item?.type === "create" ? (
                      <Select
                        value={item?.payload}
                        onChange={(e) =>
                          setAction({
                            ...action,
                            list: splice(action?.list, idx, 1, {
                              ...item,
                              payload: e.target.value,
                            }),
                          })
                        }
                        css={`
                          width: 100%;
                          margin-top: 8px;
                        `}
                      >
                        <option value="">N/A</option>
                        {Object.values(create)?.map((value) => (
                          <option value={value}>{value}</option>
                        ))}
                      </Select>
                    ) : null}
                  </Div>
                  <Button
                    icon
                    sm
                    onClick={() => {
                      const list = action?.list?.filter((_, i) => i !== idx);
                      setAction({ ...action, list });
                    }}
                  >
                    <X />
                  </Button>
                </Div>
              ))}
            </Div>
            <Div
              css={`
                ${flex("space-between")}
                margin-top: 16px;
              `}
            >
              <Button icon sm onClick={removeAction}>
                <TrashSimple />
              </Button>
              <Div
                css={`
                  ${flex("right")}
                `}
              >
                <Button
                  secondary
                  css={`
                    margin-right: 16px;
                  `}
                  onClick={closeAction}
                >
                  Cancel
                </Button>
                <Button onClick={saveAction}>Save Action</Button>
              </Div>
            </Div>
          </Div>
        </Modal>
      ) : null}
    </>
  );
};

const navigate = {
  modeFinder: "mode.finder",
  modeExtensions: "mode.extensions",
  modeSettings: "mode.settings",
  modeGit: "mode.git",
  modeLogs: "mode.logs",

  gitCommand: "mode.git.command",
  gitTerminal: "mode.git.terminal",
  gitNotes: "mode.git.notes",

  externalGithub: "external.github",
  externalVSCode: "external.vscode",
};

const create = {
  bookmark: "bookmark",
};

export const defaultActions = {
  "navigate-finder": {
    name: "View Finder",
    shortkey: "meta+KeyF",
    list: [
      {
        type: "navigate",
        payload: navigate?.modeFinder,
      },
    ],
  },
  "navigate-git": {
    name: "View Git",
    shortkey: "meta+KeyG",
    list: [
      {
        type: "navigate",
        payload: navigate?.gitCommand,
      },
    ],
  },
  "navigate-git-command": {
    name: "View Git Command",
    shortkey: "meta+KeyG",
    list: [
      {
        type: "navigate",
        payload: navigate?.gitCommand,
      },
    ],
  },
  "navigate-extensions": {
    name: "View Extensions",
    shortkey: "meta+KeyD",
    list: [
      {
        type: "navigate",
        payload: navigate?.modeExtensions,
      },
    ],
  },
  "navigate-logs": {
    name: "View Logs",
    shortkey: "meta+KeyL",
    list: [
      {
        type: "navigate",
        payload: navigate?.modeLogs,
      },
    ],
  },
  "navigate-settings": {
    name: "View Settings",
    shortkey: "meta+KeyS",
    list: [
      {
        type: "navigate",
        payload: navigate?.modeSettings,
      },
    ],
  },
  "open-internal-terminal": {
    name: "Open Terminal",
    shortkey: "meta+KeyT",
    list: [
      {
        type: "navigate",
        payload: navigate?.gitTerminal,
      },
    ],
  },
  "open-branch-notes": {
    name: "Open Branch Notes",
    shortkey: "meta+KeyN",
    list: [
      {
        type: "navigate",
        payload: navigate?.gitNotes,
      },
    ],
  },
  "open-github": {
    name: "Open branch in github",
    shortkey: "meta+KeyR",
    list: [
      {
        type: "navigate",
        payload: navigate?.externalGithub,
      },
    ],
  },
  "open-vscode": {
    name: "Open VS code",
    shortkey: "meta+KeyO",
    list: [
      {
        type: "navigate",
        payload: navigate?.externalVSCode,
      },
    ],
  },
  "create-bookmark": {
    name: "Create bookmark",
    shortkey: "meta+Equal",
    list: [
      {
        type: "create",
        payload: create.bookmark,
      },
    ],
  },
  "open-terminal": {
    name: "Open External Terminal",
    shortkey: "meta+shift+KeyT",
    list: [
      {
        type: "execute-command",
        payload: "open -a terminal .",
      },
    ],
  },
};
