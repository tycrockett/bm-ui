import { css } from "@emotion/css";
import { colors, Div, Text } from "../shared";
import { animation, flex, shadows } from "../shared/utils";

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
      <Div
        css={`
          width: 100%;
          ${flex("left wrap")}
          overflow-x: auto;
          flex-grow: 1;
        `}
      >
        {list?.length > 1 ? (
          list.map((item, idx) => (
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
                  background-color: ${colors.lightIndigo};
                }
                ${idx === index && !!cmd
                  ? `
                      padding: 4px 8px;
                      background-color: ${colors.lightIndigo};
                    `
                  : ""}
              `}
              onClick={() => setCmd(item.command)}
            >
              <Text>{item.name}</Text>
            </Div>
          ))
        ) : (
          <Div
            css={`
              width: 100%;
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
                    background-color: ${colors.lightIndigo};
                    margin-right: 16px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    :hover {
                      transition: background-color 0.2s ease, border 0.2s ease;
                      background-color: ${colors.lightIndigo};
                      border: 1px solid ${colors.lightIndigo};
                    }
                  `}
                  onClick={handleCmd}
                >
                  {list[0]?.name}
                </Text>
                <Text bold>{list[0]?.args}</Text>
                <Text
                  h4
                  css={`
                    margin-left: 16px;
                  `}
                >
                  {list[0]?.flags}
                </Text>
              </Div>
              <Text
                bold
                css={`
                  padding: 4px 8px;
                  border-radius: 30px;
                  background-color: white;
                  color: ${colors.darkIndigo};
                  margin-right: 32px;
                `}
              >
                {list[0]?.command}
              </Text>
            </Div>
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
                {list[0]?.description}
              </pre>
            </Text>
            {list[0]?.command === "checkout" ||
            list[0]?.command === "parent" ? (
              <Div
                css={`
                  ${flex("left wrap")}
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
                        ? `background-color: ${colors.lightIndigo}; border: 1px solid ${colors.lightIndigo}; font-weight: bold;`
                        : `background-color: ${colors.darkIndigo};`}
                      border-radius: 30px;
                      margin-right: 8px;
                      cursor: pointer;
                      :hover {
                        background-color: ${colors.lightIndigo};
                      }
                    `}
                    onClick={() => setCmd(`${list[0]?.command} ${item}`)}
                  >
                    {item}
                  </Text>
                ))}
              </Div>
            ) : null}
          </Div>
        )}
      </Div>
    </Div>
  );
};
