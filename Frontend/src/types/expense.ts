export type ExpenseStatus =
  | "PENDING"
  | "IN_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface Expense {
  id: number;
  submittedBy: string;
  amount: number;
  description: string;
  status: ExpenseStatus;
  currency?: string;
  category?: string;
  tenantName: string;
  createdAt: string;
}

export interface CreateExpenseRequest {
  amount: number;
  currency: string;
  category: string;
  description: string;
}

export type UpdateExpenseRequest = CreateExpenseRequest;