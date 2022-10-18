import { useEffect, useMemo } from "react";

const defaults = {
  'meta+l': 'focus-cmd-bar',
  'meta+o': 'code-editor-cmd',
  'meta+shift+d': 'open-dev-tools', 
}

export const useShortcuts = ({
  focusCmdBar,
  codeEditorCmd
}, disabled = false) => {

  const shortcuts = useMemo(() => {
    return defaults;
  }, []);

  const handleKeydown = (event) => {
    if (!disabled) {
      const { key, metaKey, altKey, ctrlKey, shiftKey } = event;
      const code = `${metaKey ? 'meta+' : ''}${altKey ? 'alt+' : ''}${ctrlKey ? 'ctrl+' : ''}${shiftKey ? 'shift+' : ''}${key}`;
      if (code in shortcuts) {
        event.preventDefault();
        const shortcut = shortcuts[code];
        if (shortcut === 'focus-cmd-bar') {
          focusCmdBar();
        } else if (shortcut === 'code-editor-cmd') {
          codeEditorCmd();
        } else if (shortcut === 'open-dev-tools') {
          // w.close()
          console.log('OPEN');
        }
      } else if (!metaKey && !altKey && !ctrlKey && !shiftKey) {
        focusCmdBar();
      }
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown, null);
    return () => document.removeEventListener('keydown', handleKeydown, null);
  }, [focusCmdBar, codeEditorCmd]);

}