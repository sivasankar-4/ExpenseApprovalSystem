package com.siva.expense_approval_system.application.impl;

import org.springframework.security.core.Authentication;

import java.security.SecureRandom;
import java.time.LocalDateTime;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import com.siva.expense_approval_system.api.dto.request.LoginRequest;
import com.siva.expense_approval_system.api.dto.request.ResetPasswordRequest;
import com.siva.expense_approval_system.api.dto.request.SignUpRequest;
import com.siva.expense_approval_system.api.dto.request.VerifyOtpRequest;
import com.siva.expense_approval_system.api.dto.response.ResetTokenResponse;
import com.siva.expense_approval_system.application.service.AuditService;
import com.siva.expense_approval_system.application.service.AuthTokenResult;
import com.siva.expense_approval_system.application.service.AuthService;
import com.siva.expense_approval_system.application.service.RefreshTokenService;
import com.siva.expense_approval_system.domain.enums.AuditActionType;
import com.siva.expense_approval_system.domain.enums.AuditEntityType;
import com.siva.expense_approval_system.domain.enums.AccountStatus;
import com.siva.expense_approval_system.domain.enums.UserRole;
import com.siva.expense_approval_system.domain.model.PasswordResetOtp;
import com.siva.expense_approval_system.domain.model.RefreshToken;
import com.siva.expense_approval_system.domain.model.Tenant;
import com.siva.expense_approval_system.domain.model.User;
import com.siva.expense_approval_system.domain.repository.PasswordResetOtpRepository;
import com.siva.expense_approval_system.domain.repository.TenantRepository;
import com.siva.expense_approval_system.domain.repository.UserRepository;
import com.siva.expense_approval_system.infrastructure.security.JwtService;

import jakarta.transaction.Transactional;



@Service
public class AuthServiceImpl implements AuthService{
    
     
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;
    private final TenantRepository tenantRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    

     public AuthServiceImpl(AuthenticationManager authenticationManager, UserRepository userRepository,
            RefreshTokenService refreshTokenService, JwtService jwtService, PasswordEncoder passwordEncoder,AuditService auditService,
            TenantRepository tenantRepository,PasswordResetOtpRepository passwordResetOtpRepository) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.refreshTokenService = refreshTokenService;
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.auditService = auditService;
        this.tenantRepository = tenantRepository;
        this.passwordResetOtpRepository = passwordResetOtpRepository;
    }


     @Override
    public AuthTokenResult login(LoginRequest request){
        userRepository.findByEmail(request.getEmail()).ifPresent(user -> {
            if (!user.getPassword().startsWith("$2") && request.getPassword().equals(user.getPassword())) {
                user.setPassword(passwordEncoder.encode(request.getPassword()));
                userRepository.save(user);
            }
        });

        Authentication authentication = authenticationManager.authenticate(
                         new UsernamePasswordAuthenticationToken(
                            request.getEmail(), 
                            request.getPassword()
            )
        );

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new IllegalStateException("Authenticated user was not found"));

    String accessToken = jwtService.generateToken(user);

    String refreshToken =
            refreshTokenService.createRefreshToken(user);

    return new AuthTokenResult(
            accessToken,
            refreshToken,
            "Bearer"
    );
    }

@Override
@Transactional
public AuthTokenResult refreshToken(String rawRefreshToken) {

    RefreshToken refreshToken = refreshTokenService
            .findByToken(rawRefreshToken)
            .orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

    User user = userRepository.findByIdForUpdate(refreshToken.getUser().getId())
            .orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

    refreshToken = refreshTokenService
            .findByToken(rawRefreshToken)
            .filter(token -> token.getUser().getId().equals(user.getId()))
            .orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

    refreshToken = refreshTokenService.verifyExpiration(refreshToken);

    if (user.getAccountStatus() == AccountStatus.INACTIVE) {
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Account is inactive");
    }

    String accessToken = jwtService.generateToken(user);

    refreshTokenService.revoke(refreshToken);

    String newRefreshToken =
            refreshTokenService.createRefreshToken(user);

    auditService.log(
            user.getTenant(),
            AuditActionType.LOGIN,
            AuditEntityType.USER,
            user.getId(),
            "Refresh token rotated"
    );

    return new AuthTokenResult(accessToken,newRefreshToken,"Bearer");
}

