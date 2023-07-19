import { Div } from "./div";

const menu = (position) => {
  return `
    position: absolute;
    background-color: ${colors.dark};
    border: 1px solid white;
    border-radius: 8px;
    ${position}
  `;
};

const defaultPosition = `
  top: 100%;
  left: 0;
`;
export const Menu = ({ children, open, position = defaultPosition }) => {
  if (!open) {
    return null;
  }

  return <Div css={menu(position)}>{children}</Div>;
};
