import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { expenseService } from "@/services/expense/expenseService";
import type { Expense } from "@/types/expense";

const recentExpensesLimit = 5;

import {
  calculateExpenseStats,
  formatAmount,
  formatDate,
  statusLabels,
} from "@/utils/expenseUtils";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchExpenses = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const data = await expenseService.getAllExpenses();

        if (isMounted) {
          setExpenses(data);
        }
      } catch {
        if (isMounted) {
          setError("Unable to load dashboard data. Please try again.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchExpenses();

    return () => {
      isMounted = false;
    };
  }, []);

  const { statistics, recentExpenses } = useMemo(() => {
    const stats = calculateExpenseStats(expenses);

    const sortedExpenses = [...expenses].sort(
      (first, second) =>
        new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
    );

    return {
      statistics: [
        { label: "Total Expenses", value: stats.totalCount },
        { label: "Total Amount", value: formatAmount(stats.totalAmount) },
        { label: "Pending", value: stats.statusBreakdown.PENDING.count },
        { label: "In Review", value: stats.statusBreakdown.IN_REVIEW.count },
        { label: "Approved", value: stats.statusBreakdown.APPROVED.count },
        { label: "Rejected", value: stats.statusBreakdown.REJECTED.count },
      ],
      recentExpenses: sortedExpenses.slice(0, recentExpensesLimit),
    };
  }, [expenses]);

  return (
    <div className="relative min-h-full w-full bg-[#0D1117] p-6 space-y-8 rounded-2xl overflow-hidden">
      {/* Background Radial Glow 1: Warm Bronze behind top stats */}
      <div
        className="pointer-events-none absolute -top-10 left-1/4 -translate-x-1/2 w-[600px] h-[350px] rounded-full blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, rgba(180, 90, 20, 0.12) 0%, rgba(120, 50, 10, 0.04) 60%, transparent 100%)",
        }}
      />

      {/* Background Radial Glow 2: Dark Cyan behind table */}
      <div
        className="pointer-events-none absolute bottom-0 right-1/4 translate-x-1/2 w-[650px] h-[400px] rounded-full blur-[110px]"
        style={{
          background:
            "radial-gradient(circle, rgba(0, 120, 140, 0.12) 0%, rgba(0, 60, 80, 0.04) 60%, transparent 100%)",
        }}
      />

      {/* Main Content Layer */}
      <div className="relative z-10 space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#F5F6F5]">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-[#A1A1A4]">
              Overview of your expense approval activity.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() =>
                navigate("/expenses", { state: { openCreateForm: true } })
              }
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              + New Expense
            </button>
            <button
              type="button"
              onClick={() => navigate("/expenses")}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
            >
              View Expenses
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statistics.map((statistic) => (
            <div
              key={statistic.label}
              className="p-6 transition-all duration-200 hover:border-white/25 shadow-lg"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderRadius: "20px",
                border: "1px solid rgba(255, 255, 255, 0.12)",
              }}
            >
              <p className="text-sm font-medium text-[#A1A1A4]">
                {statistic.label}
              </p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F5F6F5]">
                {statistic.value}
              </p>
            </div>
          ))}
        </div>

        <div
          className="overflow-hidden shadow-xl"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
            borderRadius: "20px",
          }}
        >
          <div className="border-b border-white/[0.08] p-6">
            <h2 className="text-lg font-bold text-[#F5F6F5]">Recent Expenses</h2>
            <p className="mt-1 text-sm text-[#A1A1A4]">
              Your most recent expense activity.
            </p>
          </div>

          {isLoading && (
            <div className="flex min-h-48 items-center justify-center p-6">
              <p className="text-sm text-[#A1A1A4]">Loading dashboard data...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="flex min-h-48 items-center justify-center p-6">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

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

          {!isLoading && !error && recentExpenses.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/[0.08] text-[#F5F6F5]">
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
                <tbody className="divide-y divide-white/[0.08]">
                  {recentExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-white/[0.08] last:border-0 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-[#F5F6F5]">
                        {expense.description}
                      </td>
                      <td className="px-6 py-4 font-semibold text-[#F5F6F5]">
                        {formatAmount(expense.amount)}
                      </td>
                      <td className="px-6 py-4 text-[#F5F6F5]">
                        {expense.submittedBy}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            expense.status === "APPROVED"
                              ? "bg-white text-black shadow-sm"
                              : expense.status === "IN_REVIEW"
                              ? "bg-white/15 text-[#F5F6F5] border border-white/20"
                              : expense.status === "PENDING"
                              ? "bg-white/10 text-[#F5F6F5] border border-white/15"
                              : "bg-white/5 text-[#A1A1A4] border border-white/10"
                          }`}
                        >
                          {statusLabels[expense.status]}
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
    </div>
  );
};

export default DashboardPage;

