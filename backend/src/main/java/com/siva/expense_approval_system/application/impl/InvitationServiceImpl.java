package com.siva.expense_approval_system.application.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.server.ResponseStatusException;

import com.siva.expense_approval_system.api.dto.request.AcceptInvitationRequest;
import com.siva.expense_approval_system.api.dto.request.CreateInvitationRequest;
import com.siva.expense_approval_system.api.dto.response.InvitationResponse;
import com.siva.expense_approval_system.application.service.AuditService;
import com.siva.expense_approval_system.application.service.InvitationNotificationService;
import com.siva.expense_approval_system.application.service.InvitationService;
import com.siva.expense_approval_system.domain.enums.AccountStatus;
import com.siva.expense_approval_system.domain.enums.AuditActionType;
import com.siva.expense_approval_system.domain.enums.AuditEntityType;
import com.siva.expense_approval_system.domain.enums.UserRole;
import com.siva.expense_approval_system.domain.model.Invitation;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.model.User;
import com.siva.expense_approval_system.domain.repository.InvitationRepository;
import com.siva.expense_approval_system.domain.repository.TenantRepository;
import com.siva.expense_approval_system.domain.repository.UserRepository;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;

@Service
public class InvitationServiceImpl implements InvitationService {

    private static final int TOKEN_BYTES = 32;
    private static final Logger log = LoggerFactory.getLogger(InvitationServiceImpl.class);

    private final InvitationRepository invitationRepository;
    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final CurrentUserService currentUserService;
    private final AuditService auditService;
    private final InvitationNotificationService notificationService;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${security.invitation.expiration-hours:72}")
    private long invitationExpirationHours;

    public InvitationServiceImpl(
            InvitationRepository invitationRepository,
            TenantRepository tenantRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            CurrentUserService currentUserService,
            AuditService auditService,
            InvitationNotificationService notificationService) {
        this.invitationRepository = invitationRepository;
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.currentUserService = currentUserService;
        this.auditService = auditService;
        this.notificationService = notificationService;
    }

    @Override
    @Transactional
    public InvitationResponse createInvitation(CreateInvitationRequest request) {
        if (request.getRole() == UserRole.FINANCE_ADMIN) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Invitations cannot assign the FINANCE_ADMIN role");
        }

        String email = normalizeEmail(request.getEmail());
        Tenant tenant = lockCurrentTenant();

        if (userRepository.findByEmail(email).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists");
        }

        LocalDateTime now = LocalDateTime.now();
        invitationRepository.findActiveByTenantAndEmailForUpdate(tenant.getId(), email)
                .ifPresent(existing -> {
                    if (existing.getExpiresAt().isAfter(now)) {
                        throw new ResponseStatusException(
                                HttpStatus.CONFLICT,
                                "An active invitation already exists for this email");
                    }
                    existing.setRevoked(true);
                    invitationRepository.save(existing);
                });

        String rawToken = generateToken();
        Invitation invitation = new Invitation();
        invitation.setTenant(tenant);
        invitation.setEmail(email);
        invitation.setRole(request.getRole());
        invitation.setTokenHash(hashToken(rawToken));
        invitation.setExpiresAt(now.plusHours(invitationExpirationHours));
        invitation.setRevoked(false);
        invitation.setCreatedAt(now);
        Invitation saved = invitationRepository.save(invitation);

        auditService.log(
                tenant,
                AuditActionType.INVITE,
                AuditEntityType.INVITATION,
                saved.getId(),
                "Invitation created for " + email);
        notifyAfterCommit(() -> notificationService.sendInvitation(email, rawToken, saved.getExpiresAt()));

