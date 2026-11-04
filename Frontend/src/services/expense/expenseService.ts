import api from "@/services/api/axios";

import type {
  Expense,
  CreateExpenseRequest,
  UpdateExpenseRequest,
} from "@/types/expense";

export const expenseService = {
  async getAllExpenses(): Promise<Expense[]> {
    const response = await api.get<Expense[]>("/expenses");

    return response.data;
  },

  async getExpenseById(id: number): Promise<Expense> {
    const response = await api.get<Expense>(`/expenses/${id}`);

    return response.data;
  },

  async approveExpense(id: number): Promise<Expense> {
    const response = await api.put<Expense>(`/expenses/${id}/approve`);

    return response.data;
  },

  async rejectExpense(id: number): Promise<Expense> {
    const response = await api.put<Expense>(`/expenses/${id}/reject`);

    return response.data;
  },

  async createExpense(
    data: CreateExpenseRequest
  ): Promise<Expense> {
    const response = await api.post<Expense>(
      "/expenses",
      data
    );

    return response.data;
  },

  async updateExpense(id: number, data: UpdateExpenseRequest): Promise<Expense> {
    const response = await api.put<Expense>(`/expenses/${id}`, data);

    return response.data;
  },

  async deleteExpense(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },
};
