import { useStyles } from "./utils";

export const containerStyles = {
  primary: ``,
};

export const Div = ({ children, ...rest }) => {
  const props = useStyles(containerStyles, rest);
  return <div {...props}>{children}</div>;
};
