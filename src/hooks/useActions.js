import { useContext, useEffect, useRef } from "react";
import { StoreContext } from "../context/store";

export const useActions = (handler) => {
  const isInitial = useRef(true);

  const {
    store: { action },
  } = useContext(StoreContext);

  const handleActions = (item) => {
    for (const action of item?.list) {
      const { type, payload } = action;
      handler?.[type]?.(payload);
    }
  };

  useEffect(() => {
    if (action?.item && !isInitial.current) {
      handleActions(action?.item);
    }
    isInitial.current = false;
  }, [action?.updatedAt]);
};
