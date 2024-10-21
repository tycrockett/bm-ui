import { forwardRef } from "react";
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
  "left-ellipsis": `
    text-align: left;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    direction: rtl;
  `,
};

export const Text = forwardRef(({ children, ...rest }, ref) => {
  const props = useStyles(textStyles, rest);
  return (
    <p {...props} ref={ref}>
      {children}
    </p>
  );
});
