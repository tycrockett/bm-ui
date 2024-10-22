import { useEffect, useRef, useState } from "react";

export const useAsyncValue = (asyncFn, deps = [], defaultValue = null) => {
  const ref = useRef();

  ref.current = asyncFn;

  const val = useState(defaultValue);
  const handleAsyncFn = async () => {
    const value = await ref.current();
    val[1](value);
  };

  useEffect(() => {
    handleAsyncFn();
  }, [...deps]);

  return [...val, handleAsyncFn];
};
