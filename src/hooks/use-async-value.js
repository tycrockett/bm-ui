import { useEffect, useState } from "react";

export const useAsyncValue = (
  asyncFn,
  deps = [],
  defaultValue = null
) => {
  
  const val = useState(defaultValue);
  const handleAsyncFn = async () => {
    const value = await asyncFn();
    val[1](value);
  }

  useEffect(() => {
    handleAsyncFn();
  }, [asyncFn, ...deps]);

  return [...val, handleAsyncFn];
}