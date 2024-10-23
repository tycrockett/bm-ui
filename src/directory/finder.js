import { File, Folder } from "phosphor-react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { StoreContext } from "../context/store";
import { useKeyboard } from "../hooks/use-keyboard";
import { getFilesInDirectory } from "../node/fs-utils";
import { Div, Text, colors, Input } from "../shared";
import { animation, flex } from "../shared/utils";
import { scrollbar } from "../shared/styles";

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
        padding: 0 32px;
        margin: 8px 0;
        width: calc(100% - 32px);
        box-sizing: border-box;
        input {
          width: 100%;
          margin: 0 auto;
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
            background-color: ${colors.green};
            cursor: pointer;
          `}
          onClick={handleSubmit}
        >
          Go back
        </Text>
      ) : null}
      <Div
        css={`
          width: 100%;
          margin: 0 auto;
          max-height: calc(100vh - 250px);
          overflow-y: auto;
          background-color: ${colors.darkIndigo};
          border-radius: 8px;
          padding: 8px 0;
          ${scrollbar.style};
        `}
      >
        {list.map((item, idx) => (
          <Div
            onClick={() => directory.change(settings?.pwd + "/" + item.name)}
            css={`
              ${animation("fadeIn", ".3s ease")}
              width: 100%
              background-color: ${colors.darkIndigo};
              padding: 8px;
              font-weight: bold;
              ${flex("left")}
              cursor: pointer;
              color: white;
              border: 1px solid transparent;
              ${!!search && index == idx
                ? `background-color: ${colors.green};`
                : ""}
              :hover {
                background-color: rgba(0, 0, 0, 0.5);
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
