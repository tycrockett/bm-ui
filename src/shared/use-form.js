import { useEffect, useState } from "react";

export const useForm = (data = {}, options = {}) => {
  const [form, setForm] = useState(data);

  useEffect(() => {
    setForm(data);
  }, []);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const getProperty = (fieldName) => ({
    name: fieldName,
    value: form[fieldName],
    onChange,
  });

  return {
    getProperty,
    form,
    setForm,
  };
};
