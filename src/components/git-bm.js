import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { css } from "@emotion/css";
import { format } from "date-fns";
import { ArrowLeft, CloudCheck, CloudSlash, Download, FileArrowUp, FileDotted, FileX, Trash, X } from "phosphor-react";
import { toast } from "react-toastify";
import { useStore } from "../context/use-store";
import { useAsyncValue } from "../hooks/use-async-value";
import { cmd } from "../node/node-exports";
import { Button } from "../shared-styles/button";
import { Div } from "../shared-styles/div";
import { Input } from "../shared-styles/input";
import { Select } from "../shared-styles/Select";
import { colors } from "../shared-styles/styles";
import { Text } from "../shared-styles/text";
import { checkoutBranch, deleteBranch, fetch, getBranches, hasRemoteBranch, logCommits, openRemote, push, update } from "./git-utils";
const fs = window.require('fs');
const chokidar = window.require('chokidar');
const parse = require('parse-gitignore');

const loaderStyle = css`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1.5s linear infinite;
`;

const getStatus = async () => {
  try {
    const promises = await Promise.allSettled([
      cmd(`git ls-files --others --exclude-standard`),
      cmd(`git ls-files --deleted`),
      cmd(`git ls-files --modified`),
      cmd(`git diff --numstat`),
    ]);
    const keys = ['untracked', 'deleted', 'modified'];

    let prev = { lastUpdate: new Date().toISOString() };

    for (let idx = 0; idx < promises.length; idx++) {
      const item = promises[idx];
      if (item.status === 'fulfilled') {
        const value = (item?.value?.split('\n') || []).filter((v) => !!v);
        if (idx < 3) {
          if (idx === 0) {
            let fileCount = {};
            for (const filename of value) {
              let data = await cmd(`wc -l ${filename}`);
              data = data.replace(/\n/g, '')
              data = data.split(' ').filter((v) => !!v);
              const [count, file] = data;
              fileCount = { ...fileCount, [file]: Number(count) + 1 };
            }
            prev = { ...prev, fileCount }
          } else if (idx === 2) {
            const list = value.filter((item) => (!prev.deleted.includes(item)));
            prev = { ...prev, [keys[idx]]: list }
            continue;
          }
          prev = { ...prev, [keys[idx]]: value }
          continue;
        } else {
          const files = value.reduce((p, item) => {
            const [adds, deletes, filename] = item.split('\t');
            return { ...p, [filename]: { adds, deletes } }
          }, {});
          prev = { ...prev, files }
        }
      }
    }
    return prev;

  } catch (err) {
    console.log(err);
    return {
      untracked: [],
      modified: [],
      deleted: [],
      lastUpdate: ''
    };
  }
  // { untracked, modified, deleted };
}

