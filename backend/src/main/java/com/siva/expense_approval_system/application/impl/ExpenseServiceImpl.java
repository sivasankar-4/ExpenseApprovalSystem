package com.siva.expense_approval_system.application.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.siva.expense_approval_system.application.exception.WorkflowValidationException;
import com.siva.expense_approval_system.application.service.AuditService;
import com.siva.expense_approval_system.application.service.ExpenseService;
import com.siva.expense_approval_system.domain.enums.ApprovalActionStatus;
import com.siva.expense_approval_system.domain.enums.AuditActionType;
import com.siva.expense_approval_system.domain.enums.AuditEntityType;
import com.siva.expense_approval_system.domain.enums.ExpenseStatus;
import com.siva.expense_approval_system.domain.enums.UserRole;
import com.siva.expense_approval_system.domain.model.ApprovalChain;
import com.siva.expense_approval_system.domain.model.ApprovalAction;
import com.siva.expense_approval_system.domain.model.Expense;
import com.siva.expense_approval_system.domain.model.User;
import com.siva.expense_approval_system.domain.repository.ApprovalChainRepository;
import com.siva.expense_approval_system.domain.repository.ApprovalActionRepository;
import com.siva.expense_approval_system.domain.repository.ExpenseRepository;
import com.siva.expense_approval_system.domain.repository.TenantRepository;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;

@Service
public class ExpenseServiceImpl implements ExpenseService{

    private static final Logger log = LoggerFactory.getLogger(ExpenseServiceImpl.class);

     private final ExpenseRepository expenseRepository;

     private final ApprovalChainRepository approvalChainRepository;
     private final ApprovalActionRepository approvalActionRepository;
     private final CurrentUserService currentUserService;
     private final AuditService auditService;
     private final TenantRepository tenantRepository;

     public ExpenseServiceImpl(ExpenseRepository expenseRepository, ApprovalChainRepository approvalChainRepository,
             ApprovalActionRepository approvalActionRepository,
             CurrentUserService currentUserService,AuditService auditService,
             TenantRepository tenantRepository){
        this.expenseRepository = expenseRepository;
        this.approvalChainRepository = approvalChainRepository;
        this.approvalActionRepository = approvalActionRepository;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.tenantRepository = tenantRepository;
     }
     
     @Override
     @Transactional
     public Expense createExpense(Expense expense){
        expense.setStatus(ExpenseStatus.PENDING);
        return expenseRepository.save(expense);
     }
     @Override
     public Expense submitExpense(Expense expense){

      if (!Objects.equals(
              expense.getTenant().getId(),
              expense.getSubmittedBy().getTenant().getId())) {
          throw new IllegalArgumentException(
              "User does not belong to the expense's tenant.");
      }

      if(expense.getAmount().compareTo(BigDecimal.ZERO) <= 0){
          throw new IllegalArgumentException("Amount must greater than Zero");
      }

      if(expense.getDescription() == null || expense.getDescription().trim().isEmpty()){
         throw new IllegalArgumentException("Description Cannot be Empty");
      }
       List<ApprovalChain> approvalChains = getApprovalChains(expense);

      log.debug("submitExpense amount={}, tenantId={}, approvalChains={}",
              expense.getAmount(),
              expense.getTenant() != null ? expense.getTenant().getId() : null,
              approvalChains.stream()
                      .map(chain -> "step=" + chain.getStepOrder() + ",min=" + chain.getMinAmount() + ",max=" + chain.getMaxAmount())
                      .toList());

      expense.setStatus(ExpenseStatus.PENDING);
      Expense savedExpense = expenseRepository.save(expense);

  auditService.log(
    expense.getTenant(),
    AuditActionType.CREATE,
    AuditEntityType.EXPENSE,
    expense.getId(),
    "Expense created"
);

     return savedExpense;
     }

