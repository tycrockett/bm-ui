import { useContext, useMemo } from "react";
import { StoreContext } from "../context/store";
import { Div, Text } from "../shared";

export const Logs = () => {
  const context = useContext(StoreContext);
  const {
    store: { settings = {}, logs = [] },
  } = context;

  const list = useMemo(() => {
    return logs.filter(({ pwd }) => pwd === settings?.pwd);
  }, [logs.length]);

  return (
    <Div
      css={`
        padding: 0 16px;
        margin: 16px 0;
      `}
    >
      {!list?.length ? (
        <Text
          h2
          css={`
            margin: 32px 0;
          `}
        >
          Looks like there are no logs to view.
        </Text>
      ) : (
        list?.map((item) => (
          <Div
            css={`
              background-color: rgba(0, 0, 0, 0.2);
              border-radius: 8px;
              padding: 16px;
              margin: 8px 0;
            `}
          >
            <Text bold>{item?.title}</Text>
            <pre style={{ color: "white" }}>{item?.message}</pre>
          </Div>
        ))
      )}
    </Div>
  );
};
