import { Button, colors, Div, Text } from "../shared";
import { animation, flex, shadows, styles } from "../shared/utils";
import {
  FileX,
  PlusCircle,
  FileDotted,
  FileArrowUp,
  MinusCircle,
  GitPullRequest,
} from "phosphor-react";
import { toast } from "react-toastify";
import { useAnimation } from "../hooks/use-animation";
import { format } from "date-fns";
import { useAsyncValue } from "../hooks/use-async-value";
import { cmd } from "../node/node-exports";

export const Status = ({
  status,
  currentBranch,
  parentBranch,
  completeMerge,
}) => {
  const shortStatus = useAsyncValue(
    async () =>
      await cmd(
        `git diff ${parentBranch}...${currentBranch || ""} --stat | tail -n1 `
      ),
    [status?.lastUpdate]
  );
  const hasStatus =
    !!status?.modified?.length ||
    !!status?.deleted?.length ||
    !!status?.untracked?.length;

  const { animation: shake } = useAnimation(
    { animation: animation("shake", ".4s ease"), timing: 500 },
    [status?.lastUpdate]
  );

  const copyItem = (value) => {
    try {
      navigator.clipboard.writeText(value);
    } catch (err) {
      console.log(err);
      toast.error(`Unable to copy that value`);
    }
  };

  // const files = useMemo(() => {
  //   const untracked = status?.untracked?.filter(
  //     (item) => Number(status?.fileCount?.[item]) > 0
  //   );
  //   const deleted = status?.deleted?.filter(
  //     (item) =>
  //       Number(status?.files?.[item]?.deletes) > 0 ||
  //       Number(status?.files?.[item]?.adds) > 0
  //   );
  //   const modified = status?.modified?.filter(
  //     (item) =>
  //       Number(status?.files?.[item]?.deletes) > 0 ||
  //       Number(status?.files?.[item]?.adds) > 0
  //   );

  //   return [untracked, deleted, modified].reduce((prev, item) => {
  //     const split = item.split("/");
  //     split.reduce((acc, val) => {}, prev);
  //   }, []);
  // });

  const untracked = status?.untracked?.filter(
    (item) => Number(status?.fileCount?.[item]) > 0
  );
  const deleted = status?.deleted?.filter(
    (item) =>
      Number(status?.files?.[item]?.deletes) > 0 ||
      Number(status?.files?.[item]?.adds) > 0
  );
  const modified = status?.modified?.filter(
    (item) =>
      Number(status?.files?.[item]?.deletes) > 0 ||
      Number(status?.files?.[item]?.adds) > 0
  );

  const unmergedChanges =
    hasStatus && !untracked?.length && !deleted?.length && !modified?.length;

  return (
    <Div
      css={`
        margin-bottom: 32px;
        flex-grow: 1;
        height: 100%;
        width: 100%;
        box-sizing: border-box;
        overflow-y: auto;
        ${styles.scrollbar}
      `}
    >
      {hasStatus ? (
        <>
          <Div
            css={`
              ${flex("space-between")}
            `}
          >
            <Div
              css={`
                ${flex("left")}
                margin-bottom: 8px;
                p {
                  margin-left: 16px;
                }
                svg {
                  ${hasStatus ? shake : ""}
                }
              `}
            >
              <GitPullRequest size={24} color="white" weight="fill" />
              <Text bold css={``}>
                Status
              </Text>
            </Div>
            <Text
              h4
              bold
              css={`
                margin-bottom: 8px;
              `}
            >
              {status?.lastUpdate
                ? format(new Date(status?.lastUpdate), "h:mm a")
                : ""}
            </Text>
          </Div>
          <Text
            css={`
              margin-bottom: 16px;
            `}
          >
            {shortStatus}
          </Text>
          {unmergedChanges ? (
            <Div
              css={`
                ${flex("space-between")}
                padding: 32px;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 16px;
                button {
                  margin-left: 8px;
                  min-width: max-content;
                }
              `}
            >
              <Text bold>There are uncommitted changes.</Text>
              <Button onClick={completeMerge}>Complete Merge</Button>
            </Div>
          ) : null}
          {untracked?.map((item) => (
            <Div
              css={`
                ${flex("space-between")}
                padding: 2px 0;
              `}
            >
              <Div
                css={`
                  ${flex("left")}
                  flex-grow: 1;
                  width: 100%;
                  overflow: hidden;
                  p {
                    width: 100%;
                  }
                  svg {
                    margin-right: 16px;
                  }
                `}
                onClick={() => copyItem(item)}
              >
                <FileDotted size={24} color={colors.lightBlue} weight="fill" />
                <Text left-ellipsis>{item}</Text>
              </Div>
              <Div
                css={`
                  ${flex("right")}
                  p {
                    margin-right: 4px;
                  }
                `}
              >
                <Div
                  css={`
                    width: 100px;
                    ${flex("right")}
                    padding: 0 8px;
                    border-radius: 30px;
                    ${shadows.lg}
                    margin: 0 8px;
                    font-weight: bold;
                  `}
                >
                  <Text>{status?.fileCount?.[item]}</Text>
                  <PlusCircle size={16} color={colors.green} weight="fill" />
                </Div>
              </Div>
            </Div>
          ))}

          {deleted?.map((item) => {
            const netChange =
              status?.files?.[item]?.adds - status?.files?.[item]?.deletes;
            return (
              <Div
                css={`
                  ${flex("space-between")}
                  padding: 2px 0;
                `}
              >
                <Div
                  css={`
                    ${flex("left")}
                    flex-grow: 1;
                    width: 100%;
                    overflow: hidden;
                    p {
                      width: 100%;
                    }
                    svg {
                      margin-right: 16px;
                    }
                  `}
                >
                  <Button
                    icon
                    small
                    onClick={() => copyItem(item)}
                    css={`
                      margin: 0;
                      padding: 0;
                    `}
                  >
                    <FileX size={24} color={colors.red} weight="fill" />
                  </Button>
                  <Text left-ellipsis>{item}</Text>
                </Div>
                <Div
                  css={`
                    ${flex("right")}
                    p {
                      margin-right: 4px;
                    }
                  `}
                >
                  <Div
                    css={`
                      min-width: 50px;
                      ${flex("left")}
                      padding: 0 8px;
                      border-radius: 30px;
                      ${shadows.lg}
                      margin: 0 8px;
                      font-weight: bold;
                      svg {
                        margin-right: 8px;
                      }
                    `}
                  >
                    {netChange >= 0 ? (
                      <PlusCircle
                        size={16}
                        color={colors.green}
                        weight="fill"
                      />
                    ) : (
                      <MinusCircle size={16} color={colors.red} weight="fill" />
                    )}
                    <Text>{Math.abs(netChange)}</Text>
                  </Div>
                </Div>
              </Div>
            );
          })}

          {modified?.map((item) => {
            const netChange =
              status?.files?.[item]?.adds - status?.files?.[item]?.deletes;
            return (
              <Div
                css={`
                  ${flex("space-between")}
                  padding: 2px 0;
                `}
              >
                <Div
                  css={`
                    ${flex("left")}
                    flex-grow: 1;
                    width: 100%;
                    overflow: hidden;
                    p {
                      width: 100%;
                    }
                    svg {
                      margin-right: 16px;
                    }
                  `}
                >
                  <FileArrowUp size={24} color={colors.green} weight="fill" />
                  <Text left-ellipsis>{item}</Text>
                </Div>
                <Div
                  css={`
                    ${flex("right")}
                    svg {
                      margin-left: 8px;
                    }
                  `}
                >
                  <Div
                    css={`
                      min-width: 50px;
                      ${flex("left")}
                      padding: 0 8px;
                      border-radius: 30px;
                      ${shadows.lg}
                      margin: 0 8px;
                      font-weight: bold;
                      svg {
                        margin-right: 8px;
                      }
                    `}
                  >
                    {netChange >= 0 ? (
                      <PlusCircle
                        size={16}
                        color={colors.green}
                        weight="fill"
                      />
                    ) : (
                      <MinusCircle size={16} color={colors.red} weight="fill" />
                    )}
                    <Text>{Math.abs(netChange)}</Text>
                  </Div>
                </Div>
              </Div>
            );
          })}
        </>
      ) : (
        <Div
          css={`
            ${flex("space-between")}
          `}
        >
          <Text bold>No changes detected.</Text>
          <Text bold>
            {status?.lastUpdate
              ? format(new Date(status?.lastUpdate), "h:mm a")
              : ""}
          </Text>
        </Div>
      )}
    </Div>
  );
};
