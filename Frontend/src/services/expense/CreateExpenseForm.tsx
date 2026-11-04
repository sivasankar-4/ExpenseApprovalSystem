import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";

import {
  createExpenseSchema,
  type CreateExpenseFormData,
} from "@/schemas/expense.schema";

import { expenseService } from "@/services/expense/expenseService";
import type { Expense } from "@/types/expense";

interface CreateExpenseFormProps {
  expense?: Expense;
  onSuccess?: (expense: Expense) => void;
  onCancel?: () => void;
}

const CreateExpenseForm = ({ expense, onSuccess, onCancel }: CreateExpenseFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateExpenseFormData>({
    resolver: zodResolver(createExpenseSchema),
    defaultValues: expense
      ? {
          amount: expense.amount,
          currency: expense.currency ?? "",
          category: expense.category ?? "",
          description: expense.description,
        }
      : undefined,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async (data: CreateExpenseFormData) => {
    try {
      setSubmitError(null);
      const savedExpense = expense
        ? await expenseService.updateExpense(expense.id, data)
        : await expenseService.createExpense(data);

      reset();
      onSuccess?.(savedExpense);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        setSubmitError("You do not have permission to change this expense.");
      } else {
        setSubmitError(
          expense
            ? "Unable to update this expense. Please try again."
            : "Unable to create this expense. Please try again.",
        );
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5"
    >
      {submitError && (
        <p className="text-sm text-red-400" role="alert">{submitError}</p>
      )}
      {/* Amount */}
      <div>
        <label
          htmlFor="amount"
          className="mb-2 block text-sm font-medium text-[#F5F6F5]"
        >
          Amount
        </label>

        <input
          id="amount"
          type="number"
          step="0.01"
          placeholder="Enter amount"
          {...register("amount", {
            valueAsNumber: true,
          })}
          className="w-full px-4 py-2.5 text-sm placeholder-[#A1A1A4]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#F5F6F5",
          }}
        />

        {errors.amount && (
          <p className="mt-1 text-sm text-red-400">
            {errors.amount.message}
          </p>
        )}
      </div>

      {/* Currency */}
      <div>
        <label
          htmlFor="currency"
          className="mb-2 block text-sm font-medium text-[#F5F6F5]"
        >
          Currency
        </label>

        <input
          id="currency"
          type="text"
          placeholder="e.g. Rupees"
          {...register("currency")}
          className="w-full px-4 py-2.5 text-sm placeholder-[#A1A1A4]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#F5F6F5",
          }}
        />

        {errors.currency && (
          <p className="mt-1 text-sm text-red-400">
            {errors.currency.message}
          </p>
        )}
      </div>

      {/* Category */}
      <div>
        <label
          htmlFor="category"
          className="mb-2 block text-sm font-medium text-[#F5F6F5]"
        >
          Category
        </label>

        <input
          id="category"
          type="text"
          placeholder="e.g. IT"
          {...register("category")}
          className="w-full px-4 py-2.5 text-sm placeholder-[#A1A1A4]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#F5F6F5",
          }}
        />

        {errors.category && (
          <p className="mt-1 text-sm text-red-400">
            {errors.category.message}
          </p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium text-[#F5F6F5]"
        >
          Description
        </label>

        <textarea
          id="description"
          placeholder="Describe the expense"
          {...register("description")}
          className="min-h-24 w-full px-4 py-2.5 text-sm placeholder-[#A1A1A4]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/40"
          style={{
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "12px",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            color: "#F5F6F5",
          }}
        />

        {errors.description && (
          <p className="mt-1 text-sm text-red-400">
            {errors.description.message}
          </p>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (expense ? "Saving..." : "Submitting...") : expense ? "Save Changes" : "Submit Expense"}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full rounded-xl border border-white/20 px-4 py-2.5 text-sm font-semibold text-[#F5F6F5] hover:bg-white/10 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
      )}
    </form>
  );
};

export default CreateExpenseForm;