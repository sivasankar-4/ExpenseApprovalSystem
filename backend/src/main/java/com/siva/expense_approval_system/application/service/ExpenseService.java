package com.siva.expense_approval_system.application.service;

import java.util.List;

import com.siva.expense_approval_system.domain.model.Expense;

public interface ExpenseService {
    
    
    Expense createExpense(Expense expense);

    Expense submitExpense(Expense expense);
    Expense ApproveExpense(Expense expense);
    Expense RejectExpense(Expense expense);

    Expense getExpenseById(Long id);

    List<Expense> getAllExpenses();

    Expense updateExpense(Long id,Expense expense);

    void deleteExpense(Long id);


}
