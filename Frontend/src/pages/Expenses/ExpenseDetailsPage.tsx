import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, useParams } from "react-router-dom";

import { expenseService } from "@/services/expense/expenseService";
import CreateExpenseForm from "@/services/expense/CreateExpenseForm";
import { canApproveExpenses } from "@/services/auth/authService";
import type { Expense } from "@/types/expense";

const getErrorMessage = (error: unknown, action: "load" | "approve" | "reject" | "delete") => {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return `You do not have permission to ${action} this expense.`;
      case 404:
        return "This expense could not be found.";
      case 409:
        return "This expense has already been updated. Refresh the page and try again.";
      case 500:
        return "The server could not process your request. Please try again later.";
      default:
        return `Unable to ${action} this expense. Please try again.`;
    }
  }

  return `Unable to ${action} this expense. Please try again.`;
};

const ExpenseDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const expenseId = Number(id);
  const hasValidId = Boolean(id) && Number.isInteger(expenseId) && expenseId > 0;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [isLoading, setIsLoading] = useState(hasValidId);
  const [error, setError] = useState<string | null>(
    hasValidId ? null : "The expense ID is invalid.",
  );
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const hasApprovalAccess = canApproveExpenses();

  useEffect(() => {
    if (!hasValidId) {
      return;
    }

    const fetchExpense = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setExpense(null);
        setExpense(await expenseService.getExpenseById(expenseId));
      } catch (requestError) {
        console.error("Failed to fetch expense:", requestError);
        setExpense(null);
        setError(getErrorMessage(requestError, "load"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpense();
  }, [expenseId, hasValidId]);

  const handleAction = async (action: "approve" | "reject") => {
    if (!expense || isUpdating || expense.status === "APPROVED" || expense.status === "REJECTED") {
      return;
    }

    if (!hasApprovalAccess) {
      return;
    }

    if (action === "reject" && !window.confirm("Reject this expense? This action cannot be undone.")) {
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setFeedback(null);
      const updatedExpense = action === "approve"
        ? await expenseService.approveExpense(expense.id)
        : await expenseService.rejectExpense(expense.id);

      setExpense(updatedExpense);
      setFeedback(`Expense ${action}d successfully.`);
    } catch (requestError) {
      console.error(`Failed to ${action} expense:`, requestError);
      setError(getErrorMessage(requestError, action));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!expense || isUpdating) {
      return;
    }

    if (!window.confirm("Delete this expense? This action cannot be undone.")) {
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      setFeedback(null);
      await expenseService.deleteExpense(expense.id);
      navigate("/expenses", {
        state: { feedback: "Expense deleted successfully." },
      });
    } catch (requestError) {
      console.error("Failed to delete expense:", requestError);
      setError(getErrorMessage(requestError, "delete"));
    } finally {
      setIsUpdating(false);
    }
  };

  const canTakeAction = hasApprovalAccess && (expense?.status === "PENDING" || expense?.status === "IN_REVIEW");
  const canEditOrDelete = expense?.status === "PENDING";

  const darkGlassCardStyle = {
    background: "rgba(20, 23, 31, 0.75)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
    borderRadius: "20px",
  };

  const statusBadgeStyle: Record<string, string> = {
    APPROVED: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
    REJECTED: "bg-red-500/15 text-red-400 border border-red-500/30",
    PENDING: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    IN_REVIEW: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
            Expense Details
          </h1>
          <p className="mt-2 text-sm text-[#A1A1A4]">
            Review the submitted expense and its current status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/expenses")}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-md cursor-pointer"
        >
          Back to Expenses
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          className="flex min-h-48 items-center justify-center p-6"
          style={darkGlassCardStyle}
        >
          <p className="text-sm text-[#A1A1A4]">Loading expense details...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-6" style={darkGlassCardStyle}>
          <p className="text-sm font-medium text-red-400" role="alert">{error}</p>
        </div>
      )}

      {/* Expense Detail Card */}
      {!isLoading && !error && expense && (
        <div style={darkGlassCardStyle} className="overflow-hidden">
          {/* Card Header */}
          <div className="border-b border-white/10 p-6">
            <h2 className="text-lg font-bold text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
              {expense.description}
            </h2>
            <p className="mt-1 text-sm text-[#A1A1A4]">Expense #{expense.id}</p>
          </div>

          {feedback && (
            <p className="border-b border-white/10 px-6 py-4 text-sm text-emerald-400" role="status">
              {feedback}
            </p>
          )}

          {isEditing && canEditOrDelete && (
            <div className="border-b border-white/10 p-6">
              <CreateExpenseForm
                expense={expense}
                onCancel={() => setIsEditing(false)}
                onSuccess={(updatedExpense) => {
                  setExpense(updatedExpense);
                  setIsEditing(false);
                  setFeedback("Expense updated successfully.");
                }}
              />
            </div>
          )}

          {/* Data Fields */}
          <dl className="grid gap-6 p-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-[#A1A1A4]">Amount</dt>
              <dd className="mt-1 font-semibold text-[#F5F6F5]">{expense.amount}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#A1A1A4]">Status</dt>
              <dd className="mt-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    statusBadgeStyle[expense.status] ?? "bg-white/10 text-white border border-white/20"
                  }`}
                >
                  {expense.status}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#A1A1A4]">Submitted By</dt>
              <dd className="mt-1 font-semibold text-[#F5F6F5]">{expense.submittedBy}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#A1A1A4]">Tenant</dt>
              <dd className="mt-1 font-semibold text-[#F5F6F5]">{expense.tenantName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-[#A1A1A4]">Created At</dt>
              <dd className="mt-1 font-semibold text-[#F5F6F5]">{expense.createdAt}</dd>
            </div>
          </dl>

          {/* Approval Actions */}
          {(canTakeAction || canEditOrDelete) && (
            <div className="flex flex-wrap gap-3 border-t border-white/10 p-6">
              {canEditOrDelete && !isEditing && (
                <>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => setIsEditing(true)}
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={handleDelete}
                    className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                  >
                    Delete
                  </button>
                </>
              )}
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleAction("approve")}
                hidden={!canTakeAction}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-md disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? "Updating..." : "Approve"}
              </button>
              <button
                type="button"
                disabled={isUpdating}
                onClick={() => handleAction("reject")}
                hidden={!canTakeAction}
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {isUpdating ? "Updating..." : "Reject"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseDetailsPage;
