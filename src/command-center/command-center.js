import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { cmd } from "../node/node-exports";
import { Button, colors, Div, Input, Modal, Text } from "../shared";
import { flex } from "../shared/utils";

export const CommandCenter = () => {
  const [command, setCommand] = useState(null);
  const [prompts, setPrompts] = useState([]);

  useEffect(() => {
    setPrompts(command?.prompts);
  }, [command?.id]);

  const runCommand = () => {
    command.fn({ prompts });
    setCommand(null);
  };

  return (
    <Div
      css={`
        padding: 16px;
      `}
    >
      <Text h2>Command Center</Text>
      <Input
        placeholder="Search"
        css={`
          margin: 8px 0;
          width: calc(100% - 16px);
        `}
      />

      <Div
        css={`
          margin-top: 16px;
          ${flex("left wrap")}
        `}
      >
        {commands?.map((cmd) => (
          <Div
            css={`
              box-sizing: border-box;
              width: 200px;
              border-radius: 16px;
              background-color: ${colors.darkIndigo};
              padding: 16px;
              :hover {
                background-color: ${colors.lightIndigo};
                transition: background-color 0.2s ease;
                cursor: pointer;
              }
            `}
            onClick={() => setCommand(cmd)}
          >
            <Text h3 bold>
              {cmd?.name}
            </Text>
          </Div>
        ))}
      </Div>

      {command !== null ? (
        <Modal
          css={`
            width: 400px;
            background-color: white;
            padding: 32px;
          `}
        >
          <Div
            css={`
              ${flex("space-between")}
              margin-bottom: 24px;
            `}
          >
            <Text h2>{command?.name}</Text>
          </Div>
          {!!prompts?.length
            ? prompts.map((item, idx) => (
                <Div
                  css={`
                    ${flex("space-between")}
                    margin: 8px 0;
                  `}
                >
                  <Text>{item?.label}</Text>
                  <Input
                    css={`
                      width: 50%;
                    `}
                    value={item?.value}
                    onChange={(e) =>
                      setPrompts((p) => {
                        let prompt = [...p];
                        prompt.splice(idx, 1, {
                          ...item,
                          value: e.target.value,
                        });
                        return prompt;
                      })
                    }
                  />
                </Div>
              ))
            : null}
          <Div
            css={`
              ${flex("right")}
              margin-top: 24px;
            `}
          >
            <Button
              secondary
              css={`
                margin-right: 16px;
              `}
              onClick={() => setCommand(null)}
            >
              Cancel
            </Button>
            <Button onClick={runCommand}>OK</Button>
          </Div>
        </Modal>
      ) : null}
    </Div>
  );
};

const commands = [
  {
    id: "open-local-build",
    name: "Open Local Build",
    description: "",
    prompts: [{ label: "Local Hostname", value: "http://localhost:3000" }],
    fn: async ({ prompts }) => {
      const [localHostname] = prompts;
      const text = await navigator.clipboard.readText();
      try {
        const url = new URL(text);
        const nextUrl = `${localHostname?.value}${url?.pathname}`;
        await cmd(`open "${nextUrl}"`);
      } catch (err) {
        console.warn(err);
        toast.error(`Error getting local link`);
      }
    },
  },
];
