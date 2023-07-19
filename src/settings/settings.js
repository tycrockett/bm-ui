import { ArrowSquareOut } from "phosphor-react";
import { cmd } from "../node/node-exports";
import { Button, Div, Text } from "../shared";
import { flex } from "../shared/utils";

export const Settings = () => {
  const openSettings = () => {
    cmd(`open ~/bm-cache/settings.json`);
  };
  const openRepos = () => {
    cmd(`open ~/bm-cache/repos.json`);
  };

  return (
    <Div
      css={`
        padding: 16px;
      `}
    >
      <Div
        css={`
          ${flex("space-between")}
        `}
      >
        <Text h1>Settings</Text>
        <Button icon onClick={openSettings}>
          <ArrowSquareOut />
        </Button>
      </Div>

      <Div
        css={`
          ${flex("space-between")}
        `}
      >
        <Text h2>Repos</Text>
        <Button icon onClick={openRepos}>
          <ArrowSquareOut />
        </Button>
      </Div>
    </Div>
  );
};
