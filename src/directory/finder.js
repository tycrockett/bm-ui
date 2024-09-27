import { css } from "@emotion/css";
import { File, Folder, Monitor, Terminal } from "phosphor-react";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { StoreContext } from "../context/store";
import { useAnimation } from "../hooks/use-animation";
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
        padding: 16px;
        margin-bottom: 16px;
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
        <Monitor
          size={32}
          color="white"
          weight="bold"
          className={css`
            padding-right: 8px;
          `}
        />
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
            margin-left: 40px;
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
          margin-left: 40px;
          transition: display 0.2s ease;
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
              width: 400px;
              background-color: ${colors.dark};
              border-radius: 8px;
              padding: 4px 8px;
              font-weight: bold;
              ${flex("left")}
              margin-bottom: 8px;
              cursor: pointer;
              color: white;
              border: 1px solid transparent;
              ${!!search && index == idx
                ? `
                border: 1px solid white;
              `
                : ""}
              p {
                color: white;
              }
              :hover {
                background-color: ${colors.light};
                color: ${colors.black};
                p {
                  color: ${colors.black};
                }
              }
              svg {
                min-width: 32px;
                padding-right: 16px;
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
