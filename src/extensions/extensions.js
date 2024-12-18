import { useContext, useEffect, useState } from "react";
import { Button, colors, Div, Input, Modal, Text } from "../shared";
import { flex } from "../shared/utils";
import {
  addCommitPush,
  checkoutBranch,
  clearBranch,
  createBranch,
  deleteBranch,
  fetch,
  handleFile,
  pruneLocalBranches,
  push,
  renameBranch,
  restoreBranch,
  stash,
  update,
} from "../git/utils";
import { StoreContext } from "../context/store";
import { toast } from "react-toastify";

export const Extensions = () => {
  const context = useContext(StoreContext);
  const {
    store: { extensions },
  } = context;

  const [extension, setExtension] = useState(null);

  const handleCmd = (cmd) => {
    if (cmd?.executionType === "command") {
      setExtension(cmd);
    } else if (cmd?.executionType === "click") {
      cmd?.function?.({ context });
    }
  };

  return (
    <Div
      css={`
        padding: 16px;
      `}
    >
      <Input
        placeholder="Search"
        css={`
          margin: 8px 0;
          width: calc(100% - 16px);
        `}
      />

      <Div
        css={`
          margin-top: 16px;
          background-color: ${colors.darkIndigo};
          border-radius: 16px;
          padding: 8px 0;
          box-sizing: border-box;
          overflow: hidden;
        `}
      >
        {extensions?.map((cmd) =>
          cmd?.hideExtension ? null : (
            <Div
              css={`
                background-color: ${colors.darkIndigo};
                padding: 8px 16px;
                :hover {
                  background-color: rgba(0, 0, 0, 0.5);
                  transition: background-color 0.2s ease;
                  cursor: pointer;
                }
              `}
              onClick={() => handleCmd(cmd)}
            >
              <Text bold>{cmd?.name}</Text>
              <Text
                css={`
                  padding-top: 4px;
                  font-size: 0.9em;
                  color: ${colors.lightBlue};
                `}
              >
                {cmd?.description}
              </Text>
            </Div>
          )
        )}
      </Div>

      {extension?.executionType === "form" ? (
        <ExtensionForm
          context={context}
          extension={extension}
          exitExtension={() => setExtension(null)}
        />
      ) : null}
    </Div>
  );
};

const ExtensionForm = ({ context, extension, exitExtension }) => {
  const [form, setForm] = useState({});
  const [errors, setErrors] = useState({});

  const handleValidation = () => {
    const errors = extension?.formInputs?.reduce((prev, item) => {
      const value = form[item?.accessorKey];
      const validator = !("validator" in item) || item?.validator(value);
      return { ...prev, [item?.accessorKey]: validator };
    }, {});
    setErrors(errors);
  };

  const initializeForm = () => {
    const formData = extension?.formInputs?.reduce((prev, item) => {
      console.log(item?.defaultValue);
      return {
        ...prev,
        [item?.accessorKey]: item?.defaultValue ?? "",
      };
    }, {});
    setForm(formData);
  };

  useEffect(() => {
    initializeForm();
  }, []);

  const executeExtension = async (e) => {
    e.preventDefault();
    if (typeof extension.function === "function") {
      try {
        await extension.function({
          form,
          context,
        });
        exitExtension();
      } catch {}
    }
  };

  return (
    <Modal
      css={`
        width: 400px;
        background-color: white;
        padding: 32px;
      `}
    >
      <Div
        css={`
          ${flex("space-between")}
          margin-bottom: 24px;
        `}
      >
        <Text h2>{extension?.name}</Text>
      </Div>
      <form onSubmit={executeExtension}>
        {extension?.formInputs?.map(({ label, accessorKey }) => (
          <Div
            css={`
              margin: 8px 0;
            `}
          >
            <Text
              css={`
                margin-bottom: 8px;
              `}
            >
              {label}
            </Text>
            <Input
              css={`
                width: calc(100% - 16px);
              `}
              value={form?.[accessorKey]}
              onChange={(e) =>
                setForm({ ...form, [accessorKey]: e.target.value })
              }
              onBlur={handleValidation}
            />
            {!errors?.[accessorKey]?.isValid ? (
              <Text
                css={`
                  font-size: 0.9em;
                  margin-top: 4px;
                  color: #faa;
                `}
              >
                {errors?.[accessorKey]?.message}
              </Text>
            ) : null}
          </Div>
        ))}
        <Div
          css={`
            ${flex("right")}
            margin-top: 24px;
          `}
        >
          <Button
            secondary
            css={`
              margin-right: 16px;
            `}
            onClick={() => exitExtension()}
          >
            Cancel
          </Button>
          <Button type="submit">OK</Button>
        </Div>
      </form>
    </Modal>
  );
};

