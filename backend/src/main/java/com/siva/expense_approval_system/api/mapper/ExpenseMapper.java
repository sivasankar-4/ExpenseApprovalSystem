package com.siva.expense_approval_system.api.mapper;

import java.time.LocalDateTime;

import org.springframework.stereotype.Component;

import com.siva.expense_approval_system.api.dto.request.CreateExpenseRequest;
import com.siva.expense_approval_system.api.dto.request.UpdateExpenseRequest;
import com.siva.expense_approval_system.api.dto.response.ExpenseResponse;
import com.siva.expense_approval_system.domain.enums.ExpenseStatus;
import com.siva.expense_approval_system.domain.model.Expense;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.model.User;

@Component
public class ExpenseMapper {
    

    public Expense toEntity(CreateExpenseRequest request,Tenant tenant,User submittedBy){

         Expense expense = new Expense();

         expense.setTenant(tenant);
         expense.setSubmittedBy(submittedBy);
         expense.setAmount(request.getAmount());
         expense.setCurrency(request.getCurrency());
         expense.setCategory(request.getCategory());
         expense.setDescription(request.getDescription());
         expense.setStatus(ExpenseStatus.PENDING);
         expense.setCreatedAt(LocalDateTime.now());

         return expense;

    }

    public void updateEntity(UpdateExpenseRequest request,Expense expense){
    
        expense.setAmount(request.getAmount());
        expense.setDescription(request.getDescription());
         
    }

    public ExpenseResponse toResponse(Expense expense){
 
         ExpenseResponse response = new ExpenseResponse();
         
         response.setId(expense.getId());
         response.setAmount(expense.getAmount());
         response.setDescription(expense.getDescription());
         response.setStatus(expense.getStatus().name());

         response.setSubmittedBy(expense.getSubmittedBy().getName());
         response.setTenantName(expense.getTenant().getName());
         response.setCreatedAt(expense.getCreatedAt());

         return response;

    }
}
