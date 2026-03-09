package com.deliveryapp.backend.security;

import com.deliveryapp.backend.entity.ActiveToken;
import com.deliveryapp.backend.entity.Token;
import com.deliveryapp.backend.repository.ActiveTokenRepository;
import com.deliveryapp.backend.repository.TokenRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Optional;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private CustomUserDetailsService userDetailsService;

    @Autowired
    private ActiveTokenRepository activeTokenRepository;

    @Autowired
    private TokenRepository tokenRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractUsername(jwt);
            } catch (Exception e) {
                // Token invalid or expired
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

            if (jwtUtil.validateToken(jwt, userDetails.getUsername())) {
                // Inactivity check for Admin Web
                if (isAdminWebToken(jwt)) {
                    if (isTokenInactive(jwt)) {
                        chain.doFilter(request, response);
                        return;
                    }
                    updateLastUsed(jwt);
                }

                UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                usernamePasswordAuthenticationToken
                        .setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
            }
        }
        chain.doFilter(request, response);
    }

    private boolean isAdminWebToken(String token) {
        String clientType = jwtUtil.extractClientType(token);
        return "ADMIN_WEB".equalsIgnoreCase(clientType);
    }

    private boolean isTokenInactive(String jwt) {
        Optional<Token> tokenOpt = tokenRepository.findByAccessToken(jwt);
        if (tokenOpt.isPresent()) {
            Optional<ActiveToken> activeOpt = activeTokenRepository.findByTokenId(tokenOpt.get().getId());
            if (activeOpt.isPresent()) {
                ActiveToken activeToken = activeOpt.get();
                if (!Boolean.TRUE.equals(activeToken.getIsActive())) return true;
                
                LocalDateTime fiveMinsAgo = LocalDateTime.now().minusMinutes(5);
                if (activeToken.getLastUsedAt().isBefore(fiveMinsAgo)) {
                    // Invalidate
                    activeToken.setIsActive(false);
                    activeTokenRepository.save(activeToken);
                    return true;
                }
            }
        }
        return false;
    }

    private void updateLastUsed(String jwt) {
        tokenRepository.findByAccessToken(jwt).ifPresent(t -> {
            activeTokenRepository.findByTokenId(t.getId()).ifPresent(at -> {
                at.setLastUsedAt(LocalDateTime.now());
                activeTokenRepository.save(at);
            });
        });
    }
}
