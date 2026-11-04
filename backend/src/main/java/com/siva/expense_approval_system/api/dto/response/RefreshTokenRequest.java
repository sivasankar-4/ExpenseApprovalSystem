package com.siva.expense_approval_system.api.dto.response;

import jakarta.validation.constraints.NotBlank;


public class RefreshTokenRequest {
    
    @NotBlank(message = "Refresh token is required")
    private String refreshToken;
    
    

    public RefreshTokenRequest(@NotBlank String refreshToken) {
        this.refreshToken = refreshToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }

    
}
