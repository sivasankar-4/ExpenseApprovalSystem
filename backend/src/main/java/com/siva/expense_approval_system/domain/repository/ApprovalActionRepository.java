package com.siva.expense_approval_system.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siva.expense_approval_system.domain.model.ApprovalAction;

public interface ApprovalActionRepository extends JpaRepository<ApprovalAction,Long> {

    Optional<ApprovalAction> findByIdAndExpenseTenantId(Long id, Long tenantId);

    List<ApprovalAction> findAllByExpenseTenantId(Long tenantId);

    List<ApprovalAction> findByExpenseIdOrderByWorkflowStepAsc(Long expenseId);
}
