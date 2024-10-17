import { useEffect, useRef } from "react";

export const useEvent = (eventName, handler, options = {}) => {
  const savedHandler = useRef();
  savedHandler.current = handler;

  const { element = window, capture, passive, once } = options;

  useEffect(() => {
    const isSupported = element && element.addEventListener;
    if (!isSupported) {
      return;
    }
    const eventListener = (event) => savedHandler.current(event);
    const opts = { capture, passive, once };
    element.addEventListener(eventName, eventListener, opts);
    return () => {
      element.removeEventListener(eventName, eventListener, opts);
    };
  }, [eventName, element, capture, passive, once]);
};
