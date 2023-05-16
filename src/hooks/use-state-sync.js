import { useEffect, useState } from "react";

export const useStateSync = (valueFn, deps = []) => {

  const getSyncValue = () => {
    let syncValue = valueFn;
    if (typeof valueFn === 'function') {
      syncValue = valueFn();
    }
    return syncValue;
  };

  const syncValue = getSyncValue();
  const [value, setValue] = useState(syncValue);

  useEffect(() => {
    setValue(syncValue);
  }, deps);

  const isSynced = syncValue === value;

  return [value, setValue, isSynced];

}