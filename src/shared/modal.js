import { css } from "@emotion/css";
import { Div } from "./div";
import { colors } from "./styles";
import { flex, shadows } from "./utils";

export const Modal = ({ children, onClose, ...props }) => {
  return (
    <div
      className={css`
        position: fixed;
        display: flex;
        justify-content: center;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.2);
        z-index: 1000;
        ${flex("center")}
        > div {
          ${shadows.lg}
          border-radius: 8px;
          background-color: ${colors.green};
        }
      `}
      onMouseDown={onClose}
    >
      <Div {...props} onMouseDown={(event) => event.stopPropagation()}>
        {children}
      </Div>
    </div>
  );
};
