package com.siva.expense_approval_system.domain.repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.persistence.LockModeType;
import com.siva.expense_approval_system.domain.model.Expense;
import com.siva.expense_approval_system.domain.enums.ExpenseStatus;


public interface ExpenseRepository extends JpaRepository<Expense,Long> {

    Optional<Expense> findByIdAndTenantId(Long id, Long tenantId);

    List<Expense> findAllByTenantId(Long tenantId);

    List<Expense> findAllByTenantIdAndSubmittedById(Long tenantId, Long submittedById);

    List<Expense> findAllByTenantIdAndStatusIn(Long tenantId, Collection<ExpenseStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from Expense e where e.id = :id and e.tenant.id = :tenantId")
    Optional<Expense> findByIdAndTenantIdForUpdate(@Param("id") Long id, @Param("tenantId") Long tenantId);
}
