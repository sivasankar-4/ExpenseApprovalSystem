import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate } from "react-router-dom";

import { canApproveExpenses } from "@/services/auth/authService";
import { expenseService } from "@/services/expense/expenseService";
import type { Expense, ExpenseStatus } from "@/types/expense";
import { formatAmount, formatDate, statusLabels } from "@/utils/expenseUtils";

const actionableStatuses: ExpenseStatus[] = ["PENDING", "IN_REVIEW"];

const isActionable = (status: ExpenseStatus) => actionableStatuses.includes(status);

const getErrorMessage = (error: unknown, action: "load" | "approve" | "reject") => {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You do not have permission to manage approvals.";
      case 409:
        return "This expense has already been updated. Refresh the page and try again.";
      case 500:
        return "The server could not process your request. Please try again later.";
      default:
        return action === "load"
          ? "Unable to load approvals. Please try again."
          : `Unable to ${action} this expense. Please try again.`;
    }
  }

  return action === "load"
    ? "Unable to load approvals. Please try again."
    : `Unable to ${action} this expense. Please try again.`;
};

const ApprovalsPage = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingExpenseId, setUpdatingExpenseId] = useState<number | null>(null);
  const hasApprovalAccess = canApproveExpenses();

  useEffect(() => {
    let isMounted = true;

    const fetchApprovals = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const allExpenses = await expenseService.getAllExpenses();

        if (isMounted) {
          setExpenses(allExpenses.filter((expense) => isActionable(expense.status)));
        }
      } catch (requestError) {
        if (isMounted) {
          setError(getErrorMessage(requestError, "load"));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchApprovals();

    return () => {
      isMounted = false;
    };
  }, []);

  const approvals = useMemo(
    () => [...expenses].sort(
      (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    ),
    [expenses],
  );

  const handleAction = async (expense: Expense, action: "approve" | "reject") => {
    if (!hasApprovalAccess || updatingExpenseId !== null || !isActionable(expense.status)) {
      return;
    }

    if (action === "reject" && !window.confirm("Reject this expense? This action cannot be undone.")) {
      return;
    }

    try {
      setUpdatingExpenseId(expense.id);
      setError(null);
      const updatedExpense = action === "approve"
        ? await expenseService.approveExpense(expense.id)
        : await expenseService.rejectExpense(expense.id);

      setExpenses((currentExpenses) =>
        isActionable(updatedExpense.status)
          ? currentExpenses.map((currentExpense) =>
              currentExpense.id === updatedExpense.id ? updatedExpense : currentExpense,
            )
          : currentExpenses.filter((currentExpense) => currentExpense.id !== updatedExpense.id),
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError, action));
    } finally {
      setUpdatingExpenseId(null);
    }
  };

  const darkSlateCardStyle = {
    background: "#14171F",
    borderRadius: "16px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F5F6F5]">
          Approvals
        </h1>
        <p className="mt-2 text-sm text-[#A1A1A4]">
          Review expense submissions that are awaiting a decision.
        </p>
      </div>

      {/* Main Dark Slate Card Container */}
      <div
        className="overflow-hidden shadow-xl"
        style={darkSlateCardStyle}
      >
        <div className="border-b border-white/[0.08] p-6">
          <h2 className="text-lg font-bold text-[#F5F6F5]">
            Pending Approvals
          </h2>
          <p className="mt-1 text-sm text-[#A1A1A4]">
            Review expense details before making an approval decision.
          </p>
        </div>

        {isLoading && (
          <div className="flex min-h-48 items-center justify-center p-6">
            <p className="text-sm text-[#A1A1A4]">Loading approvals...</p>
          </div>
        )}

        {!isLoading && error && (
          <div className="flex min-h-48 items-center justify-center p-6">
            <p className="text-sm text-red-400" role="alert">{error}</p>
          </div>
        )}

        {!isLoading && !error && approvals.length === 0 && (
          <div className="flex min-h-48 items-center justify-center p-6">
            <p className="text-sm text-[#A1A1A4]">
              No pending approvals.
            </p>
          </div>
        )}

        {!isLoading && !error && approvals.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/[0.08] text-[#F5F6F5]">
                <tr>
                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">Description</th>
                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">Amount</th>
                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">Submitted By</th>
                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">Status</th>
                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">Date</th>
                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.08]">
                {approvals.map((expense) => {
                  const isUpdating = updatingExpenseId === expense.id;

                  return (
                    <tr
                      key={expense.id}
                      className="border-b border-white/[0.08] last:border-0 hover:bg-white/[0.05] transition-colors"
                      style={{ background: "rgba(255, 255, 255, 0.03)" }}
                    >
                      <td className="px-6 py-4 font-medium text-[#F5F6F5]">{expense.description}</td>
                      <td className="px-6 py-4 font-semibold text-[#F5F6F5]">{formatAmount(expense.amount)}</td>
                      <td className="px-6 py-4 text-[#F5F6F5]">{expense.submittedBy}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-black shadow-sm">
                          {statusLabels[expense.status] || expense.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#A1A1A4]">{formatDate(expense.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/expenses/${expense.id}`)}
                            className="rounded-xl border border-white/15 px-3 py-1.5 text-xs font-semibold text-[#F5F6F5] hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            View details
                          </button>
                          {hasApprovalAccess && (
                            <>
                              <button
                                type="button"
                                disabled={updatingExpenseId !== null}
                                onClick={() => handleAction(expense, "approve")}
                                className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:opacity-90 transition-opacity shadow-sm disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                              >
                                {isUpdating ? "Updating..." : "Approve"}
                              </button>
                              <button
                                type="button"
                                disabled={updatingExpenseId !== null}
                                onClick={() => handleAction(expense, "reject")}
                                className="rounded-xl border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/10 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                              >
                                {isUpdating ? "Updating..." : "Reject"}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalsPage;
