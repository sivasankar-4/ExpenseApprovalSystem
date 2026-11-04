package com.siva.expense_approval_system.application.service;

import java.util.List;

import com.siva.expense_approval_system.domain.model.ApprovalChain;

public interface ApprovalChainService {

    ApprovalChain createApprovalChain(ApprovalChain approvalChain);

    ApprovalChain getApprovalChainById(Long id);

    List<ApprovalChain>getAllApprovalChains();

    ApprovalChain updateApprovalChain(Long id, ApprovalChain approvalChain);

    void deleteApprovalChain(Long id);
}
