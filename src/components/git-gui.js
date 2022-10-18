import { css } from "@emotion/css";
import { CloudCheck, CloudSlash, GitBranch } from "phosphor-react";
import { useEffect, useState } from "react";
import { useStore } from "../context/use-store";
import { read, write } from "../node/fs-utils";
import { Button } from "../shared-styles/button";
import { Div } from "../shared-styles/div";
import { Input } from "../shared-styles/input";
import { colors } from "../shared-styles/styles";
import { Text } from "../shared-styles/text";
import { GitBm } from "./git-bm";
import { getCurrentBranch } from "./git-utils";

export const GitGui = ({ isGit, settings }) => {

  const { store: { repos = {} }, setStore } = useStore();

  const setRepos = (repos) => {
    if (settings.base) {
      write(`${settings.base}/bm-cache/repos.json`, repos);
    }
    setStore('repos', repos);
  }

  const [display, setDisplay] = useState(false);
  const [defaultBranch, setDefaultBranch] = useState('main');
  const [currentBranch, setCurrentBranch] = useState('');
  
  const repo = settings.pwd in repos ? repos[settings.pwd] : {};
  const isBm = !!repo.defaultBranch;

  const fetchCurrentBranch = async () => {
    const branch = await getCurrentBranch();
    setCurrentBranch(branch);
  }

  useEffect(() => {
    const data = read(`${settings.base}/bm-cache/repos.json`, {});
    setRepos(data);
    fetchCurrentBranch();
  }, [settings.pwd]);

  const initBM = () => {
    let data = { ...repos };
    data[settings.pwd] = { defaultBranch }
    if (settings.base) {
      write(`${settings.base}/bm-cache/repos.json`, data);
    }
    setRepos(data);
    setDisplay(false);
    setDefaultBranch('main');
  }

  return (
    <Div styles="full-height full-width">
      {(isGit && !isBm) && (
        <Div styles="fd:c jc:c ai:c" className={css`padding-top: 10vh;`}>
          <Div styles="jc:c ai:c">
            <GitBranch size={100} weight="bold" color="white" />
            <Text styles="h1">Detected git repository, <br /> would you like to initialize BM?</Text>
          </Div>
          <Button styles="mt padh-lg padv" onClick={() => setDisplay(!display)}>
            Initialize
          </Button>
        </Div>
      )}

      {isGit && isBm && (<GitBm pwd={settings?.pwd || ''} currentBranch={currentBranch} />)}

      {display && (
        <Div styles="modal pad-lg">
          <Text styles="h3" color={colors.black}>Initialize BM</Text>
          <Div styles="jc:sa ai:c pad">
            <Text color={colors.black}>Default Branch</Text>
            <Input styles="ml" value={defaultBranch} onChange={(e) => setDefaultBranch(e.target.value)} />
          </Div>
          <Div styles="jc:r">
            <Button styles="mr text" color={colors.black}>Cancel</Button>
            <Button color="white" bgColor={colors.black} onClick={initBM}>Initialize</Button>
          </Div>
        </Div>
      )}
    </Div>
  );
}