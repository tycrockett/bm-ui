export const colors = {
  black: `#282d2d`,
  light: `#BBB`,
  dark: `#41413F`,

  lightGreen: `#04B16F`,
  green: `#117660`,
  darkGreen: `#09323B`,

  lightRed: `#F7BEC0`,
  red: `#E7625F`,
  darkRed: `#C85250`,

  lightBlue: `#93CAED`,
  blue: `#0000D1`,
  darkBlue: `#0B0B60`,

  lightIndigo: `#6500B0`,
  indigo: `#4B0082`,
  darkIndigo: `#310062`,
};

export const scrollbar = {
  hide: `::-webkit-scrollbar { display: none; }`,
  style: `
    ::-webkit-scrollbar {
      width: 6px;
      height: 4px;
      border-radius: 16px;
    }

    ::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
    }

    ::-webkit-scrollbar-thumb {
      background: ${colors.green};
      border-radius: 16px;
      visibility: visible;
      height: 3px;
    }
  `,
};
