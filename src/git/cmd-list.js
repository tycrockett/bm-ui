import { css } from "@emotion/css";
import { colors, Div, Text } from "../shared";
import { animation, flex, shadows } from "../shared/utils";
import { Info } from "phosphor-react";
import { Tooltip } from "../shared/Tooltip";

export const CmdList = ({
  list,
  index,
  cmd,
  setCmd,
  handleCmd,
  checkoutList,
}) => {
  return (
    <Div
      css={`
        box-sizing: border-box;
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        ${flex("start column")}
        ${!cmd || !list?.length
          ? `display: none; max-height: 0;`
          : `height: auto;`}
        border-radius: 16px;
        padding: 16px;
        width: 100%;
        transition: height 0.5s ease;
        background-color: ${colors.darkIndigo};
        z-index: 1000;
        ${shadows.md}
      `}
    >
      {cmd.startsWith("/") ? (
        <>
          <Div
            css={`
              padding-bottom: 8px;
              margin-bottom: 16px;
              width: calc(100% - 16px);
              ${flex("left")}
              background-color: rgba(255, 255, 255, 0.15);
              padding: 8px;
              border-radius: 8px;
              gap: 8px;
            `}
          >
            <Info color={colors.lightBlue} weight="bold" size={24} />
            <Text>Space to autocomplete the command.</Text>
          </Div>
          <Div
            css={`
              padding-bottom: 8px;
              margin-bottom: 16px;
              width: calc(100% - 16px);
              ${flex("left")}
              background-color: rgba(255, 255, 255, 0.15);
              padding: 8px;
              border-radius: 8px;
              gap: 8px;
            `}
          >
            <Info color={colors.lightBlue} weight="bold" size={24} />
            <Text>
              Tab to navigate or type out commands to read more about them.
            </Text>
          </Div>
        </>
      ) : null}
      <Div
        css={`
          width: 100%;
          ${flex("left wrap")}
          overflow-x: auto;
          flex-grow: 1;
        `}
      >
        {(list === 1 && cmd.startsWith("/")) || list?.length > 1
          ? list.map((item, idx) => (
              <Div
                css={`
                  min-width: max-content;
                  background-color: rgba(0, 0, 0, 0.2);
                  padding: 4px 8px;
                  border-radius: 16px;
                  margin-right: 8px;
                  margin-bottom: 8px;
                  cursor: pointer;
                  border: 2px solid transparent;
                  transition: background-color 0.2s ease;
                  :hover {
                    background-color: ${colors.green};
                  }
                  ${idx === index && !!cmd
                    ? `
                      padding: 4px 8px;
                      background-color: ${colors.green};
                    `
                    : ""}
                `}
                onClick={() => setCmd(item.command)}
              >
                <Text>{item.name}</Text>
              </Div>
            ))
          : null}
        {list?.length === 1 || (list?.length > 1 && cmd.startsWith("/")) ? (
          <Div
            css={`
              width: 100%;
              ${list?.length > 1 && cmd.startsWith("/")
                ? `padding-top: 16px; border-top: 1px solid ${colors.green};`
                : ""}
            `}
          >
            <Div
              css={`
                ${flex("space-between")}
              `}
            >
              <Div
                css={`
                  ${flex("left")}
                `}
              >
                <Text
                  bold
                  css={`
                    padding: 4px 8px;
                    border-radius: 16px;
                    background-color: ${colors.green};
                    margin-right: 16px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    :hover {
                      transition: background-color 0.2s ease, border 0.2s ease;
                      background-color: ${colors.green};
                      border: 1px solid ${colors.green};
                    }
                  `}
                  onClick={handleCmd}
                >
                  {list[index]?.name}
                </Text>
                <Text bold>{list[0]?.args}</Text>
                <Text
                  h4
                  css={`
                    margin-left: 16px;
                  `}
                >
                  {list[index]?.flags}
                </Text>
              </Div>
              <Tooltip label="Typed Command">
                <Text
                  bold
                  css={`
                    padding: 4px 8px;
                    border-radius: 30px;
                    background-color: white;
                    color: ${colors.darkIndigo};
                    margin-right: 32px;
                    cursor: default;
                  `}
                >
                  {list[index]?.command}
                </Text>
              </Tooltip>
            </Div>
            {cmd.startsWith("/") ? (
              <Text
                css={`
                  margin: 16px;
                `}
              >
                <pre
                  className={css`
                    word-break: break-word;
                    white-space: pre-wrap;
                    color: white;
                  `}
                >
                  {list[index]?.description}
                </pre>
              </Text>
            ) : null}
            {list[index]?.command === "checkout" ||
            list[index]?.command === "parent" ? (
              <Div
                css={`
                  ${flex("left wrap")}
                  margin-top: 16px;
                `}
              >
                {checkoutList?.map((item, idx) => (
                  <Text
                    css={`
                      ${animation("fadeIn", ".2s ease")}
                      padding: 4px 8px;
                      margin-bottom: 8px;
                      border: 1px solid transparent;
                      transition: background-color 0.2s ease;
                      ${idx === 0
                        ? `background-color: ${colors.green}; border: 1px solid ${colors.green}; font-weight: bold;`
                        : `background-color: ${colors.darkIndigo};`}
                      border-radius: 30px;
                      margin-right: 8px;
                      cursor: pointer;
                      :hover {
                        background-color: ${colors.green};
                      }
                    `}
                    onClick={() => setCmd(`${list[index]?.command} ${item}`)}
                  >
                    {item}
                  </Text>
                ))}
              </Div>
            ) : null}
          </Div>
        ) : null}
      </Div>
    </Div>
  );
};
