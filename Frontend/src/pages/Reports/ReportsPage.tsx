import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";

import { expenseService } from "@/services/expense/expenseService";
import type { Expense } from "@/types/expense";
import {
  calculateExpenseStats,
  formatAmount,
  formatDate,
  statusLabels,
} from "@/utils/expenseUtils";

const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    switch (error.response?.status) {
      case 401:
        return "Your session has expired. Please sign in again.";
      case 403:
        return "You do not have permission to view reports.";
      case 500:
        return "The server could not process your request. Please try again later.";
      default:
        return "Unable to load report data. Please try again.";
    }
  }
  return "Unable to load report data. Please try again.";
};

const ReportsPage = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchReportData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await expenseService.getAllExpenses();
        if (isMounted) {
          setExpenses(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchReportData();

    return () => {
      isMounted = false;
    };
  }, []);

  const { stats, recentExpenses } = useMemo(() => {
    const calculatedStats = calculateExpenseStats(expenses);
    const sorted = [...expenses].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return {
      stats: calculatedStats,
      recentExpenses: sorted.slice(0, 10),
    };
  }, [expenses]);

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
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_2px_4px_rgba(0,0,0,0.5)]">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-sm text-[#A1A1A4]">
            Financial summary and status breakdown of organization expenses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/expenses")}
          className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity shadow-md cursor-pointer self-start"
        >
          View All Expenses
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div
          className="flex min-h-64 items-center justify-center p-6"
          style={darkGlassCardStyle}
        >
          <p className="text-sm text-[#A1A1A4]">Loading expense report data...</p>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div
          className="p-6 text-center"
          style={darkGlassCardStyle}
        >
          <p className="text-sm font-medium text-red-400" role="alert">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-opacity cursor-pointer shadow-md"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && expenses.length === 0 && (
        <div
          className="flex min-h-64 items-center justify-center p-6"
          style={darkGlassCardStyle}
        >
          <div className="text-center">
            <h3 className="text-base font-bold text-[#F5F6F5]">
              No expense data available
            </h3>
            <p className="mt-1 text-sm text-[#A1A1A4]">
              There are currently no expenses submitted in the system to generate reports.
            </p>
          </div>
        </div>
      )}

      {/* Report Dashboard Content */}
      {!isLoading && !error && expenses.length > 0 && (
        <>
          {/* Summary Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div
              className="p-6 transition-all duration-200 hover:border-white/30"
              style={darkGlassCardStyle}
            >
              <p className="text-sm font-medium text-[#A1A1A4]">Total Expenses</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
                {stats.totalCount}
              </p>
              <p className="mt-1 text-xs text-[#A1A1A4]">Total submitted records</p>
            </div>

            <div
              className="p-6 transition-all duration-200 hover:border-white/30"
              style={darkGlassCardStyle}
            >
              <p className="text-sm font-medium text-[#A1A1A4]">Total Expense Amount</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
                {formatAmount(stats.totalAmount)}
              </p>
              <p className="mt-1 text-xs text-[#A1A1A4]">Cumulative monetary value</p>
            </div>

            <div
              className="p-6 transition-all duration-200 hover:border-white/30"
              style={darkGlassCardStyle}
            >
              <p className="text-sm font-medium text-[#A1A1A4]">Approved Amount</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
                {formatAmount(stats.statusBreakdown.APPROVED.amount)}
              </p>
              <p className="mt-1 text-xs text-[#A1A1A4]">
                {stats.statusBreakdown.APPROVED.count} expense(s) approved (
                {stats.statusBreakdown.APPROVED.amountPercentage}% of total)
              </p>
            </div>

            <div
              className="p-6 transition-all duration-200 hover:border-white/30"
              style={darkGlassCardStyle}
            >
              <p className="text-sm font-medium text-[#A1A1A4]">Pending Approvals</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
                {formatAmount(stats.statusBreakdown.PENDING.amount)}
              </p>
              <p className="mt-1 text-xs text-[#A1A1A4]">
                {stats.statusBreakdown.PENDING.count} expense(s) pending decision
              </p>
            </div>

            <div
              className="p-6 transition-all duration-200 hover:border-white/30"
              style={darkGlassCardStyle}
            >
              <p className="text-sm font-medium text-[#A1A1A4]">In Review</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
                {formatAmount(stats.statusBreakdown.IN_REVIEW.amount)}
              </p>
              <p className="mt-1 text-xs text-[#A1A1A4]">
                {stats.statusBreakdown.IN_REVIEW.count} expense(s) under review
              </p>
            </div>

            <div
              className="p-6 transition-all duration-200 hover:border-white/30"
              style={darkGlassCardStyle}
            >
              <p className="text-sm font-medium text-[#A1A1A4]">Rejected Amount</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
                {formatAmount(stats.statusBreakdown.REJECTED.amount)}
              </p>
              <p className="mt-1 text-xs text-[#A1A1A4]">
                {stats.statusBreakdown.REJECTED.count} expense(s) rejected
              </p>
            </div>
          </div>

          {/* Status Breakdown Section */}
          <div
            className="overflow-hidden"
            style={darkGlassCardStyle}
          >
            <div className="border-b border-white/10 p-6">
              <h2 className="text-lg font-bold text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
                Expense Status Breakdown
              </h2>
              <p className="mt-1 text-sm text-[#A1A1A4]">
                Detailed metrics by expense approval state.
              </p>
            </div>

            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-white/10 text-[#F5F6F5]">
                    <tr>
                      <th className="px-4 py-3 font-bold text-[#F5F6F5]">Status</th>
                      <th className="px-4 py-3 font-bold text-[#F5F6F5]">Count</th>
                      <th className="px-4 py-3 font-bold text-[#F5F6F5]">Count %</th>
                      <th className="px-4 py-3 font-bold text-[#F5F6F5]">Total Amount</th>
                      <th className="px-4 py-3 font-bold text-[#F5F6F5]">Amount %</th>
                      <th className="px-4 py-3 font-bold text-[#F5F6F5] w-1/4">Distribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {stats.statusList.map((item) => (
                      <tr key={item.status} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 font-medium">
                          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-black shadow-sm">
                            {statusLabels[item.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#F5F6F5]">{item.count}</td>
                        <td className="px-4 py-3 font-medium text-[#F5F6F5]">{item.countPercentage}%</td>
                        <td className="px-4 py-3 font-semibold text-[#F5F6F5]">{formatAmount(item.amount)}</td>
                        <td className="px-4 py-3 font-medium text-[#F5F6F5]">{item.amountPercentage}%</td>
                        <td className="px-4 py-3">
                          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-[#F5F6F5] h-2 rounded-full transition-all duration-300 shadow-sm"
                              style={{ width: `${item.amountPercentage}%` }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Category Notice */}
          <div
            className="p-4 text-xs rounded-r-xl"
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              borderLeft: "3px solid #B13A29",
              color: "#A1A1A4",
            }}
          >
            <span className="font-bold text-[#F5F6F5]">Note: </span>
            Category breakdown is omitted because the current backend response model (`Expense`) does not include a `category` field.
          </div>

          {/* Recent Expenses Table */}
          <div
            className="overflow-hidden"
            style={darkGlassCardStyle}
          >
            <div className="border-b border-white/10 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#F5F6F5] [text-shadow:_0_1px_3px_rgba(0,0,0,0.4)]">
                  Recent Expense Activity
                </h2>
                <p className="mt-1 text-sm text-[#A1A1A4]">
                  Top 10 recent submissions included in this report.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-white/10 text-[#F5F6F5]">
                  <tr>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Description</th>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Amount</th>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Submitted By</th>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Status</th>
                    <th className="px-6 py-4 font-bold text-[#F5F6F5]">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {recentExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-white/10 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-[#F5F6F5]">{expense.description}</td>
                      <td className="px-6 py-4 font-semibold text-[#F5F6F5]">{formatAmount(expense.amount)}</td>
                      <td className="px-6 py-4 font-medium text-[#F5F6F5]">{expense.submittedBy}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-black shadow-sm">
                          {statusLabels[expense.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[#A1A1A4]">{formatDate(expense.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReportsPage;