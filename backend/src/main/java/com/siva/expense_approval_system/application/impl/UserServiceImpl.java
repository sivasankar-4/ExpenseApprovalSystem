package com.siva.expense_approval_system.application.impl;

import java.util.List;
import java.util.Objects;
import java.util.EnumMap;
import java.util.Map;

import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.siva.expense_approval_system.application.service.AuditService;
import com.siva.expense_approval_system.application.service.RefreshTokenService;
import com.siva.expense_approval_system.application.service.UserService;
import com.siva.expense_approval_system.application.service.InvitationNotificationService;
import com.siva.expense_approval_system.domain.enums.AccountStatus;
import com.siva.expense_approval_system.domain.enums.AuditActionType;
import com.siva.expense_approval_system.domain.enums.AuditEntityType;
import com.siva.expense_approval_system.domain.model.User;
import com.siva.expense_approval_system.domain.repository.UserRepository;
import com.siva.expense_approval_system.domain.repository.TenantRepository;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;
import com.siva.expense_approval_system.domain.enums.UserRole;
import com.siva.expense_approval_system.domain.enums.ExpenseStatus;
import com.siva.expense_approval_system.domain.model.ApprovalAction;
import com.siva.expense_approval_system.domain.model.ApprovalChain;
import com.siva.expense_approval_system.domain.repository.ApprovalActionRepository;
import com.siva.expense_approval_system.domain.repository.ApprovalChainRepository;
import com.siva.expense_approval_system.domain.repository.ExpenseRepository;

@Service
public class UserServiceImpl implements UserService{
    
    private static final Logger log = LoggerFactory.getLogger(UserServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final RefreshTokenService refreshTokenService;
    private final TenantRepository tenantRepository;
    private final ExpenseRepository expenseRepository;
    private final ApprovalChainRepository approvalChainRepository;
    private final ApprovalActionRepository approvalActionRepository;
    private final InvitationNotificationService notificationService;
    
    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
            CurrentUserService currentUserService,AuditService auditService,
            RefreshTokenService refreshTokenService, TenantRepository tenantRepository,
            ExpenseRepository expenseRepository, ApprovalChainRepository approvalChainRepository,
            ApprovalActionRepository approvalActionRepository,
            InvitationNotificationService notificationService){
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.refreshTokenService = refreshTokenService;
        this.tenantRepository = tenantRepository;
        this.expenseRepository = expenseRepository;
        this.approvalChainRepository = approvalChainRepository;
        this.approvalActionRepository = approvalActionRepository;
        this.notificationService = notificationService;
    }

    @Override
    public User createUser(@NonNull User user) {
        user.setTenant(currentUserService.getCurrentTenant());
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(Objects.requireNonNull(user, "User must not be null"));

        auditService.log(
    user.getTenant(),
    AuditActionType.CREATE,
    AuditEntityType.USER,
    savedUser.getId(),
    "Created employee"
);

      return savedUser;
    }

    @Override
    public User getUserById(@NonNull Long id) {
        return userRepository.findByIdAndTenantId(id, getCurrentTenantId())
                .orElseThrow(() -> new AccessDeniedException("User not found or does not belong to the current tenant."));
    }
    
    @Override
    public List<User> getAllUsers() {
        return userRepository.findAllByTenantId(getCurrentTenantId());
    }

    @Override
    @Transactional
    public User updateUser(@NonNull Long id, @NonNull User user) {
        Long tenantId = getCurrentTenantId();
        lockTenant(tenantId);
        User existingUser = userRepository.findByIdAndTenantIdForUpdate(id, tenantId)
                .orElseThrow(() -> new AccessDeniedException(
                        "User not found or does not belong to the current tenant."));
        UserRole previousRole = existingUser.getRole();
        UserRole requestedRole = user.getRole();
        if (requestedRole == null) {
            throw new IllegalArgumentException("Role is required.");
        }
        ensurePendingApprovalsRemainAssignable(
                tenantId,
                roleDeltas(previousRole, requestedRole));
        existingUser.setName(user.getName());
        existingUser.setEmail(user.getEmail());
        existingUser.setRole(user.getRole());
        if (previousRole != requestedRole) {
            invalidateCredentials(existingUser);
        }
        User updatedUser = userRepository.save(existingUser);
        if (previousRole != requestedRole) {
            auditService.log(
                    updatedUser.getTenant(),
                    AuditActionType.UPDATE,
                    AuditEntityType.USER,
                    updatedUser.getId(),
                    "User role changed for user " + updatedUser.getId()
                            + " from " + previousRole + " to " + requestedRole);
            notifyAfterCommit(() -> notifyIfEmailPresent(updatedUser.getEmail(),
                    () -> notificationService.sendRoleChanged(
                            updatedUser.getEmail(), previousRole.name(), requestedRole.name())));
        }
        return updatedUser;
    }