const defaultCommands = [
  {
    name: "Update",
    command: "update",
    args: "",
    flags: "",
    description:
      "1. Checkout parent branch\n2. Pull parent origin\n3. Merges the parent branch into the current branch.",
    function: async ({ command, context }) => {
      await update(command.options);
    },
  },

  {
    name: "Push",
    command: "push",
    args: "",
    flags: "-f --force",
    description:
      "if no remote branch exists, set the upstream branch.\ngit push",
    function: async ({ command, context }) => {
      await push(command.options);
    },
  },

  {
    name: "Add + Commit + Push",
    command: ".",
    args: '{./path}  |  "{commitMessage}"',
    flags: "",
    description: `1. git add {path}\n2. git commit -m {commitMessage} \n3. git push, if a remote branch is detected.\n\n". {commitMessage}" or "./path/to/file {commitMessage}"`,
    function: async ({ command, context }) => {
      const matches = [...(command?.raw?.match(/"([^"]*)"/g) || [])];
      if (matches?.length !== 1) {
        return toast.error("Invalid commit message");
      }
      const description = matches?.join(" ") || "";
      await addCommitPush(command.value, description, command.options);
    },
  },

  {
    name: "New",
    command: "new",
    args: "{branch}",
    flags: "-p --parent | --disable-pull",
    description:
      "1. git checkout default branch (-p skips this step)\n2. git pull, if a remote branch exists (--disable-pull skips this step)\n3. git branch {branch}\n4. git checkout {branch}\n------------------------------------------\n\nNOTE 1: Unlike git, BMUI uses a 'parent' branch to know which branch to automatically pull and merge when using the 'update' command. BMUI will use the 'defaultBranch' unless you use the -p flag. -p will set the 'parent' branch to whatever branch you have currently checked out.\n\nNOTE 2: If there are any uncommitted changes on the branch you're currently on, it will first *clear them and re-apply them after creation. \n\n*See 'clear' command",
    function: async ({ command, context }) => {
      await createBranch(command.args[0], command.options);
      const parentFlag =
        command.options?.flags?.includes("--parent") ||
        command.options?.flags?.includes("-p");
      const parentBranch = parentFlag
        ? command.options?.currentBranch
        : command.options?.defaultBranch;
      context.methods.setRepos({
        ...context.store?.repos,
        [context.store?.settings?.pwd]: {
          ...context.store?.repos?.[context.store?.settings?.pwd],
          branches: {
            ...(context.store?.repos?.[context.store?.settings?.pwd]
              ?.branches || {}),
            [command.args[0]]: {
              parentBranch,
              createdAt: new Date().toISOString(),
            },
          },
        },
      });
    },
  },

  {
    name: "Clear",
    command: "clear",
    args: "",
    flags: "",
    description: "1. git add .\n2. git stash",
    function: async ({ command, context }) => {
      await clearBranch(command.options);
    },
  },

  {
    name: "Checkout",
    command: "checkout",
    args: "{branch}",
    flags: "",
    description: "git checkout {branch}.",
    function: async ({ command }) => {
      await checkoutBranch(command.filteredBranchList?.[0], command.options);
      fetch();
    },
  },

  {
    name: "Delete",
    command: "delete",
    args: "",
    flags: "-r --remote",
    description:
      "Delete the current branch.\n\n-r --remote: Deletes the remote branch as well.",
    function: async ({ command, context }) => {
      await deleteBranch(command.options);
      let nextBranches =
        context.store?.repos?.[context.store?.settings?.pwd]?.branches;
      if (nextBranches?.[command.options?.currentBranch]) {
        try {
          delete nextBranches[command.options.currentBranch];
          context.methods.setRepos({
            ...context.store?.repos,
            [context.store?.settings?.pwd]: {
              ...context.store?.repos?.[context.store?.settings?.pwd],
              branches: nextBranches,
            },
          });
        } catch (err) {
          throw err;
        }
      }
    },
  },

  {
    name: "Prune",
    command: "prune",
    args: "",
    flags: "-b --branches",
    description:
      "--branches: deletes all local branches without a detected remote branch.",
    function: async ({ command, context }) => {
      const flags = command?.options?.flags;
      if (flags.includes("--branches") || flags.includes("-b")) {
        await pruneLocalBranches(command?.branches, command?.options);
      }
    },
  },

  {
    name: "Stash",
    command: "stash",
    args: "",
    flags: "-a --apply",
    description: "git stash",
    function: async ({ command, context }) => {
      await stash(command.options);
    },
  },

  {
    name: "Apply",
    command: "apply",
    args: "",
    flags: "",
    description: "git stash apply",
    function: async ({ context }) => {
      await context?.methods?.executeCommand("git stash apply");
    },
  },

  {
    name: "Rename",
    command: "rename",
    args: "{branchName}",
    flags: "--local --remote",
    description:
      "- Renames current local branch \n- Attempts to rename the current remote branch. \n\n--local: will only rename the local branch.\n--remote: will only attempt to rename remote branch.",
    function: async ({ command, context }) => {
      await renameBranch(command.args[0], command.options);
      let next = { ...context.store?.repos };
      const branchMeta =
        context.store?.repos?.[context?.store?.settings?.pwd]?.branches?.[
          command.options.currentBranch
        ];
      next[context?.store?.settings?.pwd].branches[command.args[0]] = {
        ...branchMeta,
      };
      delete next?.[context?.store?.settings?.pwd]?.branches?.[
        command.options.currentBranch
      ];
      context.methods.setRepos(next);
    },
  },

  {
    name: "Fetch",
    command: "fetch",
    args: "",
    flags: "",
    description: "git fetch -p",
    function: async ({ command, context }) => {
      await fetch();
    },
  },

  {
    name: "Pop",
    command: "pop",
    args: "",
    flags: "",
    description: "Undo most recent commit",
    function: async ({ command, context }) => {
      await context?.methods?.executeCommand("git reset HEAD~");
    },
  },

  {
    name: "Remove",
    command: "remove",
    args: "{relativeFilepath} *{branch}",
    flags: "",
    description:
      "git checkout {branch} -- {relativeFilepath} \n\n*{branch} is optional and is set to {parentBranch} by default.\n\nRemoves all changes to a file.",
    function: async ({ command, context }) => {
      await handleFile(command.args[0], command.args[1], command.options);
    },
  },

  {
    name: "Restore",
    command: "restore",
    args: "{branch}",
    flags: "",
    description: "Restores a recently deleted {branch}",
    function: async ({ command, context }) => {
      const data = await restoreBranch(command);
      context.methods.setRepos({
        ...context.store?.repos,
        [context.store?.settings?.pwd]: {
          ...context.store?.repos?.[context.store?.settings?.pwd],
          branches: {
            ...(context.store?.repos?.[context.store?.settings?.pwd]
              ?.branches || {}),
            [data?.branch]: {
              parentBranch: data?.parentBranch,
              createdAt: new Date().toISOString(),
            },
          },
        },
      });
    },
  },

  {
    name: "Parent",
    command: "parent",
    args: "{branchName}",
    flags: "",
    description: "Points current branch's parent to {branchName}",
    function: async ({ command, context }) => {
      context.methods.setRepos({
        ...context.store?.repos,
        [context.store?.settings?.pwd]: {
          ...context.store?.repos?.[context.store?.settings?.pwd],
          branches: {
            ...(context.store?.repos?.[context.store?.settings?.pwd]
              ?.branches || {}),
            [command.options.currentBranch]: {
              ...(context.store?.repos?.[context.store?.settings?.pwd]
                ?.branches?.[command.options.currentBranch] || {}),
              parentBranch: command.args[0],
            },
          },
        },
      });
    },
  },
];

export const defaultExtensions = [
  {
    id: `auto-open-localhost`,
    name: "Auto open localhost",
    description:
      "Open copied url and format it into a localhost url. Uses first detected port.",
    executionType: "click",
    hideExtension: false,
    function: async ({ context }) => {
      const path = context?.store?.settings?.pwd?.replace(
        "~",
        context?.store?.settings?.base
      );
      const port = context?.store?.ports?.[path]?.[0];
      try {
        const text = await context.methods.clipboard.readText();
        const url = new URL(text);
        const nextUrl = `http://localhost${port?.port}${url?.pathname}`;
        context.methods.executeCommand(`open "${nextUrl}"`);
      } catch {}
    },
  },

  ...defaultCommands.map((command) => {
    return {
      id: `default-commands-${command?.command}`,
      name: `Default ${command?.name}`,
      description: "",
      executionType: "command",
      hideExtension: true,
      command,
    };
  }),
];
