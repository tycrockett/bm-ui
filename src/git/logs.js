import { useCallback } from "react";
import { useAsyncValue } from "../hooks/use-async-value";
import { Div, Text } from "../shared";
import { animation } from "../shared/utils";
import { logCommits } from "./utils";

export const Logs = ({ parentBranch, lastCommand }) => {
  const getLogs = useCallback(() => logCommits(parentBranch), [parentBranch]);
  const [logs] = useAsyncValue(getLogs, [lastCommand, parentBranch]);
  console.log(logs);
  return (
    <Div
      css={`
        ${animation("fadeIn", ".2s ease")}
      `}
    >
      <Text h3 bold>
        Commits
      </Text>
    </Div>
  );
};
