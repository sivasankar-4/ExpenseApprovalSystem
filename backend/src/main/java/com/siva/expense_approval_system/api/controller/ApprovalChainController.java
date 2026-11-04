package com.siva.expense_approval_system.api.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.siva.expense_approval_system.api.dto.request.CreateApprovalChainRequest;
import com.siva.expense_approval_system.api.dto.request.UpdateApprovalChainRequest;
import com.siva.expense_approval_system.api.dto.response.ApprovalChainResponse;
import com.siva.expense_approval_system.api.mapper.ApprovalChainMapper;
import com.siva.expense_approval_system.application.service.ApprovalChainService;
import com.siva.expense_approval_system.domain.model.ApprovalChain;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/approvalChains")
public class ApprovalChainController {

    private final ApprovalChainService approvalChainService;
    private final CurrentUserService currentUserService;
    private final ApprovalChainMapper approvalChainMapper;

    public ApprovalChainController(ApprovalChainService approvalChainService,
            CurrentUserService currentUserService,
            ApprovalChainMapper approvalChainMapper) {
        this.approvalChainService = approvalChainService;
        this.currentUserService = currentUserService;
        this.approvalChainMapper = approvalChainMapper;
    }

    @PostMapping
    @PreAuthorize("hasRole('FINANCE_ADMIN')")
    public ResponseEntity<ApprovalChainResponse> createApprovalChain(
            @Valid @RequestBody CreateApprovalChainRequest request) {
        Tenant tenant = currentUserService.getCurrentTenant();
        ApprovalChain savedChain = approvalChainService.createApprovalChain(approvalChainMapper.toEntity(request, tenant));
        return ResponseEntity.status(HttpStatus.CREATED).body(approvalChainMapper.toResponse(savedChain));
    }

    @GetMapping
    @PreAuthorize("hasRole('FINANCE_ADMIN')")
    public ResponseEntity<List<ApprovalChainResponse>> getAllApprovalChains() {
        List<ApprovalChainResponse> response = approvalChainService.getAllApprovalChains().stream()
                .map(approvalChainMapper::toResponse)
                .toList();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE_ADMIN')")
    public ResponseEntity<ApprovalChainResponse> getApprovalChainById(@PathVariable Long id) {
        return ResponseEntity.ok(approvalChainMapper.toResponse(approvalChainService.getApprovalChainById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE_ADMIN')")
    public ResponseEntity<ApprovalChainResponse> updateApprovalChain(@PathVariable Long id,
            @Valid @RequestBody UpdateApprovalChainRequest request) {
        Tenant tenant = currentUserService.getCurrentTenant();
        ApprovalChain updatedChain = approvalChainService.updateApprovalChain(id, approvalChainMapper.toEntity(request, tenant));
        return ResponseEntity.ok(approvalChainMapper.toResponse(updatedChain));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('FINANCE_ADMIN')")
    public ResponseEntity<Void> deleteApprovalChain(@PathVariable Long id) {
        approvalChainService.deleteApprovalChain(id);
        return ResponseEntity.noContent().build();
    }
}
