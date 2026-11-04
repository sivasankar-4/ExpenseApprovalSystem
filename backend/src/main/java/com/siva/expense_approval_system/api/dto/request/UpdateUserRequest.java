package com.siva.expense_approval_system.api.dto.request;

import com.siva.expense_approval_system.domain.enums.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UpdateUserRequest {
    
     @NotBlank(message = "name is required")
     private String name;
     
     @Email(message = "Invalid Email format")
     @NotBlank(message = "email is required")
     private String email;
     
     @NotNull(message ="role is required")
     private UserRole role;

     public String getName() {
         return name;
     }

     public void setName(String name) {
         this.name = name;
     }

     public String getEmail() {
         return email;
     }

     public void setEmail(String email) {
         this.email = email;
     }

     public UserRole getRole() {
         return role;
     }

     public void setRole(UserRole role) {
         this.role = role;
     }




}
