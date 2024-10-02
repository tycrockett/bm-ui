import { css } from "@emotion/css";
import { format } from "date-fns";
import { CopySimple, GitCommit, Trash } from "phosphor-react";
import { useCallback, useContext, useState } from "react";
import { toast } from "react-toastify";
import { useAsyncValue } from "../hooks/use-async-value";
import { Button, colors, Div, Text } from "../shared";
import { animation, flex, styles } from "../shared/utils";
import { logCommits } from "./utils";
import { cmd } from "../node/node-exports";
import { StoreContext } from "../context/store";

export const Logs = ({
  currentBranch,
  parentBranch,
  repo,
  lastCommand,
  pwd,
}) => {
  const context = useContext(StoreContext);
  const { store } = context;

  const getLogs = useCallback(
    () => logCommits(parentBranch),
    [parentBranch, pwd]
  );
  const [logs] = useAsyncValue(getLogs, [
    lastCommand,
    parentBranch,
    pwd,
    store?.mode,
  ]);
  const commits = Object.entries(logs || {});

  const [hash, setHash] = useState("all");

  const deleteFile = (file) => {
    try {
      cmd(`git checkout ${parentBranch} -- ${file}`);
    } catch {
      toast.error("Failed to delete file.");
    }
  };

  const copyFile = (file) => {
    try {
      navigator.clipboard.writeText(file);
    } catch {
      toast.error("Failed to copy file.");
    }
  };

  if (currentBranch === repo?.defaultBranch) {
    return null;
  }
  const metaBranch = repo?.branches?.[currentBranch];

  return (
    <Div
      css={`
        ${animation("fadeIn", ".2s ease")}
        transition: height 0.5s ease;
        background: ${colors.indigoGradient};
        padding: 16px 0;
        border-radius: 8px;
        box-sizing: border-box;
        width: 100%;
      `}
    >
      <Div
        css={`
          ${flex("space-between")}
          padding: 0 16px;
        `}
      >
        <Div
          css={`
            ${flex("left")}
            p {
              margin-left: 8px;
            }
          `}
        >
          <GitCommit size={16} color="white" weight="bold" />
          <Text bold>
            Commits{" "}
            {commits?.length ? (
              <span
                className={css`
                  margin-left: 8px;
                  border-radius: 30px;
                  padding: 2px 10px;
                  background-color: ${colors.lightIndigo};
                `}
              >
                {commits?.length}
              </span>
            ) : (
              ""
            )}
          </Text>
        </Div>
        <Div
          css={`
            text-align: right;
          `}
        >
          <Text bold>{metaBranch?.parentBranch}</Text>
        </Div>
      </Div>
      <Div
        css={`
          ${flex("space-between")}
          padding: 4px 16px;
        `}
      >
        <Text
          css={`
            cursor: pointer;
            :hover {
              text-decoration: underline;
            }
          `}
          onClick={() => setHash(hash ? "" : "all")}
        >
          Expand Files
        </Text>

        {metaBranch?.createdAt ? (
          <Text>
            {format(new Date(metaBranch?.createdAt), "MMM d | h:mm a")}
          </Text>
        ) : null}
      </Div>
      <Div
        css={`
          max-height: 40vh;
          overflow-y: auto;
          overflow-x: hidden;
          ${styles.scrollbar}
        `}
      >
        {commits?.map(([key, item]) => (
          <Div>
            <Div
              css={`
                ${animation("fadeIn", ".2s ease")}
                ${flex("space-between")}
                padding: 4px 16px;
                margin-top: 8px;
                border-radius: 8px;
                transition: background-color 0.2s ease;
                cursor: pointer;
                :hover {
                  background-color: rgba(0, 0, 0, 0.2);
                }
              `}
            >
              <Text bold ellipsis>
                {key}
              </Text>
              <Text
                bold
                css={`
                  ${flex("center")}
                  border-radius: 30px;
                  padding: 4px 8px;
                  background-color: ${colors.lightIndigo};
                  min-width: max-content;
                `}
              >
                {item?.length} File{item?.length !== 1 ? "s" : ""}
              </Text>
            </Div>
            {hash === key || hash === "all"
              ? logs[key]?.map((file) =>
                  file ? (
                    <Div
                      css={css`
                        padding: 8px 16px;
                        height: 24px;
                        padding-left: 32px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        :hover {
                          background-color: rgba(0, 0, 0, 0.5);
                        }
                        :not(:hover) {
                          .actions {
                            display: none;
                          }
                        }
                      `}
                    >
                      <Text>{file}</Text>
                      <Div
                        className="actions"
                        css={css`
                          display: flex;
                          justify-content: right;
                          align-items: center;
                        `}
                      >
                        <Button icon sm onClick={() => deleteFile(file)}>
                          <Trash />
                        </Button>
                        <Button icon sm onClick={() => copyFile(file)}>
                          <CopySimple />
                        </Button>
                      </Div>
                    </Div>
                  ) : null
                )
              : null}
          </Div>
        ))}
      </Div>
    </Div>
  );
};
