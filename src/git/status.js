import { Button, colors, Div, Text } from "../shared";
import { animation, flex, shadows } from "../shared/utils";
import {
  FileArrowUp,
  FileDotted,
  FileX,
  MinusCircle,
  PlusCircle,
} from "phosphor-react";
import { toast } from "react-toastify";
import { useAnimation } from "../hooks/use-animation";
import { format } from "date-fns";
import { useAsyncValue } from "../hooks/use-async-value";
import { cmd } from "../node/node-exports";

export const Status = ({ status, currentBranch, parentBranch }) => {
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

  const { animation: fadeIn } = useAnimation(
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

  return (
    <Div
      css={`
        ${hasStatus ? fadeIn : ""}
        margin-bottom: 32px;
        height: 100%;
        width: 100%;
      `}
    >
      {hasStatus ? (
        <>
          <Div
            css={`
              ${flex("space-between")}
            `}
          >
            <Text
              h3
              bold
              css={`
                margin-bottom: 8px;
              `}
            >
              Status
            </Text>
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
          {status?.untracked?.map((item) => (
            <Div
              css={`
                ${flex("space-between")}
                padding: 0;
              `}
            >
              <Div
                css={`
                  ${flex("center")}
                  p {
                    margin-left: 16px;
                  }
                `}
              >
                <Button
                  icon
                  small
                  onClick={() => copyItem(item)}
                  css={`
                    margin: 0;
                  `}
                >
                  <FileDotted
                    size={24}
                    color={colors.lightBlue}
                    weight="bold"
                  />
                </Button>
                <Text h4>{item}</Text>
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
                  <PlusCircle size={24} color={colors.green} weight="bold" />
                </Div>
              </Div>
            </Div>
          ))}

          {status?.deleted?.map((item) => (
            <Div
              css={`
                ${flex("space-between")}
                padding: 0;
              `}
            >
              <Div
                css={`
                  ${flex("center")}
                  p {
                    margin-left: 16px;
                  }
                `}
              >
                <Button
                  icon
                  small
                  onClick={() => copyItem(item)}
                  css={`
                    margin: 0;
                  `}
                >
                  <FileX size={24} color={colors.red} weight="bold" />
                </Button>
                <Text h4>{item}</Text>
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
                  <Text>{status?.files?.[item]?.deletes}</Text>
                  <MinusCircle size={24} color={colors.red} weight="bold" />
                </Div>
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
                  <Text>{status?.files?.[item]?.adds}</Text>
                  <PlusCircle size={24} color={colors.green} weight="bold" />
                </Div>
              </Div>
            </Div>
          ))}

          {status?.modified?.map((item) => (
            <Div
              css={`
                ${flex("space-between")}
                padding: 0;
              `}
            >
              <Div
                css={`
                  ${flex("center")}
                  p {
                    margin-left: 16px;
                  }
                `}
              >
                <Button
                  icon
                  small
                  onClick={() => copyItem(item)}
                  css={`
                    margin: 0;
                  `}
                >
                  <FileArrowUp size={24} color={colors.green} weight="bold" />
                </Button>
                <Text h4>{item}</Text>
              </Div>
              <Div
                css={`
                  ${flex("center")}
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
                  <Text>{status?.files?.[item]?.deletes}</Text>
                  <MinusCircle size={24} color={colors.red} weight="bold" />
                </Div>
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
                  <Text>{status?.files?.[item]?.adds}</Text>
                  <PlusCircle size={24} color={colors.green} weight="bold" />
                </Div>
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
          <Text h3 bold>
            No changes detected.
          </Text>
          <Text h4 bold>
            {status?.lastUpdate
              ? format(new Date(status?.lastUpdate), "h:mm a")
              : ""}
          </Text>
        </Div>
      )}
    </Div>
  );
};
