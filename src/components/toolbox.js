import { css } from "@emotion/css";
import { ArrowSquareOut, X } from "phosphor-react";
import { toast } from "react-toastify";
import { useStore } from "../context/use-store";
import { useStateSync } from "../hooks/use-state-sync";
import { write } from "../node/fs-utils";
import { cmd } from "../node/node-exports";
import { Button } from "../shared-styles/button";
import { Div } from "../shared-styles/div";
import { Input } from "../shared-styles/input";
import { Text } from "../shared-styles/text";

export const linkOutLocalBuild = async (localBuildDomain) => {
  const text = await navigator.clipboard.readText();
  try {
    const url = new URL(text);
    const nextUrl = `${localBuildDomain}${url?.pathname}`;
    await cmd(`open "${nextUrl}"`);
  } catch (err) {
    console.warn(err);
    toast.error(`Error getting local link`);
    toast.info(`Copied: ${text}`);
  }
}

export const Toolbox = ({ onClose }) => {

  const { store: { settings, cacheKey, localBuildDomain }, setStore } = useStore();

  const updateSettings = (updates) => {
    const data = { ...settings, ...updates };
    if (cacheKey) {
      write(`${cacheKey}/settings.json`, data);
    }
    setStore('settings', data);
  }

  const [localDomain, setLocalDomain] = useStateSync(localBuildDomain, [localBuildDomain]);
  const [bmCodePath, setBmCodePath] = useStateSync(settings?.bmCodePath, [settings?.bmCodePath]);

  const openBmCodePath = async () => {
    const path = bmCodePath.replace('~', settings.base);
    const bmEditorCmd = settings?.cmds?.codeEditorCmd?.replace('$PWD', path);
    try {
      await cmd(bmEditorCmd);
    } catch (err) {
      console.warn(err);
      toast.error(`Error...`);
    }
  }

  return (
    <Div styles="modal" onClose={onClose}>
      <Div className={css`width: 100vw; height: 100vh;`}>
        <Div styles="jc:sb ai:c" className={css`padding: 32px;`}>
          <Text styles="h1">Toolbox</Text>
          <Button styles="icon" onClick={onClose}><X /></Button>
        </Div>

        <Div styles="jc:sb ai:c" className={css`padding: 8px 32px;`}>
          <Text>Open BM-UI Code</Text>
          <Div styles="ai:c" className={css`width: 50%;`}>
            <Input
              className={css`margin-right: 16px; width: 100%;`}
              value={bmCodePath}
              onChange={(event) => setBmCodePath(event.target.value)}
              onBlur={() => updateSettings({ bmCodePath })}
            />
            <Button onClick={() => openBmCodePath(localBuildDomain)}><ArrowSquareOut /></Button>
          </Div>
        </Div>

        <Div styles="jc:sb ai:c" className={css`padding: 8px 32px;`}>
          <Text>Local Build Link Opener</Text>
          <Div styles="ai:c" className={css`width: 50%;`}>
            <Input
              className={css`margin-right: 16px; width: 100%;`}
              value={localDomain}
              onChange={(event) => setLocalDomain(event.target.value)}
              onBlur={() => setStore('linkOutLocalBuild', localDomain)}
            />
            <Button onClick={() => linkOutLocalBuild(localBuildDomain)}><ArrowSquareOut /></Button>
          </Div>
        </Div>
      </Div>
    </Div>
  );

}