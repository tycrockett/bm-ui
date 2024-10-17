import { useContext, useMemo } from "react";
import { StoreContext } from "../context/store";
import { colors, Div, Text } from "../shared";
import { flex } from "../shared/utils";
import { List, Note } from "phosphor-react";

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
        <Div
          css={`
            margin: 32px 0;
            padding: 32px;
            border-radius: 16px;
            background-color: ${colors.darkIndigo};
            ${flex("left")}
            svg {
              margin-right: 16px;
            }
          `}
        >
          <Note size={64} color={colors.light} />
          <Text bold>Looks like there are no logs to view.</Text>
        </Div>
      ) : (
        list?.map((item) => (
          <Div
            css={`
              background-color: ${colors.darkIndigo};
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
