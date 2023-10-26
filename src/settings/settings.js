import { ArrowSquareOut } from "phosphor-react";
import { useContext } from "react";
import { StoreContext } from "../context/store";
import { cmd } from "../node/node-exports";
import { Button, Div, Text } from "../shared";
import { flex, styles } from "../shared/utils";
import { Actions } from "./actions";

export const Settings = () => {
  const {
    store: { settings = {} },
    methods: { setSettings },
  } = useContext(StoreContext);

  const openSettings = () => cmd(`open ~/bm-cache/settings.json`);
  const openRepos = () => cmd(`open ~/bm-cache/repos.json`);

  return (
    <Div
      css={`
        padding: 16px;
      `}
    >
      <Text
        h2
        css={`
          margin-bottom: 8px;
        `}
      >
        Config Files
      </Text>
      <Div
        css={`
          ${flex("space-between")}
          padding: 0 8px;
          ${styles.hover}
        `}
        onClick={openSettings}
      >
        <Text h3>settings.json</Text>
        <Button icon>
          <ArrowSquareOut />
        </Button>
      </Div>

      <Div
        css={`
          ${flex("space-between")}
          padding: 0 8px;
          ${styles.hover}
        `}
        onClick={openRepos}
      >
        <Text h3>repos.json</Text>
        <Button icon>
          <ArrowSquareOut />
        </Button>
      </Div>

      <Actions settings={settings} setSettings={setSettings} />
    </Div>
  );
};
