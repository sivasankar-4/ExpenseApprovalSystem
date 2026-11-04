package com.siva.expense_approval_system.application.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.lenient;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;
import java.math.BigDecimal;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.siva.expense_approval_system.application.service.AuditService;
import com.siva.expense_approval_system.application.service.RefreshTokenService;
import com.siva.expense_approval_system.application.service.InvitationNotificationService;
import com.siva.expense_approval_system.domain.enums.AccountStatus;
import com.siva.expense_approval_system.domain.enums.UserRole;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.model.User;
import com.siva.expense_approval_system.domain.model.Expense;
import com.siva.expense_approval_system.domain.model.ApprovalChain;
import com.siva.expense_approval_system.domain.repository.TenantRepository;
import com.siva.expense_approval_system.domain.repository.UserRepository;
import com.siva.expense_approval_system.domain.repository.ExpenseRepository;
import com.siva.expense_approval_system.domain.repository.ApprovalChainRepository;
import com.siva.expense_approval_system.domain.repository.ApprovalActionRepository;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private AuditService auditService;
    @Mock
    private RefreshTokenService refreshTokenService;
    @Mock
    private ExpenseRepository expenseRepository;
    @Mock
    private ApprovalChainRepository approvalChainRepository;
    @Mock
    private ApprovalActionRepository approvalActionRepository;
    @Mock
    private InvitationNotificationService notificationService;

    private UserServiceImpl service;
    private Tenant tenant;
    private User currentAdmin;

    @BeforeEach
    void setUp() {
        service = new UserServiceImpl(
                userRepository,
                null,
                currentUserService,
                auditService,
                refreshTokenService,
                tenantRepository,
                expenseRepository,
                approvalChainRepository,
                approvalActionRepository,
                notificationService);
        tenant = new Tenant(10L, "Tenant", LocalDateTime.now());
        currentAdmin = user(1L, UserRole.FINANCE_ADMIN, AccountStatus.ACTIVE);
        lenient().when(currentUserService.getCurrentTenant()).thenReturn(tenant);
        lenient().when(currentUserService.getCurrentUser()).thenReturn(currentAdmin);
        lenient().when(tenantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(tenant));
        lenient().when(userRepository.findByIdAndTenantIdForUpdate(1L, 10L)).thenReturn(Optional.of(currentAdmin));
    }

    @Test
    void transfersRoleAtomicallyAndInvalidatesBothAccounts() {
        User target = user(2L, UserRole.MANAGER, AccountStatus.ACTIVE);
        when(userRepository.findByIdAndTenantIdForUpdate(2L, 10L)).thenReturn(Optional.of(target));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        User result = service.transferFinanceAdmin(2L);

        assertEquals(UserRole.FINANCE_ADMIN, result.getRole());
        assertEquals(UserRole.MANAGER, currentAdmin.getRole());
        assertEquals(1L, result.getAuthTokenVersion());
        assertEquals(1L, currentAdmin.getAuthTokenVersion());
        verify(refreshTokenService).deleteByUser(target);
        verify(refreshTokenService).deleteByUser(currentAdmin);
        verify(auditService).log(
                tenant,
                com.siva.expense_approval_system.domain.enums.AuditActionType.TRANSFER_FINANCE_ADMIN,
                com.siva.expense_approval_system.domain.enums.AuditEntityType.USER,
                2L,
                "Finance Admin role transferred; outgoingAdminId=1, incomingAdminId=2, tenantId=10");
         verify(notificationService).sendFinanceAdminTransfer(
                currentAdmin.getEmail(), target.getEmail());
    }

    @Test
    void rejectsTargetFromAnotherTenantWithoutChangingRoles() {
        when(userRepository.findByIdAndTenantIdForUpdate(2L, 10L)).thenReturn(Optional.empty());

        assertThrows(AccessDeniedException.class, () -> service.transferFinanceAdmin(2L));

        assertEquals(UserRole.FINANCE_ADMIN, currentAdmin.getRole());
        verify(userRepository, never()).save(any(User.class));
        verify(refreshTokenService, never()).deleteByUser(any(User.class));
    }

    @Test
    void rejectsInactiveTargetWithoutChangingRoles() {
        User target = user(2L, UserRole.MANAGER, AccountStatus.INACTIVE);
        when(userRepository.findByIdAndTenantIdForUpdate(2L, 10L)).thenReturn(Optional.of(target));

        assertThrows(IllegalArgumentException.class, () -> service.transferFinanceAdmin(2L));

        assertEquals(UserRole.FINANCE_ADMIN, currentAdmin.getRole());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void rejectsNonFinanceAdminCallerBeforeLoadingTarget() {
        currentAdmin.setRole(UserRole.MANAGER);

        assertThrows(AccessDeniedException.class, () -> service.transferFinanceAdmin(2L));

        verify(userRepository, never()).findByIdAndTenantIdForUpdate(2L, 10L);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void rejectsSelfTransferWithoutChangingRoles() {
        assertThrows(IllegalArgumentException.class, () -> service.transferFinanceAdmin(1L));

        verify(tenantRepository, never()).findByIdForUpdate(any());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void blocksDeactivationWhenItWouldStrandPendingApproval() {
        currentAdmin.setRole(UserRole.MANAGER);
        Expense pendingExpense = new Expense();
        pendingExpense.setTenant(tenant);
        pendingExpense.setAmount(BigDecimal.TEN);
        ApprovalChain chain = new ApprovalChain();
        chain.setTenant(tenant);
        chain.setMinAmount(BigDecimal.ZERO);
        chain.setMaxAmount(BigDecimal.valueOf(100));
        chain.setStepOrder(1);
        chain.setApproverRole(com.siva.expense_approval_system.domain.enums.Role.MANAGER);
        when(expenseRepository.findAllByTenantIdAndStatusIn(10L, List.of(
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.PENDING,
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.IN_REVIEW)))
                .thenReturn(List.of(pendingExpense));
        when(approvalChainRepository
                .findByTenantAndMinAmountLessThanEqualAndMaxAmountGreaterThanEqualOrderByStepOrderAsc(
                        tenant, BigDecimal.TEN, BigDecimal.TEN))
                .thenReturn(List.of(chain));
        when(approvalActionRepository.findByExpenseIdOrderByWorkflowStepAsc(null)).thenReturn(List.of());
        when(userRepository.countByTenantIdAndRoleAndAccountStatus(
                10L, UserRole.MANAGER, AccountStatus.ACTIVE)).thenReturn(1L);

        assertThrows(com.siva.expense_approval_system.application.exception.WorkflowValidationException.class,
                () -> service.deactivateUser(1L));

        assertEquals(AccountStatus.ACTIVE, currentAdmin.getAccountStatus());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void allowsDeactivationWhenNoPendingApprovalIsAffected() {
        when(expenseRepository.findAllByTenantIdAndStatusIn(10L, List.of(
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.PENDING,
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.IN_REVIEW)))
                .thenReturn(List.of());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.deactivateUser(1L);

        assertEquals(AccountStatus.INACTIVE, currentAdmin.getAccountStatus());
        verify(refreshTokenService).deleteByUser(currentAdmin);
        verify(auditService).log(
                tenant,
                com.siva.expense_approval_system.domain.enums.AuditActionType.DEACTIVATE,
                com.siva.expense_approval_system.domain.enums.AuditEntityType.USER,
                1L,
                "User deactivated");
         verify(notificationService).sendAccountDeactivated(currentAdmin.getEmail());
    }

    @Test
    void blocksRoleChangeWhenItWouldRemoveTheOnlyRequiredApprover() {
        currentAdmin.setRole(UserRole.MANAGER);
        User requestedUser = user(1L, UserRole.EMPLOYEE, AccountStatus.ACTIVE);
        when(expenseRepository.findAllByTenantIdAndStatusIn(10L, List.of(
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.PENDING,
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.IN_REVIEW)))
                .thenReturn(List.of(pendingExpense()));
        when(approvalChainRepository
                .findByTenantAndMinAmountLessThanEqualAndMaxAmountGreaterThanEqualOrderByStepOrderAsc(
                        tenant, BigDecimal.TEN, BigDecimal.TEN))
                .thenReturn(List.of(managerChain()));
        when(approvalActionRepository.findByExpenseIdOrderByWorkflowStepAsc(null)).thenReturn(List.of());
        when(userRepository.countByTenantIdAndRoleAndAccountStatus(
                10L, UserRole.MANAGER, AccountStatus.ACTIVE)).thenReturn(1L);

        assertThrows(com.siva.expense_approval_system.application.exception.WorkflowValidationException.class,
                () -> service.updateUser(1L, requestedUser));

        assertEquals(UserRole.MANAGER, currentAdmin.getRole());
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void recordsOneAuditEventWhenUserRoleChanges() {
        User requestedUser = user(1L, UserRole.MANAGER, AccountStatus.ACTIVE);
        when(expenseRepository.findAllByTenantIdAndStatusIn(10L, List.of(
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.PENDING,
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.IN_REVIEW)))
                .thenReturn(List.of());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateUser(1L, requestedUser);

        verify(auditService).log(
                tenant,
                com.siva.expense_approval_system.domain.enums.AuditActionType.UPDATE,
                com.siva.expense_approval_system.domain.enums.AuditEntityType.USER,
                1L,
                "User role changed for user 1 from FINANCE_ADMIN to MANAGER");
         verify(notificationService).sendRoleChanged(
                currentAdmin.getEmail(), "FINANCE_ADMIN", "MANAGER");
    }

    @Test
    void preservesExistingPasswordWhenProfileAndRoleAreUpdated() {
        String existingPassword = currentAdmin.getPassword();
        User requestedUser = user(1L, UserRole.MANAGER, AccountStatus.ACTIVE);
        requestedUser.setPassword(null);
        when(expenseRepository.findAllByTenantIdAndStatusIn(10L, List.of(
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.PENDING,
                com.siva.expense_approval_system.domain.enums.ExpenseStatus.IN_REVIEW)))
                .thenReturn(List.of());
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.updateUser(1L, requestedUser);

        assertEquals(existingPassword, currentAdmin.getPassword());
    }

    @Test
    void recordsReactivationAuditEvent() {
        currentAdmin.setAccountStatus(AccountStatus.INACTIVE);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.reactivateUser(1L);

        verify(auditService).log(
                tenant,
                com.siva.expense_approval_system.domain.enums.AuditActionType.REACTIVATE,
                com.siva.expense_approval_system.domain.enums.AuditEntityType.USER,
                1L,
                "User reactivated");
         verify(notificationService).sendAccountReactivated(currentAdmin.getEmail());
    }

    private Expense pendingExpense() {
        Expense pendingExpense = new Expense();
        pendingExpense.setTenant(tenant);
        pendingExpense.setAmount(BigDecimal.TEN);
        return pendingExpense;
    }

    private ApprovalChain managerChain() {
        ApprovalChain chain = new ApprovalChain();
        chain.setTenant(tenant);
        chain.setMinAmount(BigDecimal.ZERO);
        chain.setMaxAmount(BigDecimal.valueOf(100));
        chain.setStepOrder(1);
        chain.setApproverRole(com.siva.expense_approval_system.domain.enums.Role.MANAGER);
        return chain;
    }

    private User user(Long id, UserRole role, AccountStatus status) {
        User user = new User(id, tenant, "User " + id, "user" + id + "@example.com", "password", role,
                LocalDateTime.now());
        user.setAccountStatus(status);
        return user;
    }
}
