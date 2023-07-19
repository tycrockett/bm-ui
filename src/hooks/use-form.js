import { get, set } from "lodash";
import { useStateSync } from "./use-state-sync";

export const useForm = (value, deps) => {
  const [form, setForm, isSynced] = useStateSync(value, deps);

  const onChange = (e) => {
    const { name, value } = e.target || {};
    setForm((v) => {
      let next = { ...v };
      set(next, name, value);
      return next;
    });
  };

  const getProperty = (property, defaultValue = "") => ({
    value: get(form, property, defaultValue),
    name: property,
    onChange,
  });

  const resetForm = () => setForm(value);

  return {
    getProperty,
    form,
    setForm,
    resetForm,
    hasChanges: !isSynced,
  };
};
