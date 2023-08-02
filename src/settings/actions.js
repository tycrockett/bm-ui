import { Gear, GitBranch, Monitor, Plus, Square, X } from "phosphor-react";
import { useEffect, useState } from "react";
import { Button, colors, Div, Input, Modal, Text } from "../shared";
import { flex, styles } from "../shared/utils";
import uuid4 from "uuid4";
import { useKeyboard } from "../hooks/use-keyboard";

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

  const shortkeys = Object.keys(actions).map(({ shortkey }) => shortkey);

  const [actionKey, setActionKey] = useState("");
  const [action, setAction] = useState(null);
  const [focus, setFocus] = useState(false);

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
    setSettings({
      ...settings,
      actions: {
        ...(actions || {}),
        [key]: action,
      },
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

  useKeyboard({ keydown, options: { useCapture: true } });

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
          Commands
        </Text>
        <Button icon onClick={() => setActionKey("create-action")}>
          <Plus />
        </Button>
      </Div>
      {Object.entries(actions)?.map(([key, item]) => (
        <Div
          css={`
            ${flex("space-between")}
            padding: 8px 16px;
            margin: 0 -16px;
            ${styles.hover}
            svg {
              margin-right: 16px;
              color: white;
              width: 32px;
            }
          `}
          onClick={() => setActionKey(key)}
        >
          {item?.type === "bm" ? (
            <Gear size={24} />
          ) : item?.type === "action" ? (
            <Monitor size={24} />
          ) : item?.type === "git" ? (
            <GitBranch size={24} />
          ) : (
            <Square size={24} />
          )}
          <Div
            css={`
              flex-grow: 1;
            `}
          >
            <Text>{item.name}</Text>
          </Div>
          <Text
            css={`
              color: ${colors.lightBlue};
              background-color: rgba(0, 0, 0, 0.2);
              padding: 4px 8px;
              border-radius: 16px;
            `}
          >
            {item.shortkey}
          </Text>
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
              disabled={action?.type !== "action"}
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
            <Input
              css={`
                width: 50%;
                ${focus ? `outline: 2px solid ${colors.lightBlue};` : ""}
              `}
              value={action?.shortkey || ""}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
            />
          </Div>
          {action?.type !== "action" ? (
            <Div
              css={`
                ${flex("right")}
                margin-top: 16px;
              `}
            >
              <Button secondary onClick={closeAction}>
                Close
              </Button>
            </Div>
          ) : (
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
                      list: [
                        ...(action.list || []),
                        { type: "execute-command" },
                      ],
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
                      margin: 4px 0;
                      padding: 16px;
                      background-color: rgba(0, 0, 0, 0.2);
                      border-radius: 8px;
                    `}
                  >
                    <Div
                      css={`
                        ${flex("space-between")}
                      `}
                    >
                      <Text bold>Action Type</Text>
                      <select
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
                      </select>
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
                    ) : null}
                  </Div>
                ))}
              </Div>
              <Div
                css={`
                  ${flex("right")}
                  margin-top: 16px;
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
          )}
        </Modal>
      ) : null}
    </>
  );
};

export const defaultActions = {
  "mode-finder": {
    name: "View Finder",
    type: "bm",
    shortkey: "meta+KeyF",
  },
  "mode-git": {
    name: "View Git",
    type: "bm",
    shortkey: "meta+KeyG",
  },
  "mode-settings": {
    name: "View Settings",
    type: "bm",
    shortkey: "meta+KeyS",
  },
  "create-bookmark": {
    name: "Create bookmark at current directory",
    type: "bm",
    shortkey: "meta+Equal",
  },
  "open-github": {
    name: "Open branch in github",
    type: "git",
    shortkey: "meta+KeyR",
  },
  "open-terminal": {
    name: "Open current directory in terminal",
    type: "action",
    shortkey: "meta+KeyT",
    list: [
      {
        type: "execute-command",
        payload: "open -a terminal .",
      },
    ],
  },
  "open-vscode": {
    name: "Open current directory in VS code",
    type: "action",
    shortkey: "meta+KeyS",
    list: [
      {
        type: "execute-command",
        payload: 'open -n -b "com.microsoft.VSCode" --args "$PWD"',
      },
    ],
  },
};