@Override
@Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return;
        }

        refreshTokenService.findByToken(rawRefreshToken).ifPresent(refreshToken -> {
            if (!Boolean.TRUE.equals(refreshToken.getRevoked())
                    && !refreshToken.getExpiresAt().isBefore(LocalDateTime.now())) {
                refreshTokenService.revoke(refreshToken);

                User user = refreshToken.getUser();
                auditService.log(
                        user.getTenant(),
                        AuditActionType.LOGOUT,
                        AuditEntityType.USER,
                        user.getId(),
                        "User logout"
                );
            }
        });
}
     
     @Override
     @Transactional
     public void signUp(SignUpRequest request) {
            
        if(userRepository.findByEmail(request.getEmail()).isPresent()){
            throw new IllegalStateException("Email already exists");
        }

        Tenant tenant = new Tenant(null,request.getCompanyName(), LocalDateTime.now());

        tenant = tenantRepository.save(tenant);

        User user = new User(null,tenant,request.getName(),request.getEmail(),passwordEncoder.encode(request.getPassword()),UserRole.FINANCE_ADMIN,LocalDateTime.now()); 
        
        userRepository.save(user);
     }
       
      @Override
      @Transactional
      public void forgotPassword(String email) {
         
          userRepository.findByEmail(email).ifPresent(user -> {

              SecureRandom secureRandom = new SecureRandom();

              int otp = secureRandom.nextInt(1_000_000);

              String otpString = String.format("%06d",otp);

                String otpHash = passwordEncoder.encode(otpString);

                PasswordResetOtp passwordResetOtp = new PasswordResetOtp(
                                 
                                 null,
                                 user,
                                 otpHash,
                                 LocalDateTime.now().plusMinutes(2),
                                 0,
                                 false,
                                 LocalDateTime.now()
                );
                passwordResetOtpRepository.save(passwordResetOtp);

                System.out.println("Generated OTP for testing: " + otpString);

          });
      }
      
      @Override
      @Transactional
      public ResetTokenResponse verifyOtp(VerifyOtpRequest request){
         
           User user = userRepository.findByEmail(request.getEmail())
                      .orElseThrow(() -> 
                                    new IllegalArgumentException("Invalid OTP"));

           PasswordResetOtp resetOtp = passwordResetOtpRepository
                                 .findTopByUserOrderByCreatedAtDesc(user)
                                 .orElseThrow(() -> 
                                     new IllegalArgumentException("Invalid OTP"));

            if(resetOtp.getUsed()){
                throw new IllegalArgumentException("OTP has already been used");
            }

            if(resetOtp.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new IllegalArgumentException("OTP has expired");
            }

            if(resetOtp.getAttempts() >= 5) {

                throw new IllegalArgumentException("Maximum OTP attempts exceeded");
            }

            if(!passwordEncoder.matches(request.getOtp(), resetOtp.getOtpHash())) {
                resetOtp.setAttempts(resetOtp.getAttempts() + 1);
                passwordResetOtpRepository.save(resetOtp);
                throw new IllegalArgumentException("Invalid OTP");
            }

            resetOtp.setUsed(true);
            
            passwordResetOtpRepository.save(resetOtp);

            String resetToken = jwtService.generateResetToken(user);

            return new ResetTokenResponse(resetToken);
      }
      
       @Override
       @Transactional
       public void resetPassword(ResetPasswordRequest request) {

    if (!jwtService.isPasswordResetTokenValid(request.getResetToken())) {
        throw new IllegalArgumentException("Invalid or expired reset token");
    }

    String email = jwtService.extractUsername(request.getResetToken());

    User user = userRepository.findByEmail(email)
            .orElseThrow(() ->
                    new IllegalArgumentException("Invalid or expired reset token"));

    user.setPassword(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);

      refreshTokenService.deleteByUser(user);
    } 
       
}
