import { useEffect, useRef, useState } from "react";

export const useAnimation = (
  {
    animation,
    isAnimationDefault = false,
    disableInitial = true,
    timing = 200,
  },
  deps = []
) => {
  const ref = useRef(false);
  const [anim, setAnim] = useState(isAnimationDefault ? animation : "");

  useEffect(() => {
    if (ref.current || !disableInitial) {
      if (isAnimationDefault) {
        setAnim("");
        setTimeout(() => {
          setAnim(animation);
        }, timing);
      } else {
        setAnim(animation);
        setTimeout(() => {
          setAnim("");
        }, timing);
      }
    }
    if (!ref.current) {
      setTimeout(() => {
        ref.current = true;
      }, timing);
    }
  }, deps);

  return { animation: anim };
};
