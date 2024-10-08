import { useEffect, useRef } from "react";

export function useInterval(callback, delay) {
  const savedCallback = useRef(callback);

  savedCallback.current = callback;

  useEffect(() => {
    savedCallback.current();
  }, []);

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    // Note: 0 is a valid value for delay.
    if (delay === null) {
      return;
    }

    const id = setInterval(() => {
      savedCallback.current();
    }, delay);

    return () => {
      clearInterval(id);
    };
  }, [delay]);
}