import { useStyles } from "./utils";

export const textStyles = {
  primary: `
    margin: 0;
    padding: 0;
    color: white;
  `,
  h1: `
    font-size: 2em;
    font-weight: bold;
  `,
  h2: `
    font-size: 1.6em;
    font-weight: bold;
  `,
  h3: `
    font-size: 1.3em;
  `,
  h4: `
    font-size: 1.1em;d
    font-weight: bold;
  `,
  bold: `font-weight: bold;`,
  ellipsis: `
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  `,
};

export const Text = ({ children, ...rest }) => {
  const props = useStyles(textStyles, rest);
  return <p {...props}>{children}</p>;
};
