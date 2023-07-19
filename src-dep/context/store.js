import React, { useReducer } from "react";

const initialState = {
  settings: {
    localBuildDomain: "http://localhost:3000",
    bmCodePath: "",
  },
  sessions: [],
};

const reducer = (state, action) => {
  switch (action.type) {
    case "UPDATE":
      return {
        ...state,
        [action.key]: {
          ...state?.[action.key],
          ...action.payload,
        },
      };
    case "SET":
      return {
        ...state,
        [action.key]: action.payload,
      };
    default:
      return state;
  }
};

export const StoreContext = React.createContext();

export const StoreProvider = (props) => {
  const [store, dispatchStore] = useReducer(reducer, initialState);
  return (
    <StoreContext.Provider value={{ store, dispatchStore }}>
      {props.children}
    </StoreContext.Provider>
  );
};
