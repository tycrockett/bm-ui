import { Div } from "./div";
import { colors } from "./styles";
import { flex } from "./utils";

const threeDotsLoader = (isLoading) => `
  ${flex("left")}
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 0;
  padding-left: 8px;
  background-color: transparent;
  z-index: 100;
  transition: 0.2s opacity ease;
  ${
    !isLoading
      ? `
      opacity: 0;
      pointer-events: none;
    `
      : ""
  }
  @keyframes three-dots {
    to {
      opacity: 0.1;
      transform: translateY(3px);
    }
  }
  > div {
    animation: three-dots 0.6s infinite alternate;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: white;
    margin: 0 4px;
    :nth-child(2) {
      animation-delay: 0.2s;
    }
    :nth-child(3) {
      animation-delay: 0.4s;
    }
  }
`;

export const Loader = () => {
  return (
    <Div css={threeDotsLoader(true)}>
      <Div />
      <Div />
      <Div />
    </Div>
  );
};
