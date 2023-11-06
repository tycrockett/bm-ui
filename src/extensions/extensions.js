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
        `}
      >
        {extensions?.map((cmd) =>
          cmd?.hideExtension ? null : (
            <Div
              css={`
                box-sizing: border-box;
                border-radius: 16px;
                background-color: ${colors.darkIndigo};
                padding: 8px 16px;
                margin: 4px;
                min-width: max-content;
                :hover {
                  background-color: ${colors.lightIndigo};
                  transition: background-color 0.2s ease;
                  cursor: pointer;
                }
              `}
              onClick={() => setExtension(cmd)}
            >
              <Text h3 bold>
                {cmd?.name}
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

  const executeExtension = async () => {
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
      <form onSubmit={(e) => e.preventDefault()}>
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
          <Button type="submit" onClick={executeExtension}>
            OK
          </Button>
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
      "Pulls parent origin and then automatically merges the parent branch into the current branch.",
    function: async ({ command, context }) => {
      await update(command.options);
    },
  },
  {
    name: "Add + Commit + Push",
    command: ".",
    args: "{description}",
    flags: "",
    description:
      "Adds all unstaged files, commits all files with a description message and then pushes everything if a remote branch exists.",
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
      "Pulls current branch if a remote branch exists and then creates a new branch with the current branch set as it's parent.",
    function: async ({ command, context }) => {
      await createBranch(command.args[0], command.options);
      context.methods.setRepos({
        ...context.repos,
        [context.settings?.pwd]: {
          ...context.repos?.[context.settings?.pwd],
          branches: {
            ...(context.repos?.[context.settings?.pwd]?.branches || {}),
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
      "Delete the current branch. Adding the -r flag it will delete the remote branch.",
    function: async ({ command, context }) => {
      await deleteBranch(command.options);
      if (
        context.repos?.[context.settings?.pwd]?.branches?.[
          command.options?.currentBranch
        ]
      ) {
        try {
          let nextBranches = context.repos?.[context.settings?.pwd]?.branches;
          delete nextBranches[command.options.currentBranch];
          context.methods.setRepos({
            ...context.repos,
            [context.settings?.pwd]: {
              ...context.repos?.[context.settings?.pwd],
              branches: nextBranches,
            },
          });
        } catch {}
      }
    },
  },
  {
    name: "Push",
    command: "push",
    args: "",
    flags: "",
    description:
      "Do a git push or if no remote branch exists it will automatically set the upstream branch",
    function: async ({ command, context }) => {
      await push(command.options);
    },
  },
  {
    name: "Clear",
    command: "clear",
    args: "",
    flags: "-u --undo",
    description:
      "Clears all uncommitted changes. Adding the -u flag undoes the clear.",
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
    flags: "",
    description:
      "Renames local active branch and attempts to rename the remote branch.",
    function: async ({ command, context }) => {
      await renameBranch(command.args[0], command.options);
      let next = { ...context.repos };
      const branchMeta =
        context.repos?.[context?.settings?.pwd]?.branches?.[
          command.options.currentBranch
        ];
      next[context?.settings?.pwd].branches[command.args[0]] = {
        ...branchMeta,
      };
      delete next?.[context?.settings?.pwd]?.branches?.[
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
    description: "Does a git fetch -p",
    function: async ({ command, context }) => {
      await fetch();
    },
  },
  {
    name: "File",
    command: "file",
    args: "{relativeFilepath}",
    flags: "-ch --checkout",
    description:
      "--checkout: Checks out a file from the parent branch (thereby removing any changes to the file)",
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
          ...context.repos,
          [context.settings?.pwd]: {
            ...context.repos?.[context.settings?.pwd],
            branches: {
              ...(context.repos?.[context.settings?.pwd]?.branches || {}),
              [command.options.currentBranch]: {
                ...(context.repos?.[context.settings?.pwd]?.branches?.[
                  command.options.currentBranch
                ] || {}),
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
    args: "{note}",
    flags: "",
    description: "Adds a note to the current branch which can be viewed later.",
    function: async ({ command, context }) => {
      await createBranch(command.args[0], command.options);
      context.methods.setRepos({
        ...context.repos,
        [context.settings?.pwd]: {
          ...context.repos?.[context.settings?.pwd],
          branches: {
            ...(context.repos?.[context.settings?.pwd]?.branches || {}),
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
];

export const defaultExtensions = [
  {
    id: "open-local-build",
    name: "Open Local Build",
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
