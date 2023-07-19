import { useCallback } from "react";
import { useAsyncValue } from "../hooks/use-async-value";
import { colors, Div, Text } from "../shared";
import { animation, flex } from "../shared/utils";
import { logCommits } from "./utils";

export const Logs = ({ parentBranch, lastCommand, pwd }) => {
  const getLogs = useCallback(
    () => logCommits(parentBranch),
    [parentBranch, pwd]
  );
  const [logs] = useAsyncValue(getLogs, [lastCommand, parentBranch, pwd]);

  return (
    <Div
      css={`
        ${animation("fadeIn", ".2s ease")}
        margin-bottom: 32px;
      `}
    >
      <Text
        h3
        bold
        css={`
          margin-bottom: 8px;
        `}
      >
        Commits
      </Text>
      {Object.entries(logs || {})?.map(([key, item]) => (
        <Div
          css={`
            ${flex("space-between")}
            padding: 4px 16px;
            margin: 0 -16px;
            border-radius: 8px;
            transition: background-color 0.2s ease;
            cursor: pointer;
            :hover {
              background-color: rgba(0, 0, 0, 0.2);
            }
          `}
        >
          <Text bold>{key}</Text>
          <Text
            bold
            css={`
              ${flex("center")}
              border-radius: 50%;
              background-color: ${colors.lightIndigo};
              width: 32px;
              height: 32px;
            `}
          >
            {item?.length}
          </Text>
        </Div>
      ))}
    </Div>
  );
};
