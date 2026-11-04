package com.siva.expense_approval_system.domain.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.siva.expense_approval_system.domain.model.PasswordResetOtp;
import com.siva.expense_approval_system.domain.model.User;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long>{
    
         Optional<PasswordResetOtp> findTopByUserOrderByCreatedAtDesc(User user);
}