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
      background-color: rgba(0, 0, 0, .2);
    }
    svg {
      min-width: 32px;
      min-height: 32px;
    }
  `,
  dark: `
    color: ${colors.darkIndigo};
  `,
  small: `
    svg {
      min-width: 24px;
      min-height: 24px;
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

export const Button = ({ children, ...rest }) => {
  const props = useStyles(buttonStyles, rest);
  return <button {...props}>{children}</button>;
};
