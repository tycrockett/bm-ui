import { useEffect } from "react";

export const useTerminalActions = (value) => {
  const { store, feeds, feedUpdatedAt, methods } = value;

  const handleTerminalItem = () => {
    const pwdFeeds = Object.entries(
      feeds?.current?.list?.[store?.settings?.pwd] || {}
    );

    const fileMatch =
      /([a-zA-Z]:\\|\.{1,2}\/|\/)?([\w\s-]+[\/\\])*[\w\s-]+\.\w+/g;
    let processActions = {};
    for (const [pid, terminal] of pwdFeeds) {
      console.log(terminal);
      const item = terminal?.output?.at(-1);
      if (!item) {
        return;
      }
      if (item?.message?.includes("[eslint]")) {
        const split = item?.message?.split("\n")?.filter((item) => item);
        const firstIndex = split.findIndex((item) => item.includes("[eslint]"));

        let indices = [];
        for (let i = firstIndex + 1; i < split.length; i++) {
          if (fileMatch.test(split[i])) {
            indices.push(i);
          }
        }

        let paths = [];
        const path = store?.settings?.pwd?.replace("~", store?.settings?.base);
        for (let i = 0; i < indices.length; i++) {
          const file = split[indices[i]];
          for (let j = indices[i]; j < split.length; j++) {
            if (split[j].includes("Line")) {
              const ss = split[j].split(" ").slice(5);
              const s = split[j].split(" ")?.[3];
              const line = s.split(":")?.[0];
              const column = s.split(":")?.[1];
              const label = `${file}:${line}:${column}`;
              paths.push({
                type: "eslint",
                label,
                description: ss.join(" "),
                cmd: `open -n -b "com.microsoft.VSCode" --args -g "${path}/${file}:${line}"`,
              });
            }
          }
        }
        processActions = {
          ...processActions,
          [pid]: {
            command: terminal.output[0]?.message,
            actions: paths,
          },
        };
      } else if (item?.message?.includes("ERROR in")) {
        const split = item?.message?.split("\n")?.filter((item) => item);
        const firstIndex = split.findIndex((item) => item.includes("ERROR in"));

        // let indices = [];
        // for (let i = firstIndex + 1; i < split.length; i++) {
        //   if (fileMatch.test(split[i])) {
        //     indices.push(i);
        //   }
        // }
      }
    }
    // setTerminalActions(processActions);
    const count = Object.values(processActions)?.reduce((prev, item) => {
      return prev + item?.actions?.length;
    }, 0);
    methods.set("terminal", { actions: processActions, count });
  };

  useEffect(() => {
    handleTerminalItem();
  }, [store?.settings?.pwd, feedUpdatedAt]);

  // useEffect(() => {
  //   const feed =
  //     feeds?.current?.list?.[store?.settings?.pwd]?.[feeds?.current?.selected];
  //   const relevantTerminals = Object.values(terminal.children).filter(
  //     (process) => feed?.pids?.includes(process.pid)
  //   );
  //   handleTerminalItem(relevantTerminals);
  // }, [terminal.children, terminal?.updatedAt, store?.settings.pwd]);
};
