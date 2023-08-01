import { GitBranch } from "phosphor-react";
import { useContext, useState } from "react";
import { StoreContext } from "../context/store";
import { Button, colors, Div, Input, Modal, Text } from "../shared";
import { flex, shadows } from "../shared/utils";

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

  return (
    <>
      <Div
        css={`
          margin: auto;
          margin-top: 5vh;
          border-radius: 16px;
          padding: 32px 64px;
          background-color: rgba(0, 0, 0, 0.2);
        `}
      >
        <Div
          css={`
            ${flex("space-between")}
            svg {
              min-width: 48px;
              padding: 0;
              margin: 0;
            }
            p {
              margin: 0 8px;
            }
          `}
        >
          <GitBranch size={48} weight="bold" color="white" />
          <Text h3>
            Detected git repository, would you like to initialize BM?
          </Text>
          <Button onClick={() => setModal("init")}>Initialize</Button>
        </Div>
      </Div>
      {modal === "init" && (
        <Modal
          css={`
            padding: 32px;
            width: 500px;
            height: max-content;
            background-color: ${colors.lightIndigo};
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
