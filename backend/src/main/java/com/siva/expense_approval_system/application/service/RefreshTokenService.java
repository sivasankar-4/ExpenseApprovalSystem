package com.siva.expense_approval_system.application.service;

import java.util.Optional;

import com.siva.expense_approval_system.domain.model.RefreshToken;
import com.siva.expense_approval_system.domain.model.User;

public interface RefreshTokenService {

    String createRefreshToken(User user);

    RefreshToken verifyExpiration(RefreshToken token);

    Optional<RefreshToken> findByToken(String token);

    void revoke (RefreshToken refreshToken);

    void deleteByUser(User user);
}
