import { File, Folder, Monitor } from "phosphor-react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { StoreContext } from "../context/store";
import { useKeyboard } from "../hooks/use-keyboard";
import { getFilesInDirectory } from "../node/fs-utils";
import { Div, Text, colors, Input } from "../shared";
import { animation, flex, shadows } from "../shared/utils";
import { scrollbar } from "../shared/styles";
import { cmd } from "../node/node-exports";

export const Finder = () => {
  const ref = useRef();
  const {
    store: { settings },
    methods: { directory },
  } = useContext(StoreContext);

  const [index, setIndex] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setIndex(0);
  }, [search]);

  const directoryList = useMemo(() => {
    const path = settings?.pwd?.replace("~", settings?.base);
    return getFilesInDirectory(path);
  }, [settings?.pwd, settings?.base]);

  const list = useMemo(() => {
    if (!search) {
      return directoryList;
    }
    return directoryList.filter((item) =>
      item?.name?.toLowerCase()?.includes(search?.toLowerCase())
    );
  }, [directoryList.length, search]);

  const handleSubmit = (event) => {
    event.preventDefault();
    let nextPath = settings?.pwd;
    if (search === "..") {
      const split = nextPath.split("/");
      if (nextPath !== "~") {
        nextPath = split.slice(0, -1).join("/");
      }
    } else {
      nextPath += "/" + list[index].name;
    }
    directory.change(nextPath);
    setSearch("");
  };

  const keydown = (captured, event) => {
    if (captured === "+Tab") {
      event.preventDefault();
      let nextIndex = index + 1;
      if (nextIndex >= list.length) {
        nextIndex = 0;
      }
      setIndex(nextIndex);
    } else {
      ref.current.focus();
    }
  };

  useKeyboard({ keydown });

  return (
    <Div
      css={`
        ${directoryList?.length ? "" : animation("fadeIn", ".2s ease")}
        padding: 0 16px;
        margin: 8px 0;
        input {
          width: calc(100% - 32px);
        }
      `}
    >
      <Div
        css={`
          width: 100%;
          ${flex("left")}
          margin-bottom: 32px;
          form {
            flex-grow: 1;
          }
        `}
      >
        <Div
          css={`
            ${flex("space-between")}
            border: 1px solid ${colors.darkIndigo};
            border-radius: 50%;
            padding: 4px;
            margin: 4px;
            margin-right: 16px;
            cursor: pointer;
            transition: background-color 0.2s ease;
            background-color: ${colors.darkIndigo};

            box-sizing: border-box;
            :hover {
              outline: 2px solid ${colors.lightIndigo};
              outline-offset: 2px;
              ${shadows.md}
            }
            svg {
              min-width: 32px;
            }
          `}
          onClick={() => cmd('open -n -b "com.microsoft.VSCode" --args "$PWD"')}
        >
          <Monitor size={32} color="white" weight="bold" />
        </Div>
        <form onSubmit={handleSubmit}>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            ref={ref}
          />
        </form>
      </Div>

      {search === ".." ? (
        <Text
          h4
          css={`
            margin-left: 64px;
            border-radius: 8px;
            border: 1px solid ${colors.black};
            width: max-content;
            padding: 8px;
            background-color: ${colors.lightIndigo};
            cursor: pointer;
          `}
          onClick={handleSubmit}
        >
          Go back
        </Text>
      ) : null}
      <Div
        css={`
          max-width: 440px;
          margin: 0 auto;
          max-height: calc(100vh - 200px);
          overflow-y: auto;
          ${scrollbar.style}
        `}
      >
        {list.map((item, idx) => (
          <Div
            onClick={() => directory.change(settings?.pwd + "/" + item.name)}
            css={`
              ${animation("fadeIn", ".3s ease")}
              width: calc(100% - 32px);
              background-color: ${colors.darkIndigo};
              border-radius: 8px;
              padding: 4px 8px;
              font-weight: bold;
              ${flex("left")}
              margin-bottom: 8px;
              cursor: pointer;
              color: white;
              border: 1px solid transparent;
              ${!!search && index == idx ? `border: 1px solid white;` : ""}
              :hover {
                background-color: ${colors.lightIndigo};
              }
              svg {
                min-width: 32px;
                padding-right: 8px;
              }
            `}
          >
            {item?.isFolder ? (
              <Folder size={24} weight="fill" />
            ) : item?.isFile ? (
              <File size={24} weight="fill" />
            ) : null}
            <Text ellipsis>{item.name}</Text>
          </Div>
        ))}
      </Div>
    </Div>
  );
};
