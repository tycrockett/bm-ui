import { css } from "@emotion/css";
import { theme } from "./styles";

export const primaryTags = {
  body: `
    margin: 0;
    font-size: 16px;
    color: white;
  `,
  h1: `
    margin: 0;
    font-size: 32px;
    font-weight: bold;
    color: white;
  `,
  h2: `
    margin: 0;
    font-size: 28px;
    font-weight: bold;
    color: white;
  `,
  h3: `
    margin: 0;
    font-size: 24px;
    font-weight: bold;
    color: white;
  `,
  ellipsis: `
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  `,
};

const tags = {
  ...primaryTags,
  "no-word-wrap": `white-space: nowrap;`,
};

const buildStyles = (object, styles) => {
  const list = Object.keys(primaryTags);
  const split = styles.split(" ");
  const hasRequiredVal = list.find((item) => split.includes(item));
  const tags = hasRequiredVal ? split : ["body", ...split];
  const obj = { ...theme, ...object };
  return tags.reduce((prev, tag) => {
    if (tag in obj) {
      return `${prev} ${obj[tag]}`;
    }
    return prev;
  }, "");
};

export const Text = ({
  styles = "",
  className = "",
  as = "p",
  color = "",
  bgColor = "",
  children,
  ...rest
}) => {
  const props = {
    className: css`
      ${buildStyles(tags, styles)}
      ${color ? `color: ${color};` : ""}
      ${bgColor ? `background-color: ${bgColor};` : ""}
      ${className}
    `,
    ...rest,
  };

  if (as === "p") {
    return <p {...props}>{children}</p>;
  } else if (as === "span") {
    return <span {...props}>{children}</span>;
  }
};
