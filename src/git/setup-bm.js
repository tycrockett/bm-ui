import { GitBranch, ShieldWarning } from "phosphor-react";
import { useContext, useState } from "react";
import { StoreContext } from "../context/store";
import { Button, colors, Div, Input, Modal, Text } from "../shared";
import { flex } from "../shared/utils";
import { useAsyncValue } from "../hooks/use-async-value";
import { isInGit } from "./utils";

export const SetupBm = () => {
  const {
    store: { repos, settings },
    methods,
  } = useContext(StoreContext);

  const [defaultBranch, setDefaultBranch] = useState("main");
  const [modal, setModal] = useState("");

  const initBM = () => {
    let data = { ...repos };
    data[settings.pwd] = { defaultBranch };
    methods.setRepos(data);
    setModal("");
    setDefaultBranch("main");
  };

  const [value] = useAsyncValue(async () => {
    const data = await isInGit();
    return Boolean(data);
  }, [settings?.pwd]);

  return (
    <>
      {value ? (
        <Div
          css={`
            margin: auto;
            margin-top: 5vh;
            border-radius: 16px;
            padding: 32px;
            background-color: rgba(0, 0, 0, 0.2);
            width: calc(100% - 64px);
          `}
        >
          <Div
            css={`
              ${flex("left")}
              svg {
                min-width: 48px;
                padding: 0;
                margin: 0;
                margin-right: 16px;
              }
            `}
          >
            <GitBranch size={48} weight="bold" color="white" />
            <Text h3>Detected git repository</Text>
          </Div>
          <Div
            css={`
              ${flex("right")}
              margin-top: 16px;
            `}
          >
            <Button onClick={() => setModal("init")}>Initialize</Button>
          </Div>
        </Div>
      ) : (
        <Div
          css={`
            ${flex("left")}
            margin: auto;
            margin-top: 5vh;
            border-radius: 16px;
            padding: 32px;
            background-color: rgba(0, 0, 0, 0.2);
            width: calc(100% - 64px);
            svg {
              margin-right: 16px;
            }
          `}
        >
          <ShieldWarning size={48} weight="bold" color="white" />
          <Text h3>No Git Repository was detected.</Text>
        </Div>
      )}
      {modal === "init" && (
        <Modal
          css={`
            padding: 32px;
            width: 500px;
            height: max-content;
            background-color: ${colors.green};
            border-radius: 16px;
          `}
        >
          <Text h2>Initialize BM</Text>
          <Div
            css={`
              padding: 16px 0;
              ${flex("space-between")}
            `}
          >
            <Text bold>Default Branch</Text>
            <Input
              css={`
                width: 50%;
              `}
              value={defaultBranch}
              onChange={(e) => setDefaultBranch(e.target.value)}
            />
          </Div>
          <Div
            css={`
              ${flex("right")}
            `}
          >
            <Button
              css={`
                margin-right: 16px;
              `}
              secondary
              onClick={() => setModal("")}
            >
              Cancel
            </Button>
            <Button onClick={initBM}>Initialize</Button>
          </Div>
        </Modal>
      )}
    </>
  );
};
