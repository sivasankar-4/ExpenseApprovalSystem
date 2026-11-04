package com.siva.expense_approval_system.api.dto.request;

import java.math.BigDecimal;

import com.siva.expense_approval_system.domain.enums.Role;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public class CreateApprovalChainRequest {

    @NotNull(message = "minimum amount is required")
    @PositiveOrZero(message = "minimum amount must be zero or greater")
    private BigDecimal minAmount;

    @NotNull(message = "maximum amount is required")
    @PositiveOrZero(message = "maximum amount must be zero or greater")
    private BigDecimal maxAmount;

    @NotNull(message = "step order is required")
    @PositiveOrZero(message = "step order must be zero or greater")
    private Integer stepOrder;

    @NotNull(message = "approver role is required")
    private Role approverRole;

    public BigDecimal getMinAmount() { return minAmount; }
    public void setMinAmount(BigDecimal minAmount) { this.minAmount = minAmount; }
    public BigDecimal getMaxAmount() { return maxAmount; }
    public void setMaxAmount(BigDecimal maxAmount) { this.maxAmount = maxAmount; }
    public Integer getStepOrder() { return stepOrder; }
    public void setStepOrder(Integer stepOrder) { this.stepOrder = stepOrder; }
    public Role getApproverRole() { return approverRole; }
    public void setApproverRole(Role approverRole) { this.approverRole = approverRole; }
}
