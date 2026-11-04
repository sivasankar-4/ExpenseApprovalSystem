package com.siva.expense_approval_system.application.impl;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.siva.expense_approval_system.application.service.AuditService;
import com.siva.expense_approval_system.domain.enums.AuditActionType;
import com.siva.expense_approval_system.domain.enums.AuditEntityType;
import com.siva.expense_approval_system.domain.model.AuditLog;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.model.User;
import com.siva.expense_approval_system.domain.repository.AuditRepository;
import com.siva.expense_approval_system.infrastructure.security.CurrentUserService;

@Service
public class AuditServiceImpl implements AuditService{
    

    private final AuditRepository auditRepository;
    private final CurrentUserService currentUserService;

    public AuditServiceImpl(AuditRepository auditRepository,CurrentUserService currentUserService){
        this.auditRepository = auditRepository;
        this.currentUserService = currentUserService;
    }



    public void log(

        Tenant tenant,
        AuditActionType actionType,
        AuditEntityType entityType,
        Long entityId,
        String metadata){

             AuditLog audit = new AuditLog();
        User currentUser = currentUserService.getCurrentUser();

        audit.setTenant(tenant);
        audit.setActorId(currentUser != null ? currentUser.getId() : (entityType == AuditEntityType.USER ? entityId : null));
        audit.setActionType(actionType);
        audit.setEntityType(entityType);
        audit.setEntityId(entityId);
        audit.setMetaData(metadata);
        audit.setCreatedAt(LocalDateTime.now());

        auditRepository.save(audit);
        }
    
}
