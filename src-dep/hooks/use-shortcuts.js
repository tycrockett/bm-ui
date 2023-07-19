import { useEffect, useMemo } from "react";
import { openRemote } from '../components/git-utils';
const { exec } = window.require('child_process');

const defaults = {
  'meta+l': 'focus-cmd-bar',
  'meta+o': 'code-editor-cmd',
  'meta+t': 'open-terminal',
  'meta+w': 'open-toolbox',
  'meta+e': 'open-remote',
  
  'alt+Dead': 'toolbox-link-builder',
  
  'meta+x': 'escape',
  // 'meta+shift+d': 'open-dev-tools', 
}

const cmds = {
  'open-terminal': {
    type: 'exec',
    value: 'open -a terminal .',
  },
  'open-remote': {
    type: 'fn',
    value: () => openRemote()
  }
}

export const useShortcuts = ({
  focusCmdBar,
  codeEditorCmd,
  openLocalLink
}, disabled = false) => {

  const shortcuts = useMemo(() => {
    return defaults;
  }, []);

  const handleKeydown = (event) => {
    if (event?.target?.tagName !== 'INPUT') {
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
          } else if (shortcut in cmds) {
            const cmd = cmds[shortcut];
            if (cmd.type === 'exec') {
              exec(cmd.value);
            } else if (cmd.type === 'fn') {
              cmd.value();
            }
          } else if (shortcut === 'toolbox-link-builder') {
            openLocalLink();
          }
        } else if (!metaKey && !altKey && !ctrlKey && !shiftKey) {
          focusCmdBar();
        }
      }
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', handleKeydown, null);
    return () => document.removeEventListener('keydown', handleKeydown, null);
  }, [focusCmdBar, codeEditorCmd]);

}