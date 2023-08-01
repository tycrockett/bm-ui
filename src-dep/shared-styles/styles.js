
export const colors = {
  black: `#282d2d`,
  light: `#BBB`,

  lightGreen: `#04B16F`,
  green: `#117660`,
  darkGreen: `#09323B`,

  lightRed: `#F7BEC0`,
  red: `#E7625F`,
  darkRed: `#C85250`,

  lightBlue: `#93CAED`,
  blue: `#0000D1`,
  darkBlue: `#0B0B60`,
  
  indigo: `#310062`,
}

export const theme = {
  log: `border: 3px solid red;`,
  oa: `overflow: auto;`,
  bold: `font-weight: bold;`,
  right: `text-align: right;`,
  left: `text-align: left;`,
  center: `text-align: center;`,
  m: `margin: 16px;`,
  'm-sm': `margin: 8px;`,
  'm-xs': `margin: 4px;`,
  mh: `margin-left: 16px; margin-right: 16px;`,
  mv: `margin-top: 16px; margin-bottom: 16px;`,
  'mh-xs': `margin-left: 4px; margin-right: 4px;`,
  'mv-xs': `margin-top: 4px; margin-bottom: 4px;`,
  'mh-sm': `margin-left: 8px; margin-right: 8px;`,
  'mv-sm': `margin-top: 8px; margin-bottom: 8px;`,
  'mh-lg': `margin-left: 24px; margin-right: 24px;`,
  'mv-lg': `margin-top: 24px; margin-bottom: 24px;`,
  ml: `margin-left: 16px;`,
  mr: `margin-right: 16px;`,
  mt: `margin-top: 16px;`,
  mb: `margin-bottom: 16px;`,
  'ml-xs': `margin-left: 4px;`,
  'mr-xs': `margin-right: 4px;`,
  'mt-xs': `margin-top: 4px;`,
  'mb-xs': `margin-bottom: 4px;`,
  'ml-sm': `margin-left: 8px;`,
  'mr-sm': `margin-right: 8px;`,
  'mt-sm': `margin-top: 8px;`,
  'mb-sm': `margin-bottom: 8px;`,
  'ml-lg': `margin-left: 24px;`,
  'mr-lg': `margin-right: 24px;`,
  'mt-lg': `margin-top: 24px;`,
  'mb-lg': `margin-bottom: 24px;`,
  pad: `padding: 16px;`,
  'pad-sm': `padding: 8px;`,
  'pad-xs': `padding: 4px;`,
  'pad-sm': `padding: 8px;`,
  'pad-lg': `padding: 24px;`,
  padh: `padding-left: 16px; padding-right: 16px;`,
  padv: `padding-top: 16px; padding-bottom: 16px;`,
  'padh-xs': `padding-left: 4px; padding-right: 4px;`,
  'padv-xs': `padding-top: 4px; padding-bottom: 4px;`,
  'padh-sm': `padding-left: 8px; padding-right: 8px;`,
  'padv-sm': `padding-top: 8px; padding-bottom: 8px;`,
  'padh-lg': `padding-left: 24px; padding-right: 24px;`,
  'padv-lg': `padding-top: 24px; padding-bottom: 24px;`,
  padl: `padding-left: 16px;`,
  padr: `padding-right: 16px;`,
  padt: `padding-top: 16px;`,
  padb: `padding-bottom: 16px;`,
  'padl-sm': `padding-left: 8px;`,
  'padr-sm': `padding-right: 8px;`,
  'padt-sm': `padding-top: 8px;`,
  'padb-sm': `padding-bottom: 8px;`,
  'padl-lg': `padding-left: 24px;`,
  'padr-lg': `padding-right: 24px;`,
  'padt-lg': `padding-top: 24px;`,
  'padb-lg': `padding-bottom: 24px;`,
  flex: `display: flex;`,
  wrap: `flex-wrap: wrap;`,
  fg: `flex-grow: 1;`,
  'fd:c': `flex-direction: column;`,
  'jc:sb': `display: flex; justify-content: space-between;`,
  'jc:sa': `display: flex; justify-content: space-around;`,
  'jc:c': `display: flex; justify-content: center;`,
  'jc:r': `display: flex; justify-content: right;`,
  'jc:l': `display: flex; justify-content: left;`,
  'ai:c': `display: flex; align-items: center;`,
  'ai:s': `display: flex; align-items: start;`,
  'ai:e': `display: flex; align-items: end;`,
  'full-width': `width: 100%;`,
  'full-height': `height: 100%;`,
  hover: `
    :hover {
      background: #6500B0;
    }
  `,
  pointer: `cursor: pointer;`,
  radius: `border-radius: 4px;`,
  'radius-30px': `border-radius: 30px;`,
  absolute: `position: absolute;`,
  relative: `position: relative;`,
  fixed: `position: fixed;`,
  sticky: `position: sticky;`,
  shadow: `
    filter: drop-shadow(2px 2px 4px rgba(255, 255, 255, .3));
  `,
  selected: `
    border-radius: 30px;
    background: rgba(255, 255, 255, .2);
  `,
  'hide-scroll': `::-webkit-scrollbar { display: none; }`,
  'alt-list': `
    border-bottom: 1px solid #666;
    > div {
      :nth-child(odd) {
        background-color: ${colors.black};
      }
    }
  `,
  'zi-0': `z-index: 0;`,
  'zi-10': `z-index: 10;`,
  'zi-20': `z-index: 20;`,
  'zi-30': `z-index: 30;`,
};