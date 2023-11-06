import { useEffect, useRef } from "react";

export const useOutsideClick = (fn, label = "") => {
  const ref = useRef(null);

  const handleClickOutside = (event) => {
    try {
      if (label) {
        console.log(label);
      }
      if (ref?.current?.contains(event.target)) {
        return;
      }
      fn(event);
    } catch (err) {
      console.warn(err);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  });

  return ref;
};
