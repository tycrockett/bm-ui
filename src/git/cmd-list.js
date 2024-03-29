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
        ${flex("start column")}
        border-radius: 16px;
        padding: 16px;
        width: 100%;
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
                      font-weight: bold;
                      padding: 8px 16px;
                      border: 2px solid ${colors.lightBlue};
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
                  h3
                  bold
                  css={`
                    padding: 4px 16px;
                    border-radius: 16px;
                    border: 1px solid ${colors.darkIndigo};
                    margin-right: 16px;
                    cursor: pointer;
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
                <Text h4 bold>
                  {list[0]?.args}
                </Text>
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
                h3
                bold
                css={`
                  padding: 4px 16px;
                  border-radius: 16px;
                  ${shadows.lg}
                  background-color: ${colors.indigo};
                  color: white;
                  margin-right: 16px;
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
              {list[0]?.description}
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
                      padding: 8px 16px;
                      margin-bottom: 8px;
                      border: 2px solid transparent;
                      transition: background-color 0.2s ease;
                      ${idx === 0
                        ? `border: 2px solid ${colors.lightBlue}; font-weight: bold;`
                        : `background-color: ${colors.indigo};`}
                      ${shadows.md}
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
