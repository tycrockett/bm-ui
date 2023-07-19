import { useRef } from "react";

export const useDebounce = (fn, delay, options = {}) => {

  const { immediateFirst = false, runAtEveryInterval = false } = options;

  const argValues = useRef(null);
  const timer = useRef(null);

  const callback = (...args) => {
    argValues.current = args;
    if (!immediateFirst) {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      timer.current = setTimeout(() => {
        fn(...argValues.current);
      }, delay);
    } else if (timer.current === null) {
      fn(...argValues.current);
      timer.current = setTimeout(() => {
        fn(...argValues.current);
        timer.current = null;
      }, delay);
    } else if (!runAtEveryInterval) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        fn(...argValues.current);
        timer.current = null;
      }, delay);
    }
  }

  return callback;

}