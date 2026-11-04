package com.siva.expense_approval_system.domain.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.siva.expense_approval_system.domain.model.Tenant;

import jakarta.persistence.LockModeType;

public interface TenantRepository extends JpaRepository<Tenant,Long>{

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Tenant t where t.id = :id")
    java.util.Optional<Tenant> findByIdForUpdate(@Param("id") Long id);
}
