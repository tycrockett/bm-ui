import { useMemo, useEffect, useState, useCallback, useRef } from 'react';
import { css } from '@emotion/css';
import { Div } from './shared-styles/div';
import { Text } from './shared-styles/text';
import { FolderSimple, File, ArrowSquareOut, Gear, Tree, Monitor } from 'phosphor-react';
import { getFilesInDirectory, read, write } from './node/fs-utils';
import { Input } from './shared-styles/input';
import { Button } from './shared-styles/button';
import { colors } from './shared-styles/styles';
import { cmd } from './node/node-exports';
import { GitGui } from './components/git-gui';
import { CmdBar } from './components/cmd-bar';
import { useShortcuts } from './hooks/use-shortcuts';
import { useStore } from './context/use-store';
import { useAsyncValue } from './hooks/use-async-value';
import { fetch as fetchAll } from './components/git-utils';
import { Terminal } from './components/terminal';

const cacheKeyRelative = `bm-cache`;

const checkGit = async (settings) => {
  try {
    const path = settings?.pwd?.replace('~', settings.base);
    const list = getFilesInDirectory(path, true);
    return list?.findIndex(({ name }) => name === '.git') > -1;
  } catch (err) {
    return false;
  }
}

function App() {

  const { store: { settings = {}, cacheKey }, setStore } = useStore();

  const focusCmd = useRef();
  const [pwd, setPwd] = useState('');
  const [focusPwd, setFocusPwd] = useState(false);
  const [dirList, setDirList] = useState();
  const [display, setDisplay] = useState(false);
  const [text, setText] = useState('');
  const refFieldFocus = useRef();
  const [mode, setMode]  = useState('bm');

  const setSettings = (data) => {
    if (cacheKey) {
      write(`${cacheKey}/settings.json`, data);
    }
    setStore('settings', data);
  }

  const fetch = async () => {
    try {
      const baseRaw = await cmd(`cd ~ && pwd`);
      const base = baseRaw.replace(/\n/g, '');
      const cacheKey = `${base}/${cacheKeyRelative}`;
      setStore('cacheKey', cacheKey);
      let data = read(`${cacheKey}/settings.json`, {});
      if (!data.base || !data.pwd) {
        data.base = base;
        data.pwd = '~';
        setSettings(data);
      }
      const path = data.pwd.replace('~', data.base);
      process.chdir(path);
      setSettings(data);
    } catch (err) {
      console.log('YIKES');
      console.warn(err);
      setPwd('');
    } finally {
      await fetchAll();
      setStore('lastCommand', `${new Date().toISOString()}-fetch`);
    }
  }

  const updateDirList = async () => {
    const path = settings?.pwd?.replace('~', settings.base);
    const data = getFilesInDirectory(path);
    setDirList(data);
  }

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    updateDirList();
    if (settings.pwd) {
      process.chdir(settings.pwd.replace('~', settings.base));
    }
  }, [settings.pwd]);


  const filteredList = useMemo(() => {
    if (!pwd) {
      return dirList || [];
    }
    return dirList?.filter(({ name }) => {
      return name.toLowerCase().includes(pwd.toLowerCase());
    }) || [];
  }, [pwd, settings?.pwd, dirList?.map(({ name }) => name).toString()]);

  const updatePwd = async (dir) => {
    let pwd = '';
    if (dir === '..') {
      const split = settings.pwd.split('/');
      pwd = split.slice(0, split.length - 1).join('/');
    } else {
      pwd = `${settings.pwd}/${dir}`;
    }
    const path = pwd.replace('~', settings.base);
    if (pwd) {
      process.chdir(path);
      const data = { ...settings, pwd };
      setSettings(data);
    }
    setPwd('');
  }

  const handleOpenCode = async () => {
    if (!settings?.cmds?.codeEditorCmd) {
      setDisplay(true);
    } else {
      await cmd(settings?.cmds?.codeEditorCmd);
    }
  }

  const addCommand = () => {
    if (text) {
      let data = { ...settings };
      data.cmds = { ...(data.cmds || {}), codeEditorCmd: text }
      setSettings(data);
      setText('');
      setDisplay(false);
    } else {
      console.log('NO WORK');
    }
  }

  const handleTab = useCallback((event) => {
    if (refFieldFocus.current === document.activeElement) {
      if (event.code === 'Tab') {
        event.preventDefault();
        setPwd((filteredList?.[0]?.name || pwd).trim());
      }
    }
  }, [filteredList?.[0]?.name]);

  useEffect(() => {
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [handleTab]);

  const currentPathSplit = settings?.pwd?.split('/');
  const currentPath = currentPathSplit?.slice(currentPathSplit.length - 2).join('/') || '';
  const hasMorePath = currentPathSplit?.length > 2;
  const [isGit] = useAsyncValue(() => checkGit(settings), [settings?.pwd]);

  useShortcuts({
    focusCmdBar: () => focusCmd?.current?.focus(),
    codeEditorCmd: handleOpenCode,
  }, display);

  const updatePage = () => {
    setMode((p) => {
      if (p === 'bm') {
        return 'terminal';
      } else if (p === 'terminal') {
        return 'bm';
      }
    });
  }

  return (
    <Div styles="pad" className="width: calc(100% - 32px);">
      <Div styles="padb">
        <Div styles="ai:c">
          <Div styles="ai:c fg">
            <Button styles="icon-dark" onClick={() => updatePage()}>
              {mode === 'bm' ? <Tree size={32} color="white" />
                : mode === 'terminal' ? <Monitor size={32} color="white" />
                : null
              }
            </Button>
            <Text styles="bold">{hasMorePath ? '.../' : ''}{currentPath}</Text>
          </Div>
          {focusPwd && !!filteredList.length && (
            <Div styles="flex pad absolute radius" className={css`top: 100%; left: 0; right: 0; border: 1px solid white; max-height: 80vh; overflow: auto; background-color: ${colors.black};`}>
              {filteredList.map(({ name, isFolder }) => (
                <Div styles="pad-sm ai:c hover pointer radius" key={name} onClick={() => updatePwd(name)}>
                  {isFolder
                    ? <FolderSimple color="white" size={24} weight="fill" />
                    : <File color="white" size={24} weight="fill" />
                  }
                  <Text styles="ml">{name}</Text>
                </Div>
              ))}
            </Div>
          )}
          <Button styles="icon-dark" onClick={handleOpenCode}>
            <ArrowSquareOut size={24} color="white" weight="bold" />
          </Button>
          <Button styles="icon-dark" onClick={handleOpenCode} disabled={true}>
            <Gear size={24} color="white" weight="bold" />
          </Button>
        </Div>
        <CmdBar
          settings={settings}
          setSettings={setSettings}
          setMode={setMode}
          ref={focusCmd}
        />
      </Div>

      {mode === 'bm' && (
        <>
          <Div styles="jc:sb ai:c">
            <GitGui
              isGit={isGit}
              settings={settings}
              setSettings={setSettings}
            />
          </Div>

          {!isGit && (
            <Div styles="hide-scroll" className={css`height: calc(100vh - 140px); overflow: auto; padding-bottom: 100px;`}>
              {dirList?.map((item) => (
                <Div styles="ai:c hover radius pointer" onClick={() => updatePwd(item.name)}>
                  {item.isFolder
                    ? <FolderSimple color="white" size={24} weight="fill" />
                    : <File color="white" size={24} weight="fill" />
                  }
                  <Text styles="ml-sm pad-xs">{item.name}</Text>
                </Div>
              ))}
            </Div>
          )}

          {display && (
            <Div styles="modal pad" className="width: 450px;">
              <Text styles="h3 center" color={colors.black}>Code Editor Command</Text>
              <Div styles="jc:sa ai:c pad">
                <Text color={colors.black}>Command</Text>
                <Input styles="ml fg" value={text} onChange={(e) => { e.stopPropagation(); setText(e.target.value); }} />
              </Div>
              <Div styles="jc:r ">
                <Button styles="text" color={colors.black} onClick={() => setDisplay(false)}>Close</Button>
                <Button styles="ml" onClick={addCommand}>Add Command</Button>
              </Div>
            </Div>
          )}
        </>
      )}

      <Terminal
        setMode={setMode}
        display={mode ==='terminal'}
      />

    </Div>
  );
}

export default App;
