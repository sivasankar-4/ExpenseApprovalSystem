package com.siva.expense_approval_system.application.service;

import com.siva.expense_approval_system.domain.enums.AuditActionType;
import com.siva.expense_approval_system.domain.enums.AuditEntityType;
import com.siva.expense_approval_system.domain.model.Tenant;

public interface AuditService {

        void log(

            Tenant tenant,
            AuditActionType actionType,
            AuditEntityType entityType,
            Long entityId,
            String metadata
        );
    
} 