export const GitBm = ({ pwd }) => {

  const [watcher, setWatcher] = useState('');

  useEffect(() => {
    let watcher = null;
    if (pwd) {
      try {
        setWatcher(new Date().toISOString());
        const ignore = parse(fs.readFileSync('.gitignore')) || [];
        watcher = chokidar.watch('.', { ignored: [...ignore.patterns, /(^|[\/\\])\../], ignoreInitial: true, }).on('all', (event, path) => {
          setWatcher(new Date().toISOString());
        });
      } catch (err) {
        console.log(err);
      }
    }
    return () => watcher?.close();
  }, [pwd]);

  const ref = useRef();
  const { store: { settings = {}, repos, lastCommand = '' }, setStore } = useStore();
  const [branches] = useAsyncValue(getBranches, [pwd, lastCommand]);
  const defaultBranch = repos?.[settings?.pwd]?.defaultBranch;
  const [display, setDisplay] = useState(false);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(null);
  const [tab, setTab] = useState('status');

  const [diff, setDiff] = useState({ path: '', lines: [] });

  const updateLast = (value) => {
    const last = `${new Date().toISOString()}-${value}`;
    setStore('lastCommand', last);
  }

  const getLogs = useCallback(() => logCommits(defaultBranch), [defaultBranch]);
  const [hasRemote] = useAsyncValue(() => hasRemoteBranch(branches?.current || ''), [pwd, branches?.current, lastCommand]);
  const [status] = useAsyncValue(getStatus, [lastCommand, watcher, tab]);
  const [logs] = useAsyncValue(getLogs, [lastCommand, defaultBranch, tab]);

  useEffect(() => {
    if (lastCommand.endsWith('status')) {
      setTab('status');
      setDiff({ path: '', lines: [] });
    } else if (lastCommand.endsWith('log')) {
      setTab('logs');
    }
  }, [lastCommand]);

  const [lastFetch, setLastFetch] = useState(null);

  const updateFetch = async () => {
    try {
      const success = await fetch();
      if (success) {
        setLastFetch(`Last Auto-Fetch ${format(new Date(), 'h:mm a')}`);
        const timestamp = `${new Date().toISOString()}-fetch`;
        setStore('lastCommand', timestamp);
      }
    } catch (err) {
      console.warn(err);
      setLastFetch('ERROR');
    }
  }

  useEffect(() => {
    updateFetch();
    setInterval(() => {
      updateFetch();
    }, 1000 * 60);
  }, []);

  const handleCheckout = async (event) => {
    const current = event.target.value;
    const success = await checkoutBranch(current, defaultBranch);
    if (success) {
      updateLast('checkout');
    } else {
      toast.error(`Failed to checkout ${current}`);
    }
  }

  const handleDelete = async () => {
    const success = await deleteBranch(defaultBranch);
    if (!success) {
      toast.error(`Failed to delete ${branches?.current}`);
    } else {
      updateLast('delete');
    }
  }

  const handleRemote = async () => {
    if (hasRemote) {
      const success = await openRemote();
      if (!success) {
        toast.error(`Failed to open remote branch.`);
      } else {
        updateLast('remote');
      }
    } else {
      setLoading('remote');
      const success = await push('-su');
      if (!success) {
        toast.error(`Failed to set upstream for ${branches?.current}`);
      } else {
        updateLast('push');
      }
      setLoading(null);
    }
  }

  const handleUpdate = async () => {
    setLoading('update');
    const success = await update(defaultBranch, '');
    if (!success) {
      toast.error(`Failed to update.`);
    } else {
      updateLast('update');
    }
    setLoading(null);
  }

  const handleDiff = async (path) => {
    const lineCount = (await cmd(`wc -l ${path}`)).trim().split(' ')[0];
    const value = `git diff --no-prefix -U${lineCount} ${defaultBranch} ./${path}`;
    let diffs = await cmd(value);
    diffs = diffs.replace(/@@.*@@/g, '');
    diffs = diffs.split(/\n/g).slice(5);

    let lines = [];
    let index = null;
    for (let idx = 0; idx < diffs.length; idx++) {
      const hasChange = diffs[idx].startsWith('+') || diffs[idx].startsWith('-');
      if (index === null && hasChange) {
        index = Math.max(0, idx - 2);
      } else if (index != null && !hasChange) {
        const list = diffs.slice(index, idx + 2);
        idx = idx + 2;
        lines = [...lines, `>>>>> Lines: ${index + 1}-${idx + 3}`, ...list, ''];
        index = null;
      }
    }

    setDiff({ path, lines });
  }

  const lineChanges = useMemo(() => {
    const files = Object.values(status?.files || {});
    const { adds, deletes } = files.reduce((prev, item) => {
      return { adds: prev.adds + Number(item.adds), deletes: prev.deletes + Number(item.deletes) }
    }, { adds: 0, deletes: 0 });
    const fileCount = Object.values(status?.fileCount || {}).reduce((p, v) => p + Number(v), 0);
    return {
      adds: adds + fileCount,
      deletes
    }
  });

  const shortStatus = useAsyncValue(async () => (
    await cmd(`git diff ${defaultBranch}...${branches?.current || ''} --stat | tail -n1 `)
  ));

  // const noStatus = useAsyncValue(async () => {
  //   const no = await cmd(`git diff --name-only ${defaultBranch}`);
  //   console.log(no);
  //   return no.split('\n');
  // });
  const noStatus = [];

  return (
    <Div styles="relative">
      <Div styles="jc:sb ai:c">
        <Div styles="ai:c">
          <Select
            styles="dark"
            value={branches?.current || ''}
            onChange={handleCheckout}
            disabled={!branches?.list?.length}
            ref={ref}
          >
            {branches?.list?.map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </Select>
          <Button styles="icon-dark ml-sm" onClick={handleRemote}>
            {!!loading ? <div className={loaderStyle} />
              : hasRemote
                ? <CloudCheck color={colors.green} size={24} />
                : <CloudSlash color={colors.red} size={24} />
            }
          </Button>
          <Button styles="icon-dark" onClick={handleDelete} disabled={!!loading}>
            <Trash color="white" size={24} />
          </Button>
          <Button styles="icon-dark" onClick={handleUpdate} disabled={!!loading}>
            <Download color="white" size={24} />
          </Button>
        </Div>
        <Text>{lastFetch}</Text>
      </Div>

      {display && (
        <Div styles="modal pad" className="width: 450px;">
          <Text styles="h3 center" color={colors.black}>Set Upstream Command</Text>
          <Div styles="jc:sa ai:c pad">
            <Text color={colors.black}>Command</Text>
            <Input styles="ml fg" value={text} onChange={(e) => setText(e.target.value)} />
          </Div>
          <Div styles="jc:r ">
            <Button styles="text" color={colors.black} onClick={() => setDisplay(false)}>Close</Button>
            <Button styles="ml">Add Command</Button>
          </Div>
        </Div>
      )}
      <Div className={css`border-bottom: 1px solid #666;`}>
        <Div styles="flex mt padb">
          <Button styles={tab === 'status' ? '' : 'hover text radius'} onClick={() => setTab('status')}>Status</Button>
          <Button styles={tab === 'logs' ? '' : 'text hover radius'} onClick={() => setTab('logs')}>Logs</Button>
        </Div>
        <Text styles="mb">{shortStatus}</Text>
      </Div>
      <Div styles="hide-scroll" className={css`overflow: auto; max-height: calc(100vh - 380px); padding-bottom: 100px;`}>

        {tab === 'logs' && (
          <Div styles="mt">
            {!Object.keys(logs || {})?.length ? <Text styles="ml-sm">No commit logs.</Text> : (
              Object.entries(logs).map(([key, values]) => {
                const split = key.split(' ');
                const hash = split[0];
                const title = split.slice(1).join(' ');
                return (
                  <Div key={key} styles="pad-sm oa">
                    <Div styles="ai:c mb-xs">
                      <Text styles="bold selected pad-sm padv-xs">{hash}</Text>
                      <Text as="span" styles="ml-sm">{title}</Text>
                    </Div>
                    {values?.map((file) => (
                      <Div styles="jc:sb ai:c hover radius pointer">
                        <Text key={file} styles="pad-xs padl">{file}</Text>
                        <Div styles="flex">
                          <Button styles="icon-dark">
                            <X color="white" />
                          </Button>
                        </Div>
                      </Div>
                    ))}
                  </Div>
                )
              })
            )}
          </Div>
        )}

        {tab === 'status' && (
          !diff?.path ? (
            <Div styles="mt">

              {!status?.untracked?.length && !status?.deleted?.length && !status?.modified?.length ? (
                <Div styles="jc:sb ai:c">
                  <Text styles="ml-sm">No changes detected.</Text>
                  {status?.lastUpdate && (
                    <Text>updated at {format(new Date(status?.lastUpdate), 'h:mm a')}</Text>
                  )}
                </Div>
              ) : (
                <Div styles="jc:sb ai:c mb">
                  <Text styles="ml-sm">Updated at {format(new Date(status?.lastUpdate), 'h:mm a')}</Text>
                  <Div styles="flex right">
                    <Text styles="ml-sm" color={colors.lightGreen}>+{lineChanges?.adds}</Text>
                    <Text className={css`width: 70px;`} styles="ml-sm" color={colors.lightRed}>-{lineChanges?.deletes}</Text>
                  </Div>
                </Div>
              )}

              <Div>

                <Div>
                  {noStatus?.map((item) => (
                    <Text styles="mt">{item}</Text>
                  ))}
                </Div>

                {!!status?.untracked?.length && (
                  <Div styles="radius padv-sm">
                    <Div styles="ai:c">
                      <FileDotted size={24} color={colors.lightBlue} />
                      <Text styles="padh-xs bold" color={colors.lightBlue}>Untracked</Text>
                    </Div>
                    <Div styles="flex wrap radius" >
                      {status?.untracked?.map((item) => (
                        <Div
                          key={item}
                          styles="jc:sb ai:c pad-xs full-width radius no-word-wrap hover pointer"
                          className={css`padding-right: 0;`}
                        >
                          <Text>{item}</Text>
                          <Text color={colors.lightBlue}>+{status?.fileCount?.[item]}</Text>
                        </Div>
                      ))}
                    </Div>
                  </Div>
                )}

                {!!status?.deleted?.length && (
                  <Div styles="radius padv-sm">
                    <Div styles="ai:c">
                      <FileX size={24} color={colors.lightRed} />
                      <Text styles="padh-xs bold" color={colors.lightRed}>Deleted</Text>
                    </Div>
                    <Div styles="flex wrap radius">
                      {status?.deleted?.map((item) => (
                        <Div
                          key={item}
                          styles="jc:sb ai:c pad-xs full-width radius no-word-wrap hover pointer"
                          className={css`padding-right: 0;`}
                        >
                          <Text>{item}</Text>
                          {item in (status?.files || {}) && (
                            <Div styles="flex right">
                              <Text color={colors.lightGreen}>+{status?.files?.[item]?.adds}</Text>
                              <Text className={css`width: 70px;`} styles="ml-sm" color={colors.lightRed}>-{status?.files?.[item]?.deletes}</Text>
                            </Div>
                          )}
                        </Div>
                      ))}
                    </Div>
                  </Div>
                )}

                {!!status?.modified?.length && (
                  <Div styles="radius padv-sm">
                    <Div styles="ai:c">
                      <FileArrowUp size={24} color={colors.lightGreen} />
                      <Text styles="padh-xs bold" color={colors.lightGreen}>Modified</Text>
                    </Div>
                    <Div styles="flex wrap radius">
                      {status?.modified?.map((item) => (
                        <Div
                          key={item}
                          onClick={() => handleDiff(item)}
                          styles="jc:sb ai:c pad-xs full-width radius no-word-wrap hover pointer"
                          className={css`padding-right: 0;`}
                        >
                          <Text>{item}</Text>
                          {item in (status?.files || {}) && (
                            <Div styles="flex right">
                              <Text color={colors.lightGreen}>+{status?.files?.[item]?.adds}</Text>
                              <Text className={css`width: 70px;`} styles="ml-sm" color={colors.lightRed}>-{status?.files?.[item]?.deletes}</Text>
                            </Div>
                          )}
                        </Div>
                      ))}
                    </Div>
                  </Div>
                )}
              </Div>
            </Div>
          ) : (
            <Div color="white" styles="mt">
              <Div styles="ai:c mb">
                <Button styles="icon-dark" onClick={() => setDiff({})}>
                  <ArrowLeft size={32} color="white" />
                </Button>
                <Text styles="ml">{diff.path}</Text>
              </Div>
              <Div className={css`overflow: auto;`}>
                {diff?.lines?.map((line, idx) => (
                  <pre key={line + idx} className={css`margin: 0; padding: 0; color: white; ${line.startsWith('>>>>> Lines: ') ? `color: black; background-color: ${colors.lightBlue};` : line.startsWith('+') ? `color: ${colors.lightGreen};` : line.startsWith('-') ? `color: ${colors.lightRed};` : ''};`}>
                    {line}
                  </pre>
                ))}
              </Div>
            </Div>
          ))}
      </Div>

    </Div >
  );

}