import { Button, colors, Div, Text } from "../shared";
import { animation, flex, shadows, styles } from "../shared/utils";
import {
  FileX,
  PlusCircle,
  FileDotted,
  FileArrowUp,
  MinusCircle,
  GitPullRequest,
  Folder,
  Question,
  File,
  FilePlus,
} from "phosphor-react";
import { toast } from "react-toastify";
import { useAnimation } from "../hooks/use-animation";
import { format } from "date-fns";
import { useAsyncValue } from "../hooks/use-async-value";
import { cmd } from "../node/node-exports";
import { useMemo } from "react";
import { css } from "@emotion/css";

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

  // });

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
    <Div
      css={`
        flex-grow: 4;
        flex-shrink: 1;
        margin-bottom: 16px;
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
              margin-bottom: 32px;
            `}
          >
            {shortStatus}
          </Text>

          {fileStatus?.map(([pathname, files]) => (
            <Div
              css={`
                margin-bottom: 16px;
              `}
            >
              <Div
                css={`
                  ${flex("left")} svg {
                    margin-right: 8px;
                  }
                  margin-bottom: 8px;
                `}
              >
                <Folder size={24} color="white" weight="fill" />
                <Text bold>{pathname}</Text>
              </Div>
              <Div
                css={`
                  padding: 8px;
                  padding-left: 16px;
                  margin-left: 12px;
                  border-left: 2px solid ${colors.lightBlue};
                `}
              >
                {files?.map((file) => {
                  const netChange = file.adds - file.deletes;
                  return (
                    <Div
                      css={`
                        ${flex("space-between")}
                        padding: 4px;
                        border-radius: 8px;
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
                            margin-right: 8px;
                          }
                          p {
                            min-width: 50px;
                            font-weight: bold;
                          }
                        `}
                      >
                        {file.type === "untracked" ? null : (
                          <>
                            {netChange >= 0 ? (
                              <PlusCircle
                                size={24}
                                color={colors.green}
                                weight="fill"
                              />
                            ) : (
                              <MinusCircle
                                size={24}
                                color={colors.green}
                                weight="fill"
                              />
                            )}
                            <Text>{Math.abs(netChange)}</Text>
                          </>
                        )}
                      </Div>
                    </Div>
                  );
                })}
              </Div>
            </Div>
          ))}
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
