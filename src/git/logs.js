import { format } from "date-fns";
import { CurrencyNgn, GitCommit } from "phosphor-react";
import { useCallback } from "react";
import { useAsyncValue } from "../hooks/use-async-value";
import { colors, Div, Text } from "../shared";
import { animation, flex } from "../shared/utils";
import { logCommits } from "./utils";

export const Logs = ({
  currentBranch,
  parentBranch,
  repo,
  lastCommand,
  pwd,
}) => {
  const getLogs = useCallback(
    () => logCommits(parentBranch),
    [parentBranch, pwd]
  );
  const [logs] = useAsyncValue(getLogs, [lastCommand, parentBranch, pwd]);
  const commits = Object.entries(logs || {});

  if (currentBranch === repo?.defaultBranch) {
    return null;
  }
  const metaBranch = repo?.branches?.[currentBranch];
  console.log(metaBranch);
  return (
    <Div
      css={`
        ${animation("fadeIn", ".2s ease")}
        transition: height .5s ease;
        background-color: rgba(0, 0, 0, 0.2);
        padding: 16px;
        border-radius: 8px;
        box-sizing: border-box;
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
            p {
              margin-left: 16px;
            }
          `}
        >
          <GitCommit size={32} color="white" weight="bold" />
          <Text h3 bold>
            Commits
          </Text>
        </Div>
        <Div
          css={`
            text-align: right;
          `}
        >
          <Text h3>{metaBranch?.parentBranch}</Text>
          {metaBranch?.createdAt ? (
            <Text>
              {format(new Date(metaBranch?.createdAt), "MMM d | h:mm a")}
            </Text>
          ) : null}
        </Div>
      </Div>
      {commits?.map(([key, item]) => (
        <Div
          css={`
            ${animation("fadeIn", ".2s ease")}
            ${flex("space-between")}
            padding: 4px 16px;
            margin: 0 -16px;
            margin-top: 8px;
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
              border-radius: 30px;
              padding: 4px 8px;
              background-color: ${colors.lightIndigo};
            `}
          >
            {item?.length} File{item?.length !== 1 ? "s" : ""}
          </Text>
        </Div>
      ))}
    </Div>
  );
};
