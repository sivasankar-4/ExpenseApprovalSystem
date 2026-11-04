package com.siva.expense_approval_system.domain.model;

import java.time.LocalDateTime;

import com.siva.expense_approval_system.domain.enums.AccountStatus;
import com.siva.expense_approval_system.domain.enums.UserRole;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@NoArgsConstructor
public class User {
    
     @Id
     @GeneratedValue(strategy = GenerationType.IDENTITY)
     private Long id;
    
     @ManyToOne
     @JoinColumn(name = "tenant_id")
     private Tenant tenant;
    
     @Column(nullable = false)
     private String name;
     
     @NotBlank
     @Column(nullable = false)
     private String email;
     
     @NotBlank
     @Column(nullable = false)
     private String password;
       
     @NotNull
     @Enumerated(EnumType.STRING)
     @Column(name = "role", nullable = false, length = 20, columnDefinition = "varchar(20)")
     private UserRole role;
      
     @Column(name = "created_at",nullable = false)
     private LocalDateTime createdAt;

      @Enumerated(EnumType.STRING)
      @Column(name = "account_status", nullable = false, length = 20)
      private AccountStatus accountStatus = AccountStatus.ACTIVE;

      @Column(name = "auth_token_version", nullable = false)
      private long authTokenVersion = 0L;
     


     public User(Long id, Tenant tenant, String name, @NotBlank String email, @NotBlank String password, UserRole role,
            LocalDateTime createdAt) {
        this.id = id;
        this.tenant = tenant;
        this.name = name;
        this.email = email;
        this.password = password;
        this.role = role;
        this.createdAt = createdAt;
     }

     public Long getId() {
         return id;
     }

     public void setId(Long id) {
         this.id = id;
     }

     public Tenant getTenant() {
         return tenant;
     }

     public void setTenant(Tenant tenant) {
         this.tenant = tenant;
     }

     public String getName() {
         return name;
     }

     public void setName(String Name) {
         this.name = Name;
     }

     public String getEmail() {
         return email;
     }

     public void setEmail(String email) {
         this.email = email;
     }

     public String getPassword() {
         return password;
     }

     public void setPassword(String password) {
         this.password = password;
     }

     public UserRole getRole() {
         return role;
     }

     public void setRole(UserRole role) {
         this.role = role;
     }

     public LocalDateTime getCreatedAt() {
         return createdAt;
     }

     public void setCreatedAt(LocalDateTime createdAt) {
         this.createdAt = createdAt;
     }

      public AccountStatus getAccountStatus() {
         return accountStatus;
      }

      public void setAccountStatus(AccountStatus accountStatus) {
         this.accountStatus = accountStatus;
      }

      public long getAuthTokenVersion() {
         return authTokenVersion;
      }

      public void setAuthTokenVersion(long authTokenVersion) {
         this.authTokenVersion = authTokenVersion;
      }

     
     

}
