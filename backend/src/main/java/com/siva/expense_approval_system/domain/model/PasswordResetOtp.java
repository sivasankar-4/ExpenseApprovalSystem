package com.siva.expense_approval_system.domain.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;


@Entity
@Table(name = "password_reset_otps")
public class PasswordResetOtp {
    
      
     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;
     
     @ManyToOne
     @JoinColumn(name ="user_id",nullable = false)
     private User user;
     
     @Column(name = "otp_hash",nullable = false,length = 255)
     private String otpHash;
    
     @Column(name = "expires_at",nullable = false)
     private LocalDateTime expiresAt;
     
     @Column(nullable = false)
     private Integer attempts;
     
     @Column(nullable = false)
     private Boolean used;
     
     @Column(name ="created_at",nullable = false)
     private LocalDateTime createdAt;

     public PasswordResetOtp() {
        
     }

     public PasswordResetOtp(Long id, User user, String otpHash, LocalDateTime expiresAt, Integer attempts, Boolean used,
            LocalDateTime createdAt) {
        this.id = id;
        this.user = user;
        this.otpHash = otpHash;
        this.expiresAt = expiresAt;
        this.attempts = attempts;
        this.used = used;
        this.createdAt = createdAt;
     }

     public Long getId() {
         return id;
     }

     public void setId(Long id) {
         this.id = id;
     }

     public User getUser() {
         return user;
     }

     public void setUser(User user) {
         this.user = user;
     }

     public String getOtpHash() {
         return otpHash;
     }

     public void setOtpHash(String otpHash) {
         this.otpHash = otpHash;
     }

     public LocalDateTime getExpiresAt() {
         return expiresAt;
     }

     public void setExpiresAt(LocalDateTime expiresAt) {
         this.expiresAt = expiresAt;
     }

     public Integer getAttempts() {
         return attempts;
     }

     public void setAttempts(Integer attempts) {
         this.attempts = attempts;
     }

     public Boolean getUsed() {
         return used;
     }

     public void setUsed(Boolean used) {
         this.used = used;
     }

     public LocalDateTime getCreatedAt() {
         return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
         this.createdAt = createdAt;
     }

     
}