        InvitationResponse response = new InvitationResponse();
        response.setId(saved.getId());
        response.setEmail(saved.getEmail());
        response.setRole(saved.getRole());
        response.setToken(rawToken);
        response.setExpiresAt(saved.getExpiresAt());
        return response;
    }

    @Override
    @Transactional
    public InvitationResponse resendInvitation(Long invitationId) {
        Tenant tenant = lockCurrentTenant();
        Invitation invitation = invitationRepository
                .findByIdAndTenantIdForUpdate(invitationId, tenant.getId())
                .orElseThrow(() -> new AccessDeniedException(
                        "Invitation not found or does not belong to the current tenant."));
        if (Boolean.TRUE.equals(invitation.getRevoked()) || invitation.getUsedAt() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Accepted or revoked invitations cannot be resent.");
        }

        LocalDateTime now = LocalDateTime.now();
        String rawToken = generateToken();
        invitation.setTokenHash(hashToken(rawToken));
        invitation.setExpiresAt(now.plusHours(invitationExpirationHours));
        invitationRepository.save(invitation);

        auditService.log(
                tenant,
                AuditActionType.INVITE,
                AuditEntityType.INVITATION,
                invitation.getId(),
                "Invitation resent for " + invitation.getEmail());
        notifyAfterCommit(() -> notificationService.sendInvitation(
                invitation.getEmail(), rawToken, invitation.getExpiresAt()));

        InvitationResponse response = new InvitationResponse();
        response.setId(invitation.getId());
        response.setEmail(invitation.getEmail());
        response.setRole(invitation.getRole());
        response.setToken(rawToken);
        response.setExpiresAt(invitation.getExpiresAt());
        return response;
    }

    @Override
    @Transactional
    public User acceptInvitation(AcceptInvitationRequest request) {
        Invitation invitation = invitationRepository
                .findByTokenHashForUpdate(hashToken(request.getToken()))
                .orElseThrow(() -> invalidInvitation());

        LocalDateTime now = LocalDateTime.now();
        if (Boolean.TRUE.equals(invitation.getRevoked())
                || invitation.getUsedAt() != null
                || !invitation.getExpiresAt().isAfter(now)) {
            throw invalidInvitation();
        }

        if (userRepository.findByEmail(invitation.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A user with this email already exists");
        }

        User user = new User(
                null,
                invitation.getTenant(),
                request.getName(),
                invitation.getEmail(),
                passwordEncoder.encode(request.getPassword()),
                invitation.getRole(),
                now);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user.setAuthTokenVersion(0L);
        User savedUser = userRepository.save(user);

        invitation.setUsedAt(now);
        invitationRepository.save(invitation);

        auditService.log(
                invitation.getTenant(),
                AuditActionType.ACCEPT_INVITATION,
                AuditEntityType.USER,
                savedUser.getId(),
                "Invitation accepted");
        return savedUser;
    }

    @Override
    @Transactional
    public void revokeInvitation(Long invitationId) {
        Tenant tenant = lockCurrentTenant();
        Invitation invitation = invitationRepository
                .findByIdAndTenantIdForUpdate(invitationId, tenant.getId())
                .orElseThrow(() -> new AccessDeniedException(
                        "Invitation not found or does not belong to the current tenant."));

        if (Boolean.TRUE.equals(invitation.getRevoked()) || invitation.getUsedAt() != null) {
            return;
        }

        invitation.setRevoked(true);
        invitationRepository.save(invitation);
        auditService.log(
                tenant,
                AuditActionType.REVOKE_INVITATION,
                AuditEntityType.INVITATION,
                invitation.getId(),
                "Invitation revoked");
    }

    private Tenant lockCurrentTenant() {
        Tenant currentTenant = currentUserService.getCurrentTenant();
        if (currentTenant == null || currentTenant.getId() == null) {
            throw new AccessDeniedException("Current user is not associated with a tenant.");
        }
        return tenantRepository.findByIdForUpdate(currentTenant.getId())
                .orElseThrow(() -> new AccessDeniedException("Current tenant was not found."));
    }

    private void notifyAfterCommit(Runnable notification) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    try {
                        notification.run();
                    } catch (RuntimeException ex) {
                        log.error("Invitation notification delivery failed after commit", ex);
                    }
                }
            });
        } else {
            notification.run();
        }
    }

    private String generateToken() {
        byte[] tokenBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(tokenBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(tokenBytes);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Unable to hash invitation token", ex);
        }
    }

    private ResponseStatusException invalidInvitation() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired invitation");
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
