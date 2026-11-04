package com.siva.expense_approval_system.domain.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.Query;

import jakarta.persistence.LockModeType;

import com.siva.expense_approval_system.domain.model.User;
import com.siva.expense_approval_system.domain.enums.AccountStatus;
import com.siva.expense_approval_system.domain.enums.UserRole;

public interface UserRepository extends JpaRepository<User,Long>{

    Optional<User> findByIdAndTenantId(Long id, Long tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id and u.tenant.id = :tenantId")
    Optional<User> findByIdAndTenantIdForUpdate(@Param("id") Long id, @Param("tenantId") Long tenantId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

    List<User> findAllByTenantId(Long tenantId);

    Optional<User> findByEmail(String email);

    long countByTenantIdAndRoleAndAccountStatus(Long tenantId, UserRole role, AccountStatus accountStatus);
}
