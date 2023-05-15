import { css } from "@emotion/css";
import { ArrowSquareOut, X } from "phosphor-react";
import { toast } from "react-toastify";
import { useStore } from "../context/use-store";
import { cmd } from "../node/node-exports";
import { Button } from "../shared-styles/button";
import { Div } from "../shared-styles/div";
import { Input } from "../shared-styles/input";
import { Text } from "../shared-styles/text";

export const linkOutLocalBuild = async (localBuildDomain) => {
  const text = await navigator.clipboard.readText();
  console.log(text);
  // https://app.be-brite.com/2b1f40ae-ff38-424f-8b9f-1ba0dd4f213a/packages
  try {
    const url = new URL(text);
    const nextUrl = `${localBuildDomain}${url?.pathname}`;
    await cmd(`open "${nextUrl}"`);
  } catch (err) {
    console.warn(err);
    toast.error(`Error getting local link`);
    toast.info(text);
  }
}

export const Toolbox = ({ onClose }) => {

  const { store: { localBuildDomain }, setStore } = useStore();
  const setLocalBuildDomain = (value) => setStore('linkOutLocalBuild', value);

  return (
    <Div styles="modal" onClose={onClose}>
      <Div className={css`width: 100vw; height: 100vh;`}>
        <Div styles="jc:sb ai:c" className={css`padding: 32px;`}>
          <Text styles="h1">Toolbox</Text>
          <Button styles="icon" onClick={onClose}><X /></Button>
        </Div>
        

        <Div styles="jc:sb ai:c" className={css`padding: 32px;`}>
          <Text>Local Build Link Opener</Text>
          <Div styles="ai:c" className={css`width: 50%;`}>
            <Input
              className={css`margin-right: 16px; width: 100%;`}
              value={localBuildDomain}
              onChange={(event) => setLocalBuildDomain(event.target.value)}
            />
            <Button onClick={() => linkOutLocalBuild(localBuildDomain)}><ArrowSquareOut /></Button>
          </Div>
        </Div>
      </Div>
    </Div>
  );

}