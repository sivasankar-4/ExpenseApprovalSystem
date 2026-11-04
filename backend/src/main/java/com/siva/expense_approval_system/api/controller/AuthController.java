package com.siva.expense_approval_system.api.controller;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import jakarta.validation.Valid;

import com.siva.expense_approval_system.api.dto.request.ForgotPasswordRequest;
import com.siva.expense_approval_system.api.dto.request.AcceptInvitationRequest;
import com.siva.expense_approval_system.api.dto.request.LoginRequest;
import com.siva.expense_approval_system.api.dto.request.ResetPasswordRequest;
import com.siva.expense_approval_system.api.dto.request.SignUpRequest;
import com.siva.expense_approval_system.api.dto.request.VerifyOtpRequest;
import com.siva.expense_approval_system.api.dto.response.LoginResponse;
import com.siva.expense_approval_system.api.dto.response.ResetTokenResponse;
import com.siva.expense_approval_system.application.service.AuthTokenResult;
import com.siva.expense_approval_system.application.service.AuthService;
import com.siva.expense_approval_system.application.service.InvitationService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    private final AuthService authService;
    private final InvitationService invitationService;

    @Value("${security.refresh-cookie.secure:true}")
    private boolean refreshCookieSecure;

    @Value("${security.refresh-cookie.same-site:None}")
    private String refreshCookieSameSite;

    @Value("${security.refresh-cookie.path:/api/auth}")
    private String refreshCookiePath;

    @Value("${security.refresh-cookie.max-age:604800}")
    private long refreshCookieMaxAge;

    public AuthController(AuthService authService, InvitationService invitationService) {
        this.authService = authService;
        this.invitationService = invitationService;
    }
    
    @PostMapping("/login")
    @PreAuthorize("permitAll()")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request){
        AuthTokenResult tokenResult = authService.login(request);
        return withRefreshCookie(tokenResult);
    }

       
    @PostMapping("/refresh")
    @PreAuthorize("permitAll()")
    public ResponseEntity<LoginResponse> refreshToken(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {

        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Refresh token is missing");
        }

        return withRefreshCookie(authService.refreshToken(refreshToken));
}

    @PostMapping("/invitations/accept")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Void> acceptInvitation(
            @Valid @RequestBody AcceptInvitationRequest request) {
        invitationService.acceptInvitation(request);
        return ResponseEntity.noContent().build();
    }

    private ResponseEntity<LoginResponse> withRefreshCookie(AuthTokenResult tokenResult) {
        ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", tokenResult.getRefreshToken())
                .httpOnly(true)
                .secure(refreshCookieSecure)
                .sameSite(refreshCookieSameSite)
                .path(refreshCookiePath)
                .maxAge(Duration.ofSeconds(refreshCookieMaxAge))
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .body(toLoginResponse(tokenResult));
    }

    private LoginResponse toLoginResponse(AuthTokenResult tokenResult) {
        return new LoginResponse(tokenResult.getAccessToken(), tokenResult.getTokenType());
    }

        @PostMapping("/logout")
        @PreAuthorize("permitAll()")
        public ResponseEntity<Void> logout(
            @CookieValue(name = "refreshToken", required = false) String refreshToken) {
        authService.logout(refreshToken);

        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, expiredRefreshCookie().toString())
            .build();
        }

        private ResponseCookie expiredRefreshCookie() {
        return ResponseCookie.from("refreshToken", "")
            .httpOnly(true)
            .secure(refreshCookieSecure)
            .sameSite(refreshCookieSameSite)
            .path(refreshCookiePath)
            .maxAge(Duration.ZERO)
            .build();
        }
   
   @PostMapping("/signup")
   @PreAuthorize("permitAll()")
   public ResponseEntity<Void> signUp(@Valid @RequestBody SignUpRequest request) {
    authService.signUp(request);
    return ResponseEntity.status(201).build();
   }
   
   @PostMapping("/forgot-password")
   @PreAuthorize("permitAll()")
   public ResponseEntity<String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
       authService.forgotPassword(request.getEmail());
         return ResponseEntity.ok("If the account exists,an OTP has been sent.");
   }

       @PostMapping("/verify-otp")
       @PreAuthorize("permitAll()")
       public ResponseEntity<ResetTokenResponse> verifyOtp(
                       @Valid @RequestBody VerifyOtpRequest request) {

        return ResponseEntity.ok(
            authService.verifyOtp(request)
       );
    }

            @PostMapping("/reset-password")
            @PreAuthorize("permitAll()")
          public ResponseEntity<Void> resetPassword(
                              @Valid @RequestBody ResetPasswordRequest request) {

                authService.resetPassword(request);

                return ResponseEntity.ok().build();
    }
}
