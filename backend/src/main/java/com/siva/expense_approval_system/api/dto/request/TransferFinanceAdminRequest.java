package com.siva.expense_approval_system.api.dto.request;

import jakarta.validation.constraints.NotNull;

public class TransferFinanceAdminRequest {

    @NotNull(message = "targetUserId is required")
    private Long targetUserId;

    public Long getTargetUserId() {
        return targetUserId;
    }

    public void setTargetUserId(Long targetUserId) {
        this.targetUserId = targetUserId;
    }
}
