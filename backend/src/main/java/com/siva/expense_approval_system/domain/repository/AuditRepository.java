package com.siva.expense_approval_system.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siva.expense_approval_system.domain.model.AuditLog;

public interface AuditRepository extends JpaRepository<AuditLog,Long>{

    Optional<AuditLog> findByIdAndTenantId(Long id, Long tenantId);

    List<AuditLog> findAllByTenantId(Long tenantId);
}
