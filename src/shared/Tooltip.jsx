import { Children, cloneElement, useState } from "react";
import { usePopper } from "react-popper";
import { colors } from "./styles";
import { shadows } from "./utils";
import { useEvent } from "../hooks/use-event";
import { Portal } from "./Portal";
import { Text } from "./text";

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

export const Tooltip = ({ label = "", popper: popperProps = {}, children }) => {
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
          <div ref={setTooltip} style={styles.popper} {...attributes.popper}>
            <Text label>{label}</Text>
          </div>
        </Portal>
      ) : null}
    </>
  );
};
