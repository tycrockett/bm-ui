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
    methods.updateRepos(data);
    setModal("");
    setDefaultBranch("main");
  };

  return (
    <>
      <Div
        css={`
          margin: auto;
          margin-top: 5vh;
          width: max-content;
          border-radius: 16px;
          padding: 32px 64px;
          background-color: rgba(0, 0, 0, 0.2);
        `}
      >
        <Div
          css={`
            ${flex("space-between")}
            padding: 16px 0;
          `}
        >
          <GitBranch size={100} weight="bold" color="white" />
          <Text h1>
            Detected git repository, <br /> would you like to initialize BM?
          </Text>
        </Div>
        <Div
          css={`
            ${flex("right")}
          `}
        >
          <Button onClick={() => setModal("init")}>Initialize</Button>
        </Div>
      </Div>
      {modal === "init" && (
        <Modal
          css={`
            margin-top: 15vh;
            padding: 32px;
            width: 500px;
            height: max-content;
            background-color: ${colors.lightIndigo};
            ${shadows.lg}
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
