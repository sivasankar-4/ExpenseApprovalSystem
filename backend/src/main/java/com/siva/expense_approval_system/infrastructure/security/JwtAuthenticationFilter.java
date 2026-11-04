package com.siva.expense_approval_system.infrastructure.security;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import com.siva.expense_approval_system.domain.enums.AccountStatus;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    public JwtAuthenticationFilter(JwtService jwtService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String authorizationHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        String token = extractToken(authorizationHeader);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            String username = jwtService.extractUsername(token);
            Authentication existingAuth = SecurityContextHolder.getContext().getAuthentication();
            if (username != null && (existingAuth == null || existingAuth instanceof AnonymousAuthenticationToken)) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                if (userDetails instanceof CustomUserDetails customUserDetails
                        && customUserDetails.getuser().getAccountStatus() == AccountStatus.INACTIVE) {
                    SecurityContextHolder.clearContext();
                    log.warn("JWT rejected for inactive user {}", username);
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Account is inactive");
                    return;
                }
                if (jwtService.isTokenValid(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    log.info("JWT authenticated user {} with authorities {}", username, userDetails.getAuthorities());
                } else {
                    log.warn("JWT validation failed for user {}", username);
                }
            } else {
                log.warn("JWT authentication skipped because no username or auth context already present");
            }
        } catch (JwtException | IllegalArgumentException ex) {
            SecurityContextHolder.clearContext();
            log.warn("JWT authentication failed: {}", ex.getMessage());
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired access token");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(String authorizationHeader) {
        if (authorizationHeader == null || authorizationHeader.isBlank()) {
            return null;
        }

        String headerValue = authorizationHeader.trim();
        if (headerValue.regionMatches(true, 0, "Bearer", 0, 6)) {
            String token = headerValue.substring(6).trim();
            return token.isEmpty() ? null : token;
        }

        return null;
    }
}