    @Override
    public void deleteUser(@NonNull Long id){
        User user = getUserById(id);

        userRepository.delete(user);
    }

    @Override
    @Transactional
    public User deactivateUser(@NonNull Long id) {
        Long tenantId = getCurrentTenantId();
        lockTenant(tenantId);
        User user = getUserForStatusChange(id);
        if (user.getAccountStatus() == AccountStatus.INACTIVE) {
            return user;
        }

        ensurePendingApprovalsRemainAssignable(tenantId, roleDeltas(user.getRole(), null));
        user.setAccountStatus(AccountStatus.INACTIVE);
        user.setAuthTokenVersion(user.getAuthTokenVersion() + 1);
        refreshTokenService.deleteByUser(user);
        User updatedUser = userRepository.save(user);

        auditService.log(
                user.getTenant(),
                AuditActionType.DEACTIVATE,
                AuditEntityType.USER,
                user.getId(),
                "User deactivated");
        notifyAfterCommit(() -> notifyIfEmailPresent(
                user.getEmail(), () -> notificationService.sendAccountDeactivated(user.getEmail())));

        return updatedUser;
    }

    @Override
    @Transactional
    public User reactivateUser(@NonNull Long id) {
        User user = getUserForStatusChange(id);
        if (user.getAccountStatus() == AccountStatus.ACTIVE) {
            return user;
        }

        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setAuthTokenVersion(user.getAuthTokenVersion() + 1);
        User updatedUser = userRepository.save(user);

        auditService.log(
                user.getTenant(),
                AuditActionType.REACTIVATE,
                AuditEntityType.USER,
                user.getId(),
                "User reactivated");
        notifyAfterCommit(() -> notifyIfEmailPresent(
                user.getEmail(), () -> notificationService.sendAccountReactivated(user.getEmail())));

        return updatedUser;
    }

    @Override
    @Transactional
    public User transferFinanceAdmin(@NonNull Long targetUserId) {
        User authenticatedUser = currentUserService.getCurrentUser();
        Long tenantId = getCurrentTenantId();
        if (authenticatedUser == null || authenticatedUser.getId() == null) {
            throw new AccessDeniedException("Authenticated user is required.");
        }
        if (authenticatedUser.getId().equals(targetUserId)) {
            throw new IllegalArgumentException("Finance Admin cannot be transferred to the current user.");
        }

        tenantRepository.findByIdForUpdate(tenantId)
                .orElseThrow(() -> new AccessDeniedException("Current tenant was not found."));

        User currentAdmin = userRepository.findByIdAndTenantIdForUpdate(authenticatedUser.getId(), tenantId)
                .orElseThrow(() -> new AccessDeniedException(
                        "Authenticated user does not belong to the current tenant."));
        if (currentAdmin.getRole() != UserRole.FINANCE_ADMIN) {
            throw new AccessDeniedException("Only the current Finance Admin can transfer this role.");
        }

        User targetUser = userRepository.findByIdAndTenantIdForUpdate(targetUserId, tenantId)
                .orElseThrow(() -> new AccessDeniedException(
                        "Target user not found or does not belong to the current tenant."));
        if (targetUser.getAccountStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Target user must be active.");
        }
        if (targetUser.getRole() == UserRole.FINANCE_ADMIN) {
            throw new IllegalArgumentException("Target user is already a Finance Admin.");
        }

        Map<UserRole, Integer> roleDeltas = new EnumMap<>(UserRole.class);
        addRoleDelta(roleDeltas, currentAdmin.getRole(), -1);
        addRoleDelta(roleDeltas, targetUser.getRole(), -1);
        addRoleDelta(roleDeltas, UserRole.MANAGER, 1);
        addRoleDelta(roleDeltas, UserRole.FINANCE_ADMIN, 1);
        ensurePendingApprovalsRemainAssignable(tenantId, roleDeltas);

        targetUser.setRole(UserRole.FINANCE_ADMIN);
        targetUser.setAuthTokenVersion(targetUser.getAuthTokenVersion() + 1);
        currentAdmin.setRole(UserRole.MANAGER);
        currentAdmin.setAuthTokenVersion(currentAdmin.getAuthTokenVersion() + 1);

        User savedTarget = userRepository.save(targetUser);
        userRepository.save(currentAdmin);
        refreshTokenService.deleteByUser(targetUser);
        refreshTokenService.deleteByUser(currentAdmin);
        auditService.log(
                currentAdmin.getTenant(),
                AuditActionType.TRANSFER_FINANCE_ADMIN,
                AuditEntityType.USER,
                savedTarget.getId(),
                "Finance Admin role transferred; outgoingAdminId=" + currentAdmin.getId()
                        + ", incomingAdminId=" + savedTarget.getId()
                        + ", tenantId=" + tenantId);
        notifyAfterCommit(() -> notificationService.sendFinanceAdminTransfer(
                currentAdmin.getEmail(), savedTarget.getEmail()));

        return savedTarget;
    }

