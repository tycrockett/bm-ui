import { forwardRef } from "react";
import { useStyles } from "./utils";

export const selectStyles = {
  primary: `
    border-radius: 8px;
    padding: 8px 12px;
    border: none;
    outline: none;
    cursor: pointer;
    :disabled {
      color: black;
    }
  `,
};

export const Select = forwardRef(({ children, ...rest }, ref) => {
  const props = useStyles(selectStyles, rest);
  return (
    <select {...props} ref={ref}>
      {children}
    </select>
  );
});
