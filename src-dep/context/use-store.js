import { useContext } from 'react';
import { StoreContext } from './store';

export const useStore = () => {
  const value = useContext(StoreContext);
  if (!value) {
    throw new Error('must use useStore inside a StateProvider');
  }
  const { store, dispatchStore } = value;

  const updateStore = (key, value) => {
    dispatchStore({
      type: 'UPDATE',
      payload: value,
      key,
    });
  }

  const setStore = (key, value) => {
    dispatchStore({
      type: 'SET',
      payload: value,
      key,
    });
  }

  return {
    store,
    updateStore,
    setStore,
  };
};