import { forwardRef } from "react";
import { colors } from "./styles";
import { flex, shadows, useStyles } from "./utils";

export const buttonStyles = {
  primary: `
    border-radius: 8px;
    background-color: white;
    ${shadows.md}
    color: black;
    padding: 12px;
    outline: none;
    border: none;
    font-weight: bold;
    text-transform: uppercase;
    cursor: pointer;
    :disabled {
      opacity: .5;
      cursor: default;
      color: ${colors.indigo}
      :hover { background-color: transparent; }
    }
  `,
  secondary: `
    background-color: ${colors.darkIndigo};
    color: white;
  `,
  icon: `
    ${flex("center")}
    border-radius: 50%;
    background-color: transparent;
    padding: 0;
    width: 40px;
    height: 40px;
    color: white;
    :hover {
    transition: background-color .2s ease;
      background-color: ${colors.green};
    }
    svg {
      min-width: 32px;
      min-height: 32px;
    }
  `,
  dark: `
    color: ${colors.darkIndigo};
  `,
  md: `
    width: 40px;
    height: 40px;
    svg {
      min-width: 24px;
      min-height: 24px;
    }
  `,
  sm: `
    width: 24px;
    height: 24px;
    svg {
      min-width: 16px;
      min-height: 16px;
    }
  `,
  xs: `
    width: 20px;
    height: 20px;
    svg {
      margin: 0;
      min-width: 16px;
      min-height: 16px;
    }
  `,
};

export const Button = forwardRef(({ children, ...rest }, ref) => {
  const props = useStyles(buttonStyles, rest);
  return (
    <button {...props} ref={ref}>
      {children}
    </button>
  );
});
