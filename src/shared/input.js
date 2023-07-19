import { forwardRef } from "react";
import { useStyles } from "./utils";

export const inputStyles = {
  primary: `
    border-radius: 8px;
    padding: 12px 8px;
    border: none;
    outline: none;
  `,
};

export const Input = forwardRef(({ ...rest }, ref) => {
  const props = useStyles(inputStyles, rest);
  return <input {...props} ref={ref} />;
});
