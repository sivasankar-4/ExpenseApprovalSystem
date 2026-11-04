package com.siva.expense_approval_system.application.service;

import java.time.LocalDateTime;

public interface InvitationNotificationService {

    void sendInvitation(String email, String rawToken, LocalDateTime expiresAt);

    void sendAccountDeactivated(String email);

    void sendAccountReactivated(String email);

    void sendRoleChanged(String email, String previousRole, String newRole);

    void sendFinanceAdminTransfer(String outgoingEmail, String incomingEmail);
}
