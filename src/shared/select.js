import { css } from "@emotion/css";
import { CaretDown, Check } from "phosphor-react";
import { forwardRef, useEffect, useState } from "react";
import { useOutsideClick } from "../hooks/use-outside-click";
import { Text } from "./text";

const tags = {
  primary: `
    position: relative;
    padding: 8px;
    border-radius: 8px;
    border: 1px solid #EEE;
    min-width: 200px;
    cursor: pointer;
    background-color: white;
  `,
  dark: `
    position: relative;
    min-width: 200px;
    padding: 8px;
    outline: none;
    background-color: #4B0082;
    border: 1px solid #666;
    border-radius: 4px;
    appearance: none;
    color: white;
    font-weight: bold;
    font-size: 1em;
    :hover {
      border: 1px solid white;
      cursor: pointer;
      background-color: #6500B0;
    }
    [disabled] {
      border: 1px solid #666;
      cursor: default;
      background: #4B0082;
    }
  `,
};

const buildStyles = (object, styles) => {
  const list = Object.keys(object);
  const split = styles.split(" ");
  const hasRequiredVal = list.find((item) => split.includes(item));
  const tags = hasRequiredVal ? split : ["primary", ...split];
  const obj = { ...object };
  return tags.reduce((prev, tag) => {
    if (tag in obj) {
      return `${prev} ${obj[tag]}`;
    }
    return prev;
  }, "");
};

const child = (reverse, children) => `
  cursor: pointer;
  position: absolute;
  top: 100%;
  ${reverse ? `top: -${20 * children.length - 20}px;` : ""}
  right: 0;
  left: 0;
  background-color: #4B0082;
  border: 1px solid white; border-radius: 4px;
  padding: 4px;
`;

export const Select = forwardRef(
  (
    {
      styles = "",
      className = "",
      color = "",
      bgColor = "",
      children,
      displayFn = null,
      reverse,
      ...rest
    },
    ref
  ) => {
    const [display, setDisplay] = useState(false);
    const outsideRef = useOutsideClick(() => setDisplay(false));

    const props = {
      className: css`
        ${buildStyles(tags, styles)}
        ${color ? `color: ${color};` : ""}
      ${bgColor ? `background-color: ${bgColor};` : ""}
      ${className}
      `,
      onClick: () => setDisplay(true),
      ref,
      ...rest,
    };

    const handleClick = (event, value) => {
      event.stopPropagation();
      rest.onChange({ ...event, target: { ...event.target, value } });
    };

    useEffect(() => {
      if (outsideRef.current !== null) {
        setDisplay(false);
      }
    }, [props.value]);

    useEffect(() => {
      if ("isOpen" in props) {
        setDisplay(props?.isOpen);
      }
    }, [props?.isOpen]);

    const current = displayFn ? displayFn(props.value) : props.value || "";

    return (
      <div {...props}>
        <div
          className={css`
            display: flex;
            justify-content: space-between;
          `}
        >
          {current || "n/a"}
          <CaretDown />
        </div>
        {display && !props?.disabled ? (
          <div
            className={css`
              ${className} ${child(reverse, children)}
            `}
            ref={outsideRef}
          >
            {children.map((element) => (
              <Text
                key={element.props.value}
                styles={`pad-xs hover jc:sb`}
                onClick={(e) => handleClick(e, element.props.value)}
                className={css`
                  height: 20px;
                `}
              >
                {displayFn
                  ? displayFn(element.props.value)
                  : element.props.value}
                {(displayFn ? displayFn(element.props.value) : element) ===
                current ? (
                  <Check />
                ) : null}
              </Text>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);