package com.siva.expense_approval_system.application.impl;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

import java.time.LocalDateTime;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.siva.expense_approval_system.api.dto.request.AcceptInvitationRequest;
import com.siva.expense_approval_system.api.dto.request.CreateInvitationRequest;
import com.siva.expense_approval_system.application.service.AuditService;
import com.siva.expense_approval_system.application.service.InvitationNotificationService;
import com.siva.expense_approval_system.domain.enums.UserRole;
import com.siva.expense_approval_system.domain.model.Invitation;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.repository.InvitationRepository;
import com.siva.expense_approval_system.domain.repository.TenantRepository;
import com.siva.expense_approval_system.domain.repository.UserRepository;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class InvitationServiceImplTest {

    @Mock
    private InvitationRepository invitationRepository;
    @Mock
    private TenantRepository tenantRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private CurrentUserService currentUserService;
    @Mock
    private AuditService auditService;
    @Mock
    private InvitationNotificationService notificationService;

    private InvitationServiceImpl service;
    private Tenant tenant;

    @BeforeEach
    void setUp() {
        service = new InvitationServiceImpl(
                invitationRepository,
                tenantRepository,
                userRepository,
                passwordEncoder,
                currentUserService,
                auditService,
                notificationService);
        ReflectionTestUtils.setField(service, "invitationExpirationHours", 72L);

        tenant = new Tenant(10L, "Tenant", LocalDateTime.now());
    }

    @Test
    void createsTenantScopedInvitationAndReturnsRawTokenOnly() {
        when(currentUserService.getCurrentTenant()).thenReturn(tenant);
        when(tenantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(tenant));

        CreateInvitationRequest request = new CreateInvitationRequest();
        request.setEmail("Invitee@Example.com");
        request.setRole(UserRole.EMPLOYEE);
        when(userRepository.findByEmail("invitee@example.com")).thenReturn(Optional.empty());
        when(invitationRepository.findActiveByTenantAndEmailForUpdate(10L, "invitee@example.com"))
                .thenReturn(Optional.empty());
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(invocation -> {
            Invitation invitation = invocation.getArgument(0);
            invitation.setId(20L);
            return invitation;
        });

        var response = service.createInvitation(request);

        assertTrue(response.getToken().length() >= 40);
        assertNotEquals(response.getToken(), response.getEmail());
        verify(invitationRepository).save(any(Invitation.class));
        verify(notificationService).sendInvitation(
                "invitee@example.com", response.getToken(), response.getExpiresAt());
        verify(auditService).log(
                tenant,
                com.siva.expense_approval_system.domain.enums.AuditActionType.INVITE,
                com.siva.expense_approval_system.domain.enums.AuditEntityType.INVITATION,
                20L,
                "Invitation created for invitee@example.com");
    }

    @Test
    void acceptsInvitationOnceAndMarksItUsed() {
        Invitation invitation = invitation();
        when(invitationRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(invitation));
        when(userRepository.findByEmail("invitee@example.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("password123")).thenReturn("encoded");
        when(userRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(invitationRepository.save(any(Invitation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AcceptInvitationRequest request = new AcceptInvitationRequest();
        request.setToken("raw-token");
        request.setName("Invitee");
        request.setPassword("password123");

        var user = service.acceptInvitation(request);

        assertTrue(invitation.getUsedAt() != null);
        assertTrue(user.getPassword().equals("encoded"));
        assertTrue(user.getTenant() == tenant);
        verify(invitationRepository).save(invitation);
        verify(auditService).log(
                tenant,
                com.siva.expense_approval_system.domain.enums.AuditActionType.ACCEPT_INVITATION,
                com.siva.expense_approval_system.domain.enums.AuditEntityType.USER,
                user.getId(),
                "Invitation accepted");
    }

    @Test
    void rejectsAlreadyUsedInvitation() {
        Invitation invitation = invitation();
        invitation.setUsedAt(LocalDateTime.now().minusMinutes(1));
        when(invitationRepository.findByTokenHashForUpdate(anyString()))
                .thenReturn(Optional.of(invitation));

        AcceptInvitationRequest request = new AcceptInvitationRequest();
        request.setToken("raw-token");
        request.setName("Invitee");
        request.setPassword("password123");

        assertThrows(ResponseStatusException.class, () -> service.acceptInvitation(request));
        verify(userRepository, never()).save(any());
    }

    @Test
    void revokesInvitationAndWritesOneAuditEvent() {
        Invitation invitation = invitation();
        when(currentUserService.getCurrentTenant()).thenReturn(tenant);
        when(tenantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(tenant));
        when(invitationRepository.findByIdAndTenantIdForUpdate(20L, 10L))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(invitation)).thenReturn(invitation);

        service.revokeInvitation(20L);

        assertTrue(invitation.getRevoked());
        verify(auditService).log(
                tenant,
                com.siva.expense_approval_system.domain.enums.AuditActionType.REVOKE_INVITATION,
                com.siva.expense_approval_system.domain.enums.AuditEntityType.INVITATION,
                20L,
                "Invitation revoked");
    }

    @Test
    void doesNotDuplicateAuditForAlreadyRevokedInvitation() {
        Invitation invitation = invitation();
        invitation.setRevoked(true);
        when(currentUserService.getCurrentTenant()).thenReturn(tenant);
        when(tenantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(tenant));
        when(invitationRepository.findByIdAndTenantIdForUpdate(20L, 10L))
                .thenReturn(Optional.of(invitation));

        service.revokeInvitation(20L);

        verify(auditService, times(0)).log(
                any(), any(), any(), any(), anyString());
    }

    @Test
    void resendRotatesTokenAndInvalidatesPreviousHash() {
        Invitation invitation = invitation();
        invitation.setTokenHash("old-hash");
        when(currentUserService.getCurrentTenant()).thenReturn(tenant);
        when(tenantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(tenant));
        when(invitationRepository.findByIdAndTenantIdForUpdate(20L, 10L))
                .thenReturn(Optional.of(invitation));
        when(invitationRepository.save(invitation)).thenReturn(invitation);

        var response = service.resendInvitation(20L);

        assertNotEquals("old-hash", invitation.getTokenHash());
        assertTrue(response.getToken().length() >= 40);
        assertNotEquals(response.getToken(), invitation.getTokenHash());
        verify(notificationService).sendInvitation(
                "invitee@example.com", response.getToken(), response.getExpiresAt());
    }

    @Test
    void doesNotResendAcceptedInvitation() {
        Invitation invitation = invitation();
        invitation.setUsedAt(LocalDateTime.now().minusMinutes(1));
        when(currentUserService.getCurrentTenant()).thenReturn(tenant);
        when(tenantRepository.findByIdForUpdate(10L)).thenReturn(Optional.of(tenant));
        when(invitationRepository.findByIdAndTenantIdForUpdate(20L, 10L))
                .thenReturn(Optional.of(invitation));

        assertThrows(ResponseStatusException.class, () -> service.resendInvitation(20L));
        verify(notificationService, never()).sendInvitation(anyString(), anyString(), any());
    }

    private Invitation invitation() {
        Invitation invitation = new Invitation();
        invitation.setId(20L);
        invitation.setTenant(tenant);
        invitation.setEmail("invitee@example.com");
        invitation.setRole(UserRole.EMPLOYEE);
        invitation.setExpiresAt(LocalDateTime.now().plusHours(1));
        invitation.setRevoked(false);
        invitation.setCreatedAt(LocalDateTime.now());
        return invitation;
    }
}
