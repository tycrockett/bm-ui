import { forwardRef } from 'react';
import { css } from '@emotion/css';
import { theme } from './styles';

const tags = {
  ...theme,
  modal: `
    border-radius: 8px;
    background-color: white;
  `
}

const buildStyles = (object, styles) => {
  const tags = styles.split(' ');
  return tags.reduce((prev, tag) => {
    if (tag in object) {
      return `${prev} ${object[tag]}`;
    }
    return prev;
  }, '');
}


export const Div = forwardRef(({ children, styles = '', className = '', bgColor = '', ...rest }, ref) => {
  const props = {
    className: css`
      ${buildStyles(tags, styles)}
      ${bgColor ? `background-color: ${bgColor};` : ''}
      ${className}
    `,
    ...rest,
    ref,
  }

  if (styles.includes('modal')) {
    return (
      <div className={css`
        position: fixed;
        display: flex;
        justify-content: center;
        align-items: center;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, .2);
      `}>
        <div {...props}>
          {children}
        </div>
      </div>
    )
  } else {
    return (
      <div {...props}>
        {children}
      </div>
    )
  }
});