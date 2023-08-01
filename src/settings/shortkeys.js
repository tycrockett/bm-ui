import {
  Gear,
  GithubLogo,
  PencilSimple,
  Plus,
  Sparkle,
  Square,
  X,
} from "phosphor-react";
import { Button, colors, Div, Modal, Text } from "../shared";
import { flex, styles } from "../shared/utils";
import { css } from "@emotion/css";
import { useState } from "react";

const actionMap = {
  "mode-finder": {
    display: "View Finder",
    type: "bm",
  },
  "mode-git": {
    display: "View Git",
    type: "bm",
  },
  "mode-settings": {
    display: "View Settings",
    type: "bm",
  },
  "create-bookmark": {
    display: "Create bookmark at current directory",
    type: "bm",
  },
  "open-vscode": {
    display: "Open VS code at current directory",
    type: "terminal",
  },
  "open-terminal": {
    display: "Open terminal at current directory",
    type: "terminal",
  },
  "open-github": {
    display: "Open remote branch in github",
    type: "github",
  },
};

const shortkeys = {
  "meta+KeyF": {
    actionId: "mode-finder",
  },
  "meta+KeyD": {
    actionId: "mode-git",
  },
  "meta+KeyS": {
    actionId: "mode-settings",
  },
  "meta+Equal": {
    actionId: "create-bookmark",
  },
  "meta+KeyO": {
    actionId: "open-vscode",
  },
  "meta+KeyT": {
    actionId: "open-terminal",
  },
  "meta+KeyR": {
    actionId: "open-github",
  },
};

export const Shortkeys = ({ settings, setSettings }) => {
  const [shortkey, setShortkey] = useState(null);

  return (
    <>
      <Div
        css={`
          ${flex("space-between")}
          margin-top: 24px;
          margin-bottom: 8px;
        `}
      >
        <Text
          h2
          css={`
            margin: 8px 0;
          `}
        >
          Shortkeys
        </Text>
        <Button icon>
          <Plus />
        </Button>
      </Div>

      {Object.entries(shortkeys)?.map(([key, item]) => (
        <Div
          css={`
            ${flex("left")}
            padding: 8px 16px;
            margin: 0 -16px;
            ${styles.hover}
          `}
        >
          {item?.actionId in (settings?.actions || {}) ? (
            <Sparkle
              color="white"
              size={32}
              className={css`
                margin-right: 16px;
              `}
            />
          ) : actionMap?.[item?.actionId]?.type === "bm" ? (
            <Gear
              color="white"
              size={32}
              className={css`
                margin-right: 16px;
              `}
            />
          ) : actionMap?.[item?.actionId]?.type === "github" ? (
            <GithubLogo
              color="white"
              size={32}
              className={css`
                margin-right: 16px;
              `}
            />
          ) : actionMap?.[item?.actionId]?.type === "terminal" ? (
            <GithubLogo
              color="white"
              size={32}
              className={css`
                margin-right: 16px;
              `}
            />
          ) : (
            <Square
              color="white"
              size={32}
              className={css`
                margin-right: 16px;
              `}
            />
          )}
          <Div
            css={`
              flex-grow: 1;
            `}
            onClick={() => setShortkey({})}
          >
            <Text h3>
              {settings?.actions?.[item?.actionId]?.name ||
                actionMap?.[item?.actionId]?.display}
            </Text>
            <Text
              css={`
                color: ${colors.lightBlue};
              `}
            >
              {key}
            </Text>
          </Div>
          <PencilSimple color="white" size={32} />
        </Div>
      ))}

      {shortkey !== null ? (
        <Modal
          css={`
            width: 400px;
            padding: 24px;
          `}
        >
          <Div
            css={`
              ${flex("space-between")}
            `}
          >
            <Text h2>Shortkey</Text>
            <Button icon>
              <X />
            </Button>
          </Div>
          <Div
            css={`
              ${flex("right")}
            `}
          >
            <Button secondary>Cancel</Button>
            <Button>Save shortkey</Button>
          </Div>
        </Modal>
      ) : null}
    </>
  );
};
