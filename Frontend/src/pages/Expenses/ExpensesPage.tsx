import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { expenseService } from "@/services/expense/expenseService";
import CreateExpenseForm from "@/services/expense/CreateExpenseForm";
import type { Expense } from "@/types/expense";
import { formatAmount, formatDate, statusLabels } from "@/utils/expenseUtils";

const ExpensesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    const stateFeedback = location.state?.feedback;
    if (typeof stateFeedback === "string") {
      setFeedback(stateFeedback);
      navigate(location.pathname, { replace: true, state: null });
    }

    if (location.state?.openCreateForm) {
      setShowCreateForm(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await expenseService.getAllExpenses();

        setExpenses(data);
      } catch (error) {
        console.error("Failed to fetch expenses:", error);
        setError("Unable to load expenses. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, []);

  const darkGlassCardStyle = {
    background: "rgba(20, 23, 31, 0.75)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
    borderRadius: "20px",
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
            Expenses
          </h1>

          <p className="mt-2 text-sm text-[#A1A1A4]">
            Manage and track your expense submissions.
          </p>
        </div>

        {feedback && (
          <p className="text-sm text-emerald-400" role="status">{feedback}</p>
        )}

        <button
          type="button"
          onClick={() => setShowCreateForm(true)}
          className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-md cursor-pointer"
        >
          + New Expense
        </button>
      </div>

      {showCreateForm && (
        <div
          className="p-6 overflow-hidden"
          style={darkGlassCardStyle}
        >
          <div className="mb-6 flex items-center justify-between gap-4 border-b border-white/10 pb-4">
            <h2 className="text-lg font-bold text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
              Create Expense
            </h2>

            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-[#F5F6F5] hover:bg-white/20 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <CreateExpenseForm
            onSuccess={(createdExpense) => {
              setExpenses((currentExpenses) => [createdExpense, ...currentExpenses]);
              setFeedback("Expense created successfully.");
              setShowCreateForm(false);
            }}
          />
        </div>
      )}

      {/* Expense List */}
      <div
        className="overflow-hidden"
        style={darkGlassCardStyle}
      >
        <div className="border-b border-white/10 p-6">
          <h2 className="text-lg font-bold text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
            Expense List
          </h2>

          <p className="mt-1 text-sm text-[#A1A1A4]">
            View and track your submitted expenses.
          </p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex min-h-48 items-center justify-center p-6">
            <p className="text-sm text-[#A1A1A4]">
              Loading expenses...
            </p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex min-h-48 items-center justify-center p-6">
            <p className="text-sm text-red-400">
              {error}
            </p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && expenses.length === 0 && (
          <div className="flex min-h-48 items-center justify-center p-6">
            <div className="text-center">
              <h3 className="text-sm font-semibold text-[#F5F6F5]">
                No expenses found
              </h3>

              <p className="mt-1 text-sm text-[#A1A1A4]">
                Create your first expense to get started.
              </p>
            </div>
          </div>
        )}

        {/* Expenses */}
        {!isLoading && !error && expenses.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-[#F5F6F5]">
                <tr>
                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">
                    Description
                  </th>

                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">
                    Amount
                  </th>

                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">
                    Submitted By
                  </th>

                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">
                    Status
                  </th>

                  <th className="px-6 py-4 font-bold text-[#F5F6F5]">
                    Date
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-white/10">
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    onClick={() => navigate(`/expenses/${expense.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        navigate(`/expenses/${expense.id}`);
                      }
                    }}
                    role="link"
                    tabIndex={0}
                    className="cursor-pointer border-b border-white/10 outline-none hover:bg-white/5 focus-visible:bg-white/5 transition-colors last:border-0"
                  >
                    <td className="px-6 py-4 font-medium text-[#F5F6F5]">
                      {expense.description}
                    </td>

                    <td className="px-6 py-4 font-semibold text-[#F5F6F5]">
                      {formatAmount(expense.amount)}
                    </td>

                    <td className="px-6 py-4 font-medium text-[#F5F6F5]">
                      {expense.submittedBy}
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-black shadow-sm">
                        {statusLabels[expense.status] || expense.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-[#A1A1A4]">
                      {formatDate(expense.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpensesPage;