     @Override
     @Transactional
     public Expense ApproveExpense(Expense expense) {
        lockCurrentTenant();
        Expense tenantExpense = getExpenseForUpdate(expense.getId());
        List<ApprovalChain> approvalChains = getApprovalChains(tenantExpense);
        List<ApprovalAction> actions = approvalActionRepository.findByExpenseIdOrderByWorkflowStepAsc(tenantExpense.getId());
        ApprovalChain expectedStep = getExpectedStep(tenantExpense, approvalChains, actions);
        validateApproverRole(expectedStep);
        ensureActionNotRecorded(actions, expectedStep.getStepOrder());

        approvalActionRepository.save(createApprovalAction(tenantExpense, expectedStep, ApprovalActionStatus.APPROVED));

        boolean hasRemainingSteps = approvalChains.stream()
                .anyMatch(chain -> chain.getStepOrder() > expectedStep.getStepOrder());
        tenantExpense.setStatus(hasRemainingSteps ? ExpenseStatus.IN_REVIEW : ExpenseStatus.APPROVED);

        log.debug("approveExpense expenseId={}, tenantId={}, approvedStep={}, finalApproval={}",
                tenantExpense.getId(),
                tenantExpense.getTenant() != null ? tenantExpense.getTenant().getId() : null,
                expectedStep.getStepOrder(), !hasRemainingSteps);
        Expense savedApprovedExpense = expenseRepository.save(tenantExpense);
        auditService.log(
    tenantExpense.getTenant(),
    AuditActionType.APPROVE,
    AuditEntityType.EXPENSE,
    tenantExpense.getId(),
    "Workflow Step : " + expectedStep.getStepOrder()
);

return savedApprovedExpense;
     }

     @Override
     @Transactional
     public Expense RejectExpense(Expense expense) {
        lockCurrentTenant();
        Expense tenantExpense = getExpenseForUpdate(expense.getId());
        List<ApprovalChain> approvalChains = getApprovalChains(tenantExpense);
        List<ApprovalAction> actions = approvalActionRepository.findByExpenseIdOrderByWorkflowStepAsc(tenantExpense.getId());
        ApprovalChain expectedStep = getExpectedStep(tenantExpense, approvalChains, actions);
        validateApproverRole(expectedStep);
        ensureActionNotRecorded(actions, expectedStep.getStepOrder());
        approvalActionRepository.save(createApprovalAction(tenantExpense, expectedStep, ApprovalActionStatus.REJECTED));
        tenantExpense.setStatus(ExpenseStatus.REJECTED);
        Expense savedRejectExpense = expenseRepository.save(tenantExpense);
        auditService.log(
    tenantExpense.getTenant(),
    AuditActionType.REJECT,
    AuditEntityType.EXPENSE,
    tenantExpense.getId(),
    "Rejected"
);

      return savedRejectExpense;
     }

     @Override
     public Expense getExpenseById(Long id) {
        Expense expense = expenseRepository.findByIdAndTenantId(id, getCurrentTenantId())
                .orElseThrow(() -> new AccessDeniedException("Expense not found or does not belong to the current tenant."));
        validateEmployeeOwnership(expense);
        return expense;
     }

     @Override
     public List<Expense> getAllExpenses() {
        Long tenantId = getCurrentTenantId();
        User currentUser = currentUserService.getCurrentUser();
        if (currentUser.getRole() == UserRole.EMPLOYEE) {
            return expenseRepository.findAllByTenantIdAndSubmittedById(tenantId, currentUser.getId());
        }
        return expenseRepository.findAllByTenantId(tenantId);
     }

     @Override
     @Transactional
     public Expense updateExpense(Long id, Expense expense) {
        Expense existingExpense = getExpenseById(id);
        existingExpense.setTenant(expense.getTenant());
        existingExpense.setSubmittedBy(expense.getSubmittedBy());
        existingExpense.setAmount(expense.getAmount());
        existingExpense.setCurrency(expense.getCurrency());
        existingExpense.setCategory(expense.getCategory());
        existingExpense.setDescription(expense.getDescription());
        existingExpense.setStatus(expense.getStatus());
        return expenseRepository.save(existingExpense);
     }

     @Override
     @Transactional
     public void deleteExpense(Long id) {
        expenseRepository.delete(getExpenseById(id));
     }

