import { Button, colors, Div, Text } from "../shared";
import { animation, flex, styles } from "../shared/utils";
import {
  FileX,
  PlusCircle,
  FileArrowUp,
  MinusCircle,
  GitPullRequest,
  Folder,
  Question,
  FilePlus,
  Tree,
} from "phosphor-react";
import { toast } from "react-toastify";
import { useAnimation } from "../hooks/use-animation";
import { format } from "date-fns";
import { useAsyncValue } from "../hooks/use-async-value";
import { cmd } from "../node/node-exports";
import { useEffect, useMemo, useState } from "react";
import { Collapse } from "../shared/Collapse";
import { Tooltip } from "../shared/Tooltip";
import { scrollbar } from "../shared/styles";

const dedupe = (arr) => [...new Set(arr)];

function nestFiles(filePaths) {
  const result = {};
  filePaths.forEach((data) => {
    const parts = data.pathname.split("/"); // Split the path into parts by '/'
    let current = result;
    const pathname = parts.slice(0, -1).join("/");
    current[pathname] = [
      ...(current[pathname] || []),
      {
        ...data,
        filename: parts.at(-1),
      },
    ];
  });

  return result;
}

export const Status = ({
  settings,
  repo,
  status,
  currentBranch,
  parentBranch,
  completeMerge,
}) => {
  const [refreshedAt, setRefreshedAt] = useState(null);
  const refresh = () => setRefreshedAt(new Date()?.toISOString());

  useEffect(() => {
    refresh();
  }, [status?.lastUpdate]);

  const shortStatus = useAsyncValue(
    async () => await cmd(`git diff --shortstat`),
    [refreshedAt]
  );

  const hasStatus =
    !!status?.modified?.length ||
    !!status?.deleted?.length ||
    !!status?.untracked?.length;

  const { animation: shake } = useAnimation(
    { animation: animation("shake", ".4s ease"), timing: 500 },
    [refreshedAt]
  );

  const copyItem = (value) => {
    try {
      navigator.clipboard.writeText(value);
    } catch (err) {
      console.log(err);
      toast.error(`Unable to copy that value`);
    }
  };

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

  const fileStatus = useMemo(() => {
    const untracked =
      status?.untracked
        ?.filter((item) => Number(status?.fileCount?.[item]) > 0)
        ?.map((pathname) => ({
          pathname,
          type: "untracked",
          adds: status.files[pathname]?.adds || 0,
          deletes: status.files[pathname]?.deletes || 0,
        })) || [];

    const deleted =
      status?.deleted
        ?.filter(
          (item) =>
            Number(status?.files?.[item]?.deletes) > 0 ||
            Number(status?.files?.[item]?.adds) > 0
        )
        ?.map((pathname) => ({
          pathname,
          type: "deleted",
          adds: status.files[pathname]?.adds || 0,
          deletes: status.files[pathname]?.deletes || 0,
        })) || [];

    const modified =
      status?.modified
        ?.filter(
          (item) =>
            Number(status?.files?.[item]?.deletes) > 0 ||
            Number(status?.files?.[item]?.adds) > 0
        )
        ?.map((pathname) => ({
          pathname,
          type: "modified",
          adds: status.files[pathname]?.adds || 0,
          deletes: status.files[pathname]?.deletes || 0,
        })) || [];

    const files = [...untracked, ...deleted, ...modified];

    const nested = nestFiles(files);
    const keys = Object.entries(nested).map(([pathname, files]) => {
      let list = [];
      const filteredFiles = files.filter((file) => {
        if (list.includes(file.filename)) {
          return false;
        } else {
          list.push(file.filename);
          return true;
        }
      });
      return [pathname, filteredFiles];
    });
    return keys;
  });

  const unmergedChanges =
    hasStatus && !untracked?.length && !deleted?.length && !modified?.length;

  const openFile = (file) => {
    const path = settings?.pwd?.replace("~", settings?.base);
    const command = `open -n -b "com.microsoft.VSCode" --args -g "${path}/${file}"`;
    cmd(command);
  };

  return (
    <Collapse
      isOpen={false}
      css={`
        flex-grow: 1;
        flex-shrink: 1;
        margin-bottom: 16px;
        width: 100%;
        box-sizing: border-box;
        ${styles.scrollbar}
      `}
    >
      <Div
        css={`
          overflow-y: auto;
          min-height: 50%;
          height: 100%;
          ${scrollbar.style}
        `}
      >
        {hasStatus ? (
          <Div
            css={`
              border-radius: 8px;
              background-color: ${colors.darkIndigo};
              padding: 16px;
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
                  margin-bottom: 8px;
                  p {
                    margin-left: 16px;
                  }
                  svg {
                    ${hasStatus ? shake : ""}
                  }
                `}
              >
                <GitPullRequest
                  size={24}
                  color={colors.lightBlue}
                  weight="fill"
                />
                <Text bold>Status</Text>
              </Div>
              <Text
                h4
                bold
                css={`
                  margin-bottom: 8px;
                  color: ${colors.light};
                `}
              >
                {refreshedAt ? format(new Date(refreshedAt), "h:mm a") : ""}
              </Text>
            </Div>
            <Text
              css={`
                margin-bottom: 16px;
              `}
            >
              {shortStatus}
            </Text>

            {fileStatus?.map(([pathname, files]) => (
              <Div
                css={`
                  margin-bottom: 16px;
                  position: relative;
                `}
              >
                <Div
                  css={`
                    ${flex("left")} svg {
                      margin-right: 8px;
                    }
                    margin-bottom: 8px;
                    cursor: default;
                    :not(:hover) {
                      .full {
                        display: none;
                      }
                    }
                    :hover {
                      background-color: rgba(0, 0, 0, 0.3);
                      cursor: pointer;
                      .short {
                        display: none;
                      }
                    }
                  `}
                  onClick={() => navigator.clipboard.writeText(pathname)}
                >
                  <Folder size={24} color="#fbfbbc" weight="fill" />

                  <Text bold className="short">
                    .../{pathname.split("/").at(-1)}
                  </Text>
                  <Text bold className="full">
                    {pathname}
                  </Text>
                </Div>
                <Div
                  css={`
                    padding: 0;
                    padding-left: 8px;
                    margin-left: 12px;
                    border-left: 2px solid ${colors.light};
                  `}
                >
                  {files?.map((file) => {
                    return (
                      <Div
                        css={`
                          ${flex("space-between")}
                          border-radius: 8px;
                          padding: 2px 4px;
                          :hover {
                            background-color: rgba(0, 0, 0, 0.5);
                            cursor: pointer;
                          }
                        `}
                        key={file.filename}
                        onClick={() => openFile(file.pathname)}
                      >
                        <Div
                          css={`
                            ${flex("left")}
                            svg {
                              margin-right: 8px;
                            }
                          `}
                        >
                          {file.type === "untracked" ? (
                            <FilePlus
                              size={24}
                              color={colors.lightBlue}
                              weight="fill"
                            />
                          ) : file.type === "deleted" ? (
                            <FileX size={24} color={colors.red} weight="fill" />
                          ) : file.type === "modified" ? (
                            <FileArrowUp
                              size={24}
                              color={colors.green}
                              weight="fill"
                            />
                          ) : (
                            <Question
                              size={24}
                              color={colors.lightBlue}
                              weight="fill"
                            />
                          )}
                          <Text>{file.filename}</Text>
                        </Div>
                        <Div
                          css={`
                            ${flex("right")}
                            svg {
                              margin-left: 8px;
                            }
                            p {
                              text-align: right;
                              min-width: 50px;
                              font-weight: bold;
                            }
                          `}
                        >
                          {file.type === "untracked" ? null : (
                            <>
                              {file.adds >= 0 ? (
                                <>
                                  <Text>{file.adds}</Text>
                                  <PlusCircle
                                    size={24}
                                    color={colors.green}
                                    weight="fill"
                                  />
                                </>
                              ) : null}
                              {file.deletes ? (
                                <>
                                  <Text>{file.deletes}</Text>
                                  <MinusCircle
                                    size={24}
                                    color={colors.red}
                                    weight="fill"
                                  />
                                </>
                              ) : null}
                            </>
                          )}
                        </Div>
                      </Div>
                    );
                  })}
                </Div>
              </Div>
            ))}
          </Div>
        ) : (
          <Div
            css={`
              margin: 8px 0;
            `}
          >
            <Div
              css={`
                ${flex("left start")}
                margin: auto;
                width: 100%;
                height: 150px;
                border-radius: 16px;
                background-color: ${colors.darkIndigo};
                padding: 32px;
                box-sizing: border-box;
                user-select: none;
                :hover {
                  cursor: default;
                }
                svg {
                  ${shake}
                }
              `}
            >
              <Tree size={80} color={colors.green} />
              <Div
                css={`
                  flex-grow: 1;
                  margin: 16px;
                `}
              >
                <Text
                  css={`
                    border-radius: 8px;
                    font-weight: bold;
                  `}
                >
                  On branch {currentBranch}
                </Text>
                <Text>nothing to commit, working tree clean.</Text>
                {repo?.defaultBranch === currentBranch ? (
                  <Text
                    css={`
                      color: ${colors.lightBlue};
                      padding-top: 8px;
                    `}
                  >
                    <strong>{currentBranch}</strong> is set as the{" "}
                    <strong>default branch</strong>
                  </Text>
                ) : (
                  <Text
                    css={`
                      color: ${colors.lightBlue};
                      padding-top: 8px;
                    `}
                  >
                    <strong>{parentBranch}</strong> is set as the{" "}
                    <strong>parent branch</strong>
                  </Text>
                )}
              </Div>
              <Text
                bold
                css={`
                  color: ${colors.light};
                  margin: 16px 0;
                `}
              >
                {refreshedAt ? format(new Date(refreshedAt), "h:mm.ss a") : ""}
              </Text>

              {/* <Button onClick={refresh}>Refresh</Button> */}
            </Div>
          </Div>
        )}
      </Div>
    </Collapse>
  );
};
