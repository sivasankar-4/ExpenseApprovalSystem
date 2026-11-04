import { z } from "zod";

export const createExpenseSchema = z.object({
  // `valueAsNumber` in the form converts this field before validation.
  // Keeping the schema input as a number also aligns the Zod resolver with
  // React Hook Form's typed form values.
  amount: z
    .number()
    .positive("Amount must be greater than zero"),

  currency: z
    .string()
    .trim()
    .min(1, "Currency is required"),

  category: z
    .string()
    .trim()
    .min(1, "Category is required"),

  description: z
    .string()
    .trim()
    .min(1, "Description is required"),
});

export type CreateExpenseFormData = z.infer<
  typeof createExpenseSchema
>;
