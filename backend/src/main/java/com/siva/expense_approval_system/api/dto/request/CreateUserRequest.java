package com.siva.expense_approval_system.api.dto.request;

import com.siva.expense_approval_system.domain.enums.UserRole;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateUserRequest {

    @NotBlank(message =  "name is required")
    private String name;
    
    @NotBlank
    @Email(message = "email is required")
    private String email;
    
    @NotBlank(message = "password is required")
    @Size(min = 8, message = "Password must contain at least 8 Characters")
    private String password;
    
    @NotNull(message = "role is required")
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

    
}
