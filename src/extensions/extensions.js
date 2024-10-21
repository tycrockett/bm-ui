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
  stash,
  update,
} from "../git/utils";
import { StoreContext } from "../context/store";

export const Extensions = () => {
  const context = useContext(StoreContext);
  const {
    store: { extensions },
  } = context;

  const [extension, setExtension] = useState(null);

  return (
    <Div
      css={`
        padding: 16px;
      `}
    >
      <Text h2>Extensions</Text>
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
              onClick={() => setExtension(cmd)}
            >
              <Text bold>{cmd?.name}</Text>
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
    args: "{description}",
    flags: "",
    description:
      "1. Adds all unstaged files \n2. Commits all files with a {description} message \n3. Pushes everything if a remote branch is detected.",
    function: async ({ command, context }) => {
      const description = command.args
        .filter((v) => !v.startsWith("-"))
        .join(" ");
      await addCommitPush(description, command.options);
    },
  },
  {
    name: "New",
    command: "new",
    args: "{name}",
    flags: "",
    description:
      "1. Pulls current branch if a remote branch exists\n2. Creates new {name} branch\n3. Sets the current branch as {name}'s parent.",
    function: async ({ command, context }) => {
      await createBranch(command.args[0], command.options);
      context.methods.setRepos({
        ...context.store?.repos,
        [context.store?.settings?.pwd]: {
          ...context.store?.repos?.[context.store?.settings?.pwd],
          branches: {
            ...(context.store?.repos?.[context.store?.settings?.pwd]
              ?.branches || {}),
            [command.args[0]]: {
              description: command.args[1] || "",
              parentBranch: command.options?.currentBranch,
              createdAt: new Date().toISOString(),
            },
          },
        },
      });
    },
  },
  {
    name: "Checkout",
    command: "checkout",
    args: "{name}",
    flags: "-s --stash",
    description: "Checkout a branch.",
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
        } catch {}
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
    name: "Clear",
    command: "clear",
    args: "",
    flags: "-u --undo",
    description:
      "Clears branch all uncommitted changes. Adding the -u flag undoes the clear.",
    function: async ({ command, context }) => {
      await clearBranch(command.options);
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
    args: "{relativeFilepath}",
    flags: "",
    description:
      "git checkout {relativeFilepath} from the parent branch\n\n(removes {relativeFilepath} changes in the branch)",
    function: async ({ command, context }) => {
      await handleFile(command.args[0], command.args[1], command.options);
    },
  },
  {
    name: "Parent",
    command: "parent",
    args: "{branchName}",
    flags: "--point",
    description: "--point: Points current branch's parent to {branchName}",
    function: async ({ command, context }) => {
      if (command.options.flags.includes("--point")) {
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
      }
    },
  },
  {
    name: "Note",
    command: "note",
    args: '"{note}"',
    flags: "",
    description: "Adds a quick-note to the current branch.",
    function: async ({ command, context }) => {
      const branchName = command.options?.currentBranch;
      const branches =
        context.store?.repos?.[context.store?.settings?.pwd]?.branches || {};
      const matches = command?.options?.executingCommand.match('"(.*)"');
      if (matches?.length) {
        const note = matches[1];
        context.methods.setRepos({
          ...context.store?.repos,
          [context.store?.settings?.pwd]: {
            ...context.store?.repos?.[context.store?.settings?.pwd],
            branches: {
              ...branches,
              [branchName]: {
                ...(branches?.[branchName] || {}),
                notes: [...(branches?.[branchName]?.notes || []), note],
              },
            },
          },
        });
      }
    },
  },
  {
    name: "list",
    command: "list",
    args: "{commit hash}",
    flags: "--files",
    description: "Lists items in the logs.",
    function: async ({ command, context }) => {
      const [hash] = command?.args;
      if (command?.options?.flags?.includes("--files")) {
        const data = await context?.methods?.executeCommand(
          `git diff-tree --no-commit-id --name-only ${hash} -r`
        );

        context?.methods?.set("logs", [
          {
            timestamp: new Date().toISOString(),
            pwd: context?.store?.settings?.pwd,
            type: "git-list",
            title: "List Files",
            message: data?.toString(),
            data: command,
          },
          ...context?.store?.logs,
        ]);
        context?.methods?.set("mode", "logs");
      }
    },
  },

  // git diff-tree --no-commit-id --name-only bd61ad98 -r
];

export const defaultExtensions = [
  {
    id: "open-local-url",
    name: "Open local url",
    description: "",

    executionType: "form",
    formInputs: [
      {
        accessorKey: "domain",
        label: "Domain",
        type: "text",
        defaultValue: "http://localhost:3000",
        validator: (value) => {
          try {
            new URL(value);
            return { isValid: true };
          } catch (err) {
            return { isValid: false, message: "Error parsing url" };
          }
        },
        isRequired: true,
      },
    ],

    function: async ({ form, context }) => {
      try {
        const text = await context.methods.clipboard.readText();
        const url = new URL(text);
        const nextUrl = `${form?.domain}${url?.pathname}`;
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
