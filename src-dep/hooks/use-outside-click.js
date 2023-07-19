import { useEffect, useRef } from "react";

export const useOutsideClick = (fn) => {

  const ref = useRef();

  const handleClickOutside = (event) => {
    if (ref.current && !ref.current.contains(event.target)) {
      fn(event);
    }
  };
  
  useEffect(() => {
    document.addEventListener('click', handleClickOutside, true);
    return () => {
        document.removeEventListener('click', handleClickOutside, true);
    };
  }, []);

  return ref;

}

