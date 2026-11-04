package com.siva.expense_approval_system.application.service;

import com.siva.expense_approval_system.api.dto.request.AcceptInvitationRequest;
import com.siva.expense_approval_system.api.dto.request.CreateInvitationRequest;
import com.siva.expense_approval_system.api.dto.response.InvitationResponse;
import com.siva.expense_approval_system.domain.model.User;

public interface InvitationService {

    InvitationResponse createInvitation(CreateInvitationRequest request);

    InvitationResponse resendInvitation(Long invitationId);

    User acceptInvitation(AcceptInvitationRequest request);

    void revokeInvitation(Long invitationId);
}
