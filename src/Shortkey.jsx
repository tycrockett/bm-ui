import { useContext } from "react";
import { defaultActions } from "./settings/actions";
import { colors, Text } from "./shared";
import { StoreContext } from "./context/store";

const mapping = {
  meta: "⌘",
  ctrl: "⌃",
  shift: "⇧",
  alt: "⌥",
  Enter: "↵",
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Equal: "+",
  Backspace: "⌫",
  Delete: "⌦",
  Escape: "⎋",
  Tab: "⇥",
  Space: "␣",
  Home: "↖",
  End: "↘",
  PageUp: "⇞",
  PageDown: "⇟",
};

export const Shortkey = ({
  type,
  value = "",
  css: cssString = "",
  className = "",
}) => {
  const { store } = useContext(StoreContext);
  const { actions } = store;

  const commands = {
    ...defaultActions,
    ...actions,
  };

  const shortkey = commands?.[type]?.shortkey || value;
  const formattedKey = shortkey
    ?.split("+")
    ?.map((item) =>
      item in mapping
        ? mapping[item]
        : item?.replace("Key", "").replace("Digit", "")
    );
  const displayKey = formattedKey?.join("");

  return (
    <Text
      className={className}
      css={`
        color: ${colors.lightBlue};
        ${cssString}
      `}
    >
      {displayKey}
    </Text>
  );
};
