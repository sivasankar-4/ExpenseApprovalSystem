package com.siva.expense_approval_system.api.mapper;

import org.springframework.stereotype.Component;

import com.siva.expense_approval_system.api.dto.request.CreateApprovalChainRequest;
import com.siva.expense_approval_system.api.dto.response.ApprovalChainResponse;
import com.siva.expense_approval_system.domain.model.ApprovalChain;
import com.siva.expense_approval_system.domain.model.Tenant;

@Component
public class ApprovalChainMapper {

    public ApprovalChain toEntity(CreateApprovalChainRequest request, Tenant tenant) {
        ApprovalChain approvalChain = new ApprovalChain();
        approvalChain.setTenant(tenant);
        approvalChain.setMinAmount(request.getMinAmount());
        approvalChain.setMaxAmount(request.getMaxAmount());
        approvalChain.setStepOrder(request.getStepOrder());
        approvalChain.setApproverRole(request.getApproverRole());
        return approvalChain;
    }

    public ApprovalChainResponse toResponse(ApprovalChain approvalChain) {
        ApprovalChainResponse response = new ApprovalChainResponse();
        response.setId(approvalChain.getId());
        response.setTenantId(approvalChain.getTenant().getId());
        response.setMinAmount(approvalChain.getMinAmount());
        response.setMaxAmount(approvalChain.getMaxAmount());
        response.setStepOrder(approvalChain.getStepOrder());
        response.setApproverRole(approvalChain.getApproverRole());
        return response;
    }
}
