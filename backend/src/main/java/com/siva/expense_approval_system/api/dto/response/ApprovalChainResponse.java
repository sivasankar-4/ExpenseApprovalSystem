package com.siva.expense_approval_system.api.dto.response;

import java.math.BigDecimal;

import com.siva.expense_approval_system.domain.enums.Role;

public class ApprovalChainResponse {

    private Long id;
    private Long tenantId;
    private BigDecimal minAmount;
    private BigDecimal maxAmount;
    private Integer stepOrder;
    private Role approverRole;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getTenantId() { return tenantId; }
    public void setTenantId(Long tenantId) { this.tenantId = tenantId; }
    public BigDecimal getMinAmount() { return minAmount; }
    public void setMinAmount(BigDecimal minAmount) { this.minAmount = minAmount; }
    public BigDecimal getMaxAmount() { return maxAmount; }
    public void setMaxAmount(BigDecimal maxAmount) { this.maxAmount = maxAmount; }
    public Integer getStepOrder() { return stepOrder; }
    public void setStepOrder(Integer stepOrder) { this.stepOrder = stepOrder; }
    public Role getApproverRole() { return approverRole; }
    public void setApproverRole(Role approverRole) { this.approverRole = approverRole; }
}
