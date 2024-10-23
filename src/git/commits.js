import { css } from "@emotion/css";
import { format } from "date-fns";
import {
  CaretDown,
  CaretUp,
  CopySimple,
  GitCommit,
  Trash,
} from "phosphor-react";
import { useCallback, useContext, useState } from "react";
import { toast } from "react-toastify";
import { useAsyncValue } from "../hooks/use-async-value";
import { Button, colors, Div, Text } from "../shared";
import { animation, flex, styles } from "../shared/utils";
import { logCommits } from "./utils";
import { cmd } from "../node/node-exports";
import { StoreContext } from "../context/store";
import { Collapse } from "../shared/Collapse";
import { Tooltip } from "../shared/Tooltip";

export const Commits = ({
  currentBranch,
  parentBranch,
  repo,
  lastCommand,
  pwd,
}) => {
  const context = useContext(StoreContext);
  const { store } = context;
  const getLogs = useCallback(
    () => logCommits(parentBranch, repo?.defaultBranch),
    [parentBranch, pwd, repo?.defaultBranch]
  );
  const [logs] = useAsyncValue(getLogs, [
    lastCommand,
    parentBranch,
    currentBranch,
    store?.mode,
    pwd,
  ]);

  const [parentToRemote] = useAsyncValue(async () => {
    const diff = await cmd(
      `git rev-list --left-right --count origin/${parentBranch}...${parentBranch}`
    );
    return diff.split("\t").map((item) => Number(item));
  }, [parentBranch, pwd]);

  const commits = Object.entries(logs || {});

  const [hash, setHash] = useState("");

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

  const metaBranch = repo?.branches?.[currentBranch];

  return (
    <Collapse
      isOpen={false}
      css={`
        ${animation("fadeIn", ".2s ease")}
        ${flex("column")}
        background: ${colors.indigoGradient};
        padding: 16px 0;
        border-radius: 8px;
        box-sizing: border-box;
        width: 100%;
        flex-grow: 1;
      `}
    >
      <Div
        css={`
          ${flex("space-between")}
          padding: 0 16px;
          padding-bottom: 16px;
          cursor: pointer;
        `}
        onClick={() => setHash(hash === "all" ? "" : "all")}
      >
        <Div
          css={`
            ${flex("left")}
            gap: 16px;
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
                  background-color: ${colors.green};
                `}
              >
                {commits?.length}
              </span>
            ) : (
              ""
            )}
          </Text>
          <Tooltip label="Collapse/Expand Files">
            {hash === "all" ? (
              <CaretUp color="#777" />
            ) : (
              <CaretDown color="#777" />
            )}
          </Tooltip>
        </Div>
        <Div
          css={`
            text-align: right;
            ${flex("right")}
            flex-grow: 1;
          `}
        >
          <Text
            css={`
              color: #777;
              font-size: 0.9em;
              margin-top: -2px;
              margin-right: 4px;
            `}
          >
            {parentToRemote?.[0] > 0
              ? `${parentToRemote?.[0]} commits behind origin `
              : `Up to date with origin `}
          </Text>
          <Text bold>{metaBranch?.parentBranch}</Text>
        </Div>
      </Div>

      <Div
        css={`
          flex-grow: 1;
          transition: height 0.5s ease;
          overflow-y: auto;
          overflow-x: hidden;
          ${styles.scrollbar}
          max-width: 100%;
        `}
      >
        {commits?.map(([key, item]) => (
          <Div>
            <Div
              css={`
                ${animation("fadeIn", ".2s ease")}
                ${flex("space-between")}
                border-top: 1px solid ${colors.dark};
                padding: 8px 16px;
                transition: background-color 0.2s ease;
                cursor: pointer;
                :hover {
                  background-color: rgba(0, 0, 0, 0.3);
                }
              `}
              onClick={() => setHash(hash === key ? "" : key)}
            >
              <Div
                css={`
                  ${flex("space-between")}
                  flex-grow: 1;
                  margin-right: 16px;
                `}
              >
                <Text
                  bold
                  css={`
                    flex-grow: 1;
                    overflow: hidden;
                    white-space: wrap;
                  `}
                >
                  {key.split(" ").slice(1).join(" ")}
                </Text>
                <Text
                  bold
                  css={`
                    min-width: max-content;
                  `}
                >
                  {key.split(" ")[0]}
                </Text>
              </Div>

              <Text
                bold
                css={`
                  ${flex("center")}
                  border-radius: 30px;
                  padding: 4px;
                  background-color: ${colors.green};
                  min-width: 100px;
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
                        padding-left: 64px;
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        cursor: default;
                        :hover {
                          background-color: rgba(0, 0, 0, 0.3);
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
    </Collapse>
  );
};
