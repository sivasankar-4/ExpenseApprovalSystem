package com.siva.expense_approval_system.infrastructure.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import com.siva.expense_approval_system.domain.model.User;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final String AUTH_TOKEN_VERSION_CLAIM = "authTokenVersion";

    @Value("${security.jwt.secret}")
    private String secretKey;

    @Value("${security.jwt.expiration}")
    private long jwtExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user){
         
        return Jwts.builder() 
                    .subject(user.getEmail())
                    .claim("role", user.getRole().name())
                    .claim(AUTH_TOKEN_VERSION_CLAIM, user.getAuthTokenVersion())
                    .issuedAt(new Date())
                    .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                    .signWith(getSigningKey())
                    .compact();
    }
    
    public String extractUsername(String token){

        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {

        Claims claims = extractAllClaims(token);

        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token){

        return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
    }

    public boolean isTokenValid(String token , UserDetails userDetails) {
         
        String username = extractUsername(token);
        if (!username.equals(userDetails.getUsername()) || isTokenExpired(token)) {
            return false;
        }

        if (!(userDetails instanceof CustomUserDetails customUserDetails)) {
            return false;
        }

        Number tokenVersion = extractClaim(
                token,
                claims -> claims.get(AUTH_TOKEN_VERSION_CLAIM, Number.class));

        return tokenVersion != null
                && tokenVersion.longValue() == customUserDetails.getuser().getAuthTokenVersion();
    }

    private boolean isTokenExpired(String token){

        return extractExpiration(token)
                  .before(new Date());
    }

    private Date extractExpiration(String token) {

        return extractClaim(token , Claims::getExpiration);
    }
    
    @Value("${security.jwt.reset-expiration}")
    private long resetTokenExpiration;
    
    public String generateResetToken(User user) {
        return Jwts.builder()
                .subject(user.getEmail())
                .claim("purpose","PASSWORD_RESET")
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + resetTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    public boolean isPasswordResetTokenValid(String token){

         try{

             Claims claims = extractAllClaims(token);

             String purpose = claims.get("purpose" , String.class);

             return "PASSWORD_RESET".equals(purpose)
                             && !claims.getExpiration().before(new Date());
         }catch (Exception e){
            return false;
         }
    }
}
