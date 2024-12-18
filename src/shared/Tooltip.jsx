import { Children, cloneElement, useState } from "react";
import { usePopper } from "react-popper";
import { colors } from "./styles";
import { flex, shadows } from "./utils";
import { useEvent } from "../hooks/use-event";
import { Portal } from "./Portal";
import { Text } from "./text";
import { css } from "@emotion/css";
import { Shortkey } from "../Shortkey";

export const tooltipTheme = {
  default: `
    pointer-events: none;
    z-index: 1000;
    background-color: ${colors.dark};
    ${shadows.lg}
    padding: 8px 16px;
    border-radius: 8px;
    max-width: 300px;
    p {
      font-weight: bold;
      color: white;
    }
  `,
};

export const Tooltip = ({
  label = "",
  popper: popperProps = {},
  shortkey = "",
  children,
}) => {
  // We only want one child for the tooltip
  const child = Children.only(children);
  const [anchor, setAnchor] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const { styles, attributes } = usePopper(anchor, tooltip, {
    placement: "top",
    modifiers: [
      {
        name: "offset",
        options: {
          offset: [0, 10], // Horizontal (x-axis) offset is 0, vertical (y-axis) offset is 10px
        },
      },
    ],
    ...popperProps,
  });
  const [open, setOpen] = useState(false);

  useEvent("mouseenter", () => setOpen(true), { element: anchor });
  useEvent("mouseleave", () => setOpen(false), { element: anchor });

  if (!label) {
    return child;
  }

  return (
    <>
      {cloneElement(child, { ref: setAnchor })}
      {open ? (
        <Portal>
          <div
            ref={setTooltip}
            className={css`
              background-color: ${colors.darkIndigo}ee;
              ${shadows.lg}
              border: 1px solid black;
              border-radius: 8px;
              padding: 8px;
              ${flex("left")}
              gap: 16px;
              z-index: 10000000000000;
            `}
            style={styles.popper}
            {...attributes.popper}
          >
            <Text label>{label}</Text>
            {shortkey ? <Shortkey type={shortkey} /> : null}
          </div>
        </Portal>
      ) : null}
    </>
  );
};
