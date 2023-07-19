import { css } from '@emotion/css';
import { forwardRef } from 'react';
import { colors, theme } from './styles';

const tags = {
  primary: `
    padding: 8px;
    outline: none;
    border-radius: 4px;
    border: 1px solid #EEE;
    :disabled {
      border: 1px solid transparent;
      background: #DDD;
    }
    :focus {
      border: 1px solid black;
      filter: drop-shadow(2px 2px 6px rgba(150, 100, 255, .5));
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

export const Input = forwardRef(({ styles = '', className = '', ...rest }, ref) => {

  const props = {
    className: css`${buildStyles(tags, styles)} ${className}`,
    ...rest,
    ref
  }

  return (<input {...props} />);

});