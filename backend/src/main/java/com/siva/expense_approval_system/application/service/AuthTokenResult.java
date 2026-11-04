package com.siva.expense_approval_system.application.service;

public class AuthTokenResult {

    private final String accessToken;
    private final String refreshToken;
    private final String tokenType;

    public AuthTokenResult(String accessToken, String refreshToken, String tokenType) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public String getRefreshToken() {
        return refreshToken;
    }

    public String getTokenType() {
        return tokenType;
    }
}
