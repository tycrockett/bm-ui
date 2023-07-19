import { forwardRef } from "react";
import { useStyles } from "./utils";

export const containerStyles = {
  primary: ``,
};

export const Div = forwardRef(({ children, ...rest }, ref) => {
  const props = useStyles(containerStyles, rest);
  return (
    <div {...props} ref={ref}>
      {children}
    </div>
  );
});