     private List<ApprovalChain> getApprovalChains(Expense expense) {
        List<ApprovalChain> approvalChains =
                approvalChainRepository.findByTenantAndMinAmountLessThanEqualAndMaxAmountGreaterThanEqualOrderByStepOrderAsc(
                        expense.getTenant(), expense.getAmount(), expense.getAmount());

        if (approvalChains.isEmpty()) {
            throw new WorkflowValidationException("No approval workflow is configured for this expense amount.");
        }

        for (int index = 1; index < approvalChains.size(); index++) {
            if (approvalChains.get(index - 1).getStepOrder().equals(approvalChains.get(index).getStepOrder())) {
                throw new WorkflowValidationException("The approval workflow contains duplicate step orders.");
            }
        }
        return approvalChains;
     }

     private ApprovalChain getExpectedStep(Expense expense, List<ApprovalChain> approvalChains,
             List<ApprovalAction> actions) {
        if (expense.getStatus() != ExpenseStatus.PENDING && expense.getStatus() != ExpenseStatus.IN_REVIEW) {
            throw new WorkflowValidationException("Only pending or in-review expenses can be approved or rejected.");
        }
        if (actions.stream().anyMatch(action -> action.getAction() == ApprovalActionStatus.REJECTED)) {
            throw new WorkflowValidationException("A rejected expense cannot receive further workflow actions.");
        }
        if (actions.size() >= approvalChains.size()) {
            throw new WorkflowValidationException("All workflow steps have already been completed.");
        }
        for (int index = 0; index < actions.size(); index++) {
            ApprovalAction action = actions.get(index);
            ApprovalChain configuredStep = approvalChains.get(index);
            if (action.getAction() != ApprovalActionStatus.APPROVED
                    || !Objects.equals(action.getWorkflowStep(), configuredStep.getStepOrder())) {
                throw new WorkflowValidationException("Approval history does not match the configured workflow.");
            }
        }
        return approvalChains.get(actions.size());
     }

     private void validateApproverRole(ApprovalChain expectedStep) {
        User currentUser = currentUserService.getCurrentUser();
        if (!currentUser.getRole().name().equals(expectedStep.getApproverRole().name())) {
            throw new AccessDeniedException("Your role is not authorized for the current approval step.");
        }
     }

     private void ensureActionNotRecorded(List<ApprovalAction> actions, Integer stepOrder) {
        if (actions.stream().anyMatch(action -> Objects.equals(action.getWorkflowStep(), stepOrder))) {
            throw new WorkflowValidationException("An action has already been recorded for this workflow step.");
        }
     }

     private ApprovalAction createApprovalAction(Expense expense, ApprovalChain step, ApprovalActionStatus action) {
        ApprovalAction approvalAction = new ApprovalAction();
        approvalAction.setExpense(expense);
        approvalAction.setApprover(currentUserService.getCurrentUser());
        approvalAction.setAction(action);
        approvalAction.setWorkflowStep(step.getStepOrder());
        approvalAction.setActedAt(java.time.LocalDateTime.now());
        return approvalAction;
     }

     private Long getCurrentTenantId() {
        if (currentUserService.getCurrentTenant() == null || currentUserService.getCurrentTenant().getId() == null) {
            throw new AccessDeniedException("Current user is not associated with a tenant.");
        }
        return currentUserService.getCurrentTenant().getId();
     }

     private Expense getExpenseForUpdate(Long id) {
        Expense expense = expenseRepository.findByIdAndTenantIdForUpdate(id, getCurrentTenantId())
                .orElseThrow(() -> new AccessDeniedException(
                        "Expense not found or does not belong to the current tenant."));
        validateEmployeeOwnership(expense);
        return expense;
     }

     private void lockCurrentTenant() {
        tenantRepository.findByIdForUpdate(getCurrentTenantId())
                .orElseThrow(() -> new AccessDeniedException("Current tenant was not found."));
     }

     private void validateEmployeeOwnership(Expense expense) {
        User currentUser = currentUserService.getCurrentUser();
        if (currentUser.getRole() == UserRole.EMPLOYEE
                && !Objects.equals(expense.getSubmittedBy().getId(), currentUser.getId())) {
            throw new AccessDeniedException("Employees may only access their own expenses.");
        }
     }
}
