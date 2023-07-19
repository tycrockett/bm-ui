import { useEffect } from "react"

export const useEvents = (element, eventsObject, deps = []) => {

  const addListeners = (events) => {
    for (const event of events) {
      const [key, args] = event;
      element.addEventListener(key, ...args);
    }
  }

  const removeListeners = (events) => {
    for (const event of events) {
      const [key, args] = event;
      element.removeEventListener(key, ...args);
    }
  }

  useEffect(() => {
    if (deps?.length) {
      const events = Object.entries(eventsObject);
      addListeners(events);
      return () => removeListeners(events);
    }
  }, deps);

  useEffect(() => {
    if (!deps?.length) {
      const events = Object.entries(eventsObject);
      addListeners(events);
      return () => removeListeners(events);
    }
  });

};