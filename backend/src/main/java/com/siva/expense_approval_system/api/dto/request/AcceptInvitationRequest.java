package com.siva.expense_approval_system.api.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AcceptInvitationRequest {

    @NotBlank(message = "token is required")
    private String token;

    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "password is required")
    @Size(min = 8, message = "Password must contain at least 8 characters")
    private String password;

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}