    private User getUserForStatusChange(Long id) {
        return userRepository.findByIdAndTenantIdForUpdate(id, getCurrentTenantId())
                .orElseThrow(() -> new AccessDeniedException(
                        "User not found or does not belong to the current tenant."));
    }

    private void lockTenant(Long tenantId) {
        tenantRepository.findByIdForUpdate(tenantId)
                .orElseThrow(() -> new AccessDeniedException("Current tenant was not found."));
    }

    private void invalidateCredentials(User user) {
        user.setAuthTokenVersion(user.getAuthTokenVersion() + 1);
        refreshTokenService.deleteByUser(user);
    }

    private void notifyAfterCommit(Runnable notification) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        notification.run();
                    } catch (RuntimeException ex) {
                        log.error("Account notification delivery failed after commit", ex);
                    }
                }
            });
        } else {
            notification.run();
        }
    }

    private void notifyIfEmailPresent(String email, Runnable notification) {
        if (email != null && !email.isBlank()) {
            notification.run();
        }
    }

    private Map<UserRole, Integer> roleDeltas(UserRole previousRole, UserRole replacementRole) {
        Map<UserRole, Integer> deltas = new EnumMap<>(UserRole.class);
        addRoleDelta(deltas, previousRole, -1);
        addRoleDelta(deltas, replacementRole, 1);
        return deltas;
    }

    private void addRoleDelta(Map<UserRole, Integer> deltas, UserRole role, int delta) {
        if (role != null) {
            deltas.merge(role, delta, Integer::sum);
        }
    }

    private void ensurePendingApprovalsRemainAssignable(Long tenantId, Map<UserRole, Integer> roleDeltas) {
        List<ExpenseStatus> pendingStatuses = List.of(ExpenseStatus.PENDING, ExpenseStatus.IN_REVIEW);
        for (var expense : expenseRepository.findAllByTenantIdAndStatusIn(tenantId, pendingStatuses)) {
            List<ApprovalChain> chains = approvalChainRepository
                    .findByTenantAndMinAmountLessThanEqualAndMaxAmountGreaterThanEqualOrderByStepOrderAsc(
                            expense.getTenant(), expense.getAmount(), expense.getAmount());
            List<ApprovalAction> actions = approvalActionRepository
                    .findByExpenseIdOrderByWorkflowStepAsc(expense.getId());
            if (actions.size() >= chains.size()) {
                continue;
            }
            UserRole requiredRole = UserRole.valueOf(chains.get(actions.size()).getApproverRole().name());
            long activeApprovers = userRepository.countByTenantIdAndRoleAndAccountStatus(
                    tenantId, requiredRole, AccountStatus.ACTIVE);
            long remainingApprovers = activeApprovers + roleDeltas.getOrDefault(requiredRole, 0);
            if (remainingApprovers <= 0) {
                throw new com.siva.expense_approval_system.application.exception.WorkflowValidationException(
                        "Cannot change this account because it would strand a pending "
                                + requiredRole + " approval in the current tenant.");
            }
        }
    }

    private Long getCurrentTenantId() {
        if (currentUserService.getCurrentTenant() == null || currentUserService.getCurrentTenant().getId() == null) {
            throw new AccessDeniedException("Current user is not associated with a tenant.");
        }
        return currentUserService.getCurrentTenant().getId();
    }


}
