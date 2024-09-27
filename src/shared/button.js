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
      background-color: ${colors.lightIndigo};
    }
    svg {
      min-width: 32px;
      min-height: 32px;
    }
  `,
  dark: `
    color: ${colors.darkIndigo};
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

export const Button = ({ children, ...rest }) => {
  const props = useStyles(buttonStyles, rest);
  return <button {...props}>{children}</button>;
};
