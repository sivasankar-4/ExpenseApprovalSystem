import type { Expense, ExpenseStatus } from "@/types/expense";

export const statusLabels: Record<ExpenseStatus, string> = {
  PENDING: "Pending",
  IN_REVIEW: "In review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const statusClasses: Record<ExpenseStatus, string> = {
  PENDING: "bg-gray-100 text-gray-700 border border-gray-300",
  IN_REVIEW: "bg-gray-200 text-gray-800 border border-gray-400",
  APPROVED: "bg-black text-white",
  REJECTED: "bg-gray-100 text-gray-500 border border-gray-200",
};

export const formatAmount = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount);

export const formatDate = (createdAt: string): string => {
  const date = new Date(createdAt);

  return Number.isNaN(date.getTime())
    ? createdAt
    : new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
};

export interface StatusStat {
  status: ExpenseStatus;
  label: string;
  count: number;
  amount: number;
  countPercentage: number;
  amountPercentage: number;
}

export interface ExpenseReportStats {
  totalCount: number;
  totalAmount: number;
  statusBreakdown: Record<ExpenseStatus, StatusStat>;
  statusList: StatusStat[];
}

export const calculateExpenseStats = (expenses: Expense[]): ExpenseReportStats => {
  const totalCount = expenses.length;
  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const initialStatusStats: Record<ExpenseStatus, { count: number; amount: number }> = {
    PENDING: { count: 0, amount: 0 },
    IN_REVIEW: { count: 0, amount: 0 },
    APPROVED: { count: 0, amount: 0 },
    REJECTED: { count: 0, amount: 0 },
  };

  expenses.forEach((expense) => {
    if (initialStatusStats[expense.status]) {
      initialStatusStats[expense.status].count += 1;
      initialStatusStats[expense.status].amount += expense.amount;
    }
  });

  const statuses: ExpenseStatus[] = ["PENDING", "IN_REVIEW", "APPROVED", "REJECTED"];

  const statusBreakdown = {} as Record<ExpenseStatus, StatusStat>;
  const statusList: StatusStat[] = [];

  statuses.forEach((status) => {
    const { count, amount } = initialStatusStats[status];
    const countPercentage = totalCount > 0 ? (count / totalCount) * 100 : 0;
    const amountPercentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

    const stat: StatusStat = {
      status,
      label: statusLabels[status],
      count,
      amount,
      countPercentage: Math.round(countPercentage * 10) / 10,
      amountPercentage: Math.round(amountPercentage * 10) / 10,
    };

    statusBreakdown[status] = stat;
    statusList.push(stat);
  });

  return {
    totalCount,
    totalAmount,
    statusBreakdown,
    statusList,
  };
};
