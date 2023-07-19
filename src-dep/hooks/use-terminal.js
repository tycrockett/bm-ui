import { useEffect } from "react";
import { toast } from "react-toastify";
import { useStore } from "../context/use-store";
const { spawn } = window.require('child_process');

export const useTerminal = () => {

  const { store: { sessions, output = [], sessionIdx }, setStore } = useStore();
  const pwd = process.cwd().split('/').at(-1);

  const updateSessions = (sessions) => {
    setStore('sessions', sessions);
    localStorage.setItem(`sessions`, JSON.stringify(sessions));
  }

  const updateOutputs = (pid, data) => {
    setStore('output', [{ pid, data }, ...output ]);
  }

  const cleanupSessions = () => {
    const storage = localStorage.getItem('sessions');
    const sessions = JSON.parse(storage) || [];
    let list = [];
    for (const session of sessions) {
      try {
        process.kill(session.pid, 0)
        list.push(session);
      } catch {
        toast.warn(`Killed ${session.pwd} - ${session.cmd}`);
      }
    }
    updateSessions(list);
  }

  useEffect(() => {
    cleanupSessions();
  }, []);

  const killSession = (session) => {
    updateOutputs('', `killing "${session.cmd}"...`);
    try {
      process.kill(-session.pid, 'SIGTERM');
      process.kill(-session.pid, 'SIGKILL');
      updateOutputs('', `Successfully killed "${session.cmd}"`);
      const list = sessions.filter(({ pid }) => pid !== session.pid);
      updateSessions(list);
    } catch (err) {
      console.log(err);
      updateOutputs('', `Error killing "${session.cmd}"`);
    }
  }

  const submit = async (cmd) => {
    const [command, ...args] = cmd.split(' ');
    updateOutputs('', cmd);
    if (command === 'clear') {
      console.clear();
      setStore('output', []);
    } else if (command === 'kill') {
      let session = null;
      if (!args.length) {
        session = sessions[sessionIdx]
      }
      if (session) {
        killSession(session);
      }
    } else {
      const worker = spawn(cmd, args, { shell: '/bin/zsh', detached: true });
      const pid = worker.pid;
      const sessionsByPwd = sessions.reduce((p, i) => i.pwd === pwd && i.cmd === cmd ? p + 1 : p, 0);
      const list = [...sessions, { cmd, pid, pwd, sessionsByPwd }];
      updateSessions(list);
      worker.stdout.on('data', (data) => updateOutputs(pid, `${data}`));
      worker.stderr.on('data', (data) => updateOutputs(pid, `${data}`));
      worker.on('error', (data) => updateOutputs(pid, `${data}`));
      worker.on('exit', () => {
        worker.stdin.end();
        worker.stdout.destroy();
        worker.stderr.destroy();
      });
    }
  }

  return { submit, killSession }

}