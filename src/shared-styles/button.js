import { css } from '@emotion/css';
import { theme } from './styles';

const tags = {
  primary: `
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background-color: white;
    color: black;
    border-radius: 8px;
    border: 1px solid #EEE;
    font-size: 1em;
    font-weight: bold;
    cursor: pointer;
    :hover {
      filter: drop-shadow(2px 2px 4px rgba(150, 150, 150, .5));
    }
    :active {
      filter: none;
      border: 1px solid #EEE;
    }
  `,
  text: `
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: transparent;
    border: none;
    color: white;
    font-size: 1em;
    font-weight: bold;
    cursor: pointer;
    :hover {
      filter: drop-shadow(2px 2px 8px rgba(150, 150, 150, .5));
    }
  `,
  icon: `
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    height: 40px;
    width: 40px;
    font-weight: bold;
    cursor: pointer;
    :active {
      filter: none;
    }
  `,
  'icon-dark': `
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 50%;
    height: 40px;
    width: 40px;
    font-weight: bold;
    cursor: pointer;
    background: transparent;
    :active {
      filter: none;
    }
    :hover {
      background-color: rgba(255, 255, 255, .1);
    }
    :disabled {
      opacity: 60%;
      cursor: default;
      :hover {
        background: transparent;
      }
    }
  `,
}

const buildStyles = (object, styles) => {
  const list = Object.keys(object);
  const split = styles.split(' ');
  const hasRequiredVal = list.find((item) => (split.includes(item)));
  const tags = hasRequiredVal ? split : ['primary', ...split];
  const obj = { ...theme, ...object };
  return tags.reduce((prev, tag) => {
    if (tag in obj) {
      return `${prev} ${obj[tag]}`;
    }
    return prev;
  }, '');
}

export const Button = ({ styles = '', className = '', color = '', bgColor = '', children, ...rest }) => {

  const props = {
    className: css`
      ${buildStyles(tags, styles)}
      ${color ? `color: ${color};` : ''}
      ${bgColor ? `background-color: ${bgColor};` : ''}
      ${className}
    `,
    ...rest
  }

  return (<button {...props}>{children}</button>);

}