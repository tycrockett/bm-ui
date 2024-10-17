import { useDebounce } from "./use-debounce";
import { useEvent } from "./use-event";

const getCapturedKeys = (event) => {
  const { code, metaKey, altKey, ctrlKey, shiftKey } = event;
  const keys = Object.entries({
    meta: metaKey,
    alt: altKey,
    ctrl: ctrlKey,
    shift: shiftKey,
  }).reduce((prev, [key, value]) => {
    if (value && prev) {
      return prev + "+" + key;
    } else if (value) {
      return prev + key;
    } else {
      return prev;
    }
  }, "");
  if (
    code.includes("Meta") ||
    code.includes("Alt") ||
    code.includes("Ctrl") ||
    code.includes("Shift")
  ) {
    return keys;
  } else {
    return keys + "+" + code;
  }
};

export const useKeyboard = ({
  keydown = null,
  keyup = null,
  options = { useCapture: false },
} = {}) => {
  const handleKeydown = (event) => {
    if (keydown !== null) {
      const capturedKeys = getCapturedKeys(event);
      keydown(capturedKeys, event);
    }
  };

  const handleKeyup = (event) => {
    if (keyup !== null) {
      const capturedKeys = getCapturedKeys(event);
      keyup(capturedKeys, event);
    }
  };

  const debounced_handleKeyup = useDebounce(handleKeyup, 10);

  useEvent("keydown", handleKeydown, options);
  useEvent("keyup", debounced_handleKeyup, options);

  return {};
};
