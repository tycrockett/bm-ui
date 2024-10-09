import { css } from "@emotion/css";
import React, { useRef, useState, useEffect } from "react";

export const Collapse = ({
  isOpen,
  timeout = 300,
  children,
  css: cssString = "",
  ...rest
}) => {
  const [height, setHeight] = useState(isOpen ? "auto" : 0);
  const [overflow, setOverflow] = useState(isOpen ? "visible" : "hidden");
  const contentRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // When expanding, first set the actual height, then set it to 'auto' after animation
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight + "px");

      const timer = setTimeout(() => {
        setHeight("auto");
        setOverflow("visible");
      }, timeout);

      return () => clearTimeout(timer);
    } else {
      // When collapsing, first set height to the actual height, then to 0 for collapsing animation
      const contentHeight = contentRef.current.scrollHeight;
      setHeight(contentHeight + "px");
      setOverflow("hidden");

      setTimeout(() => {
        setHeight(0);
      }, 0);
    }
  }, [isOpen, timeout]);

  return (
    <div
      ref={contentRef}
      className={css`
        ${cssString}
      `}
      style={{
        height,
        overflow,
        transition: `height ${timeout}ms ease`,
      }}
    >
      {children}
    </div>
  );
};
