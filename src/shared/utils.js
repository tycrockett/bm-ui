import { cx, css } from "@emotion/css";
import { useMemo } from "react";

export const useStyles = (componentStyles, componentProps = {}) => {
  const {
    className: classes = "",
    css: cssStyle = "",
    ...rest
  } = componentProps;

  const { props, styleProps } = useMemo(() => {
    const entries = Object.entries(rest);
    return entries.reduce(
      (prev, [key, value]) => {
        if (key in componentStyles && value) {
          return {
            ...prev,
            styleProps: prev?.styleProps + componentStyles[key],
          };
        }
        return { ...prev, props: { ...prev?.props, [key]: value } };
      },
      { props: {}, styleProps: componentStyles?.primary }
    );
  });

  const className = useMemo(() => {
    return cx(
      css`
        ${styleProps}
        ${cssStyle}
      `,
      classes
    );
  }, [styleProps, cssStyle, classes]);

  return { className, ...props };
};

export const flex = (options) => {
  const values = options?.split(" ") || [];
  const style = values.reduce((prev, item) => {
    return prev + " " + flexOptions?.[item] || "";
  }, `display: flex;`);
  return style;
};

const flexOptions = {
  "space-between": `justify-content: space-between; align-items: center;`,
  "space-around": `justify-content: space-around; align-items: center;`,
  "space-evenly": `justify-content: space-evenly; align-items: center;`,
  center: `justify-content: center; align-items: center;`,
  left: `justify-content: left; align-items: center;`,
  right: `justify-content: right; align-items: center;`,
  "ai-center": `align-items: center;`,
  start: `align-items: start;`,
  end: `align-items: end;`,
  stretch: `align-items: stretch;`,

  column: `flex-direction: column;`,
  wrap: `flex-wrap: wrap;`,
  "wrap-reverse": "flex-wrap: wrap-reverse;",
};

export const shadows = {
  sm: `filter: drop-shadow(1px 1px 3px rgba(0, 0, 0, .1));`,
  md: `filter: drop-shadow(2px 2px 4px rgba(0, 0, 0, .2));`,
  lg: `filter: drop-shadow(4px 4px 12px rgba(0, 0, 0, .3));`,
};

export const styles = {
  scrollbar: `
    ::-webkit-scrollbar {
      background: transparent;
      width: 8px;

    }
    ::-webkit-scrollbar-thumb {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 30px;
    }
  `,
};

const animations = {
  fadeIn: `@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`,
  fadeOut: `@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`,
  verticallyGrow: `@keyframes verticallyGrow { from { height: 0; } to { height: auto; }}`,
  scaleIn: `
    @keyframes scaleIn {
      from {
        transform: scale(.5, .5);
        opacity: .2;
      }
      to {
        transform: scale(3, 2.5);
        transform: translateY(40px);
        opacity: 0;
      }
    }
  `,
  scaleUp: `
    @keyframes scaleUp {
      from {
        font-size: 1em;
        line-height: 1em;
      }
      to {
        font-size: 1.5em;
        line-height: 1.5em;
      }
    }
  `,
  shake: `
    @keyframes shake {
      0% { transform: translateY(0) }
      25% { transform: translateY(3px) }
      50% { transform: translateY(-2px) }
      75% { transform: translateY(1px) }
      100% { transform: translateY(0) }
    }
  `,
  bounce: `
    @keyframes bounce {
      0%   { transform: translateY(0px); }
      20%  { transform: translateY(-1px); }
      40%  { transform: translateY(0px); }
      60%  { transform: translateY(-1px); }
      80%  { transform: translateY(0px); }
    }
  `,
};

export const animation = (type, options) => {
  return `
    ${animations[type]}
    animation: ${options} ${type};
  `;
};
