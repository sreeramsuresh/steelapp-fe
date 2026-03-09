import { useCallback, useState } from "react";

/**
 * Hook for Zod-based form validation.
 * Compatible with existing form state patterns (no form library dependency).
 *
 * @param {import("zod").ZodSchema} schema - Zod schema to validate against
 * @returns {{ validate, validateField, errors, clearErrors, isValid }}
 */
export function useZodForm(schema) {
  const [errors, setErrors] = useState({});

  const validate = useCallback(
    (data) => {
      const result = schema.safeParse(data);
      if (result.success) {
        setErrors({});
        return { success: true, data: result.data, fieldErrors: {} };
      }
      const fieldErrors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!fieldErrors[path]) {
          fieldErrors[path] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return { success: false, data: null, fieldErrors };
    },
    [schema]
  );

  const validateField = useCallback(
    (name, value) => {
      // Extract the field schema and validate just that field
      // For nested paths like "items.0.quantity", validate the full data would be needed
      // For simple fields, we can pick from the schema shape
      if (schema.shape?.[name]) {
        const result = schema.shape[name].safeParse(value);
        if (result.success) {
          setErrors((prev) => {
            const next = { ...prev };
            delete next[name];
            return next;
          });
          return { success: true };
        }
        const message = result.error.issues[0]?.message || "Invalid value";
        setErrors((prev) => ({ ...prev, [name]: message }));
        return { success: false, message };
      }
      return { success: true };
    },
    [schema]
  );

  const clearErrors = useCallback(() => setErrors({}), []);

  const isValid = Object.keys(errors).length === 0;

  return { validate, validateField, errors, clearErrors, isValid };
}
