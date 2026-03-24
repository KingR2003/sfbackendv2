package com.deliveryapp.backend.service.impl;

import com.deliveryapp.backend.entity.ActiveToken;
import com.deliveryapp.backend.entity.Token;
import com.deliveryapp.backend.entity.User;
import com.deliveryapp.backend.repository.ActiveTokenRepository;
import com.deliveryapp.backend.repository.TokenRepository;
import com.deliveryapp.backend.service.TokenService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class TokenServiceImpl implements TokenService {

    @Autowired
    private TokenRepository tokenRepository;

    @Autowired
    private ActiveTokenRepository activeTokenRepository;

    @Override
    @Transactional
    public void persistToken(User user, String token, String clientType, HttpServletRequest request) {
        Token tokenEntity = new Token();
        tokenEntity.setUserId(user.getId());
        tokenEntity.setAccessToken(token);
        tokenEntity.setIpAddress(getClientIpAddress(request));
        tokenEntity.setIssuedAt(LocalDateTime.now());
        
        // Use client-specific expiration for DB persistence
        long expMs = resolveExpiration(clientType);
        tokenEntity.setExpiresAt(LocalDateTime.now().plusNanos(expMs * 1_000_000));
        tokenEntity.setCreatedAt(LocalDateTime.now());
        Token savedToken = tokenRepository.save(tokenEntity);

        ActiveToken activeToken = new ActiveToken();
        activeToken.setUserId(user.getId());
        activeToken.setTokenId(savedToken.getId());
        activeToken.setIsActive(true);
        activeToken.setLastUsedAt(LocalDateTime.now());
        activeToken.setCreatedAt(LocalDateTime.now());
        activeTokenRepository.save(activeToken);
    }

    @Override
    @Transactional
    public void invalidateToken(String token) {
        if (token != null && token.startsWith("Bearer ")) {
            token = token.substring(7);
        }

        Optional<Token> tokenOpt = tokenRepository.findByAccessToken(token);
        if (tokenOpt.isPresent()) {
            Token t = tokenOpt.get();
            // Soft-logout: stamp loggedOutAt so the row (and IP) are preserved
            t.setLoggedOutAt(LocalDateTime.now());
            tokenRepository.save(t);
            // Mark the active_token as inactive (do NOT delete)
            activeTokenRepository.findByTokenId(t.getId()).ifPresent(at -> {
                at.setIsActive(false);
                activeTokenRepository.save(at);
            });
        }
    }

    private long resolveExpiration(String clientType) {
        if ("WEBSITE".equalsIgnoreCase(clientType) || "ADMIN_WEB".equalsIgnoreCase(clientType)) {
            return 12L * 60 * 60 * 1000; // 12 hours
        }
        return 5L * 24 * 60 * 60 * 1000; // 5 days for Mobile
    }

    private String getClientIpAddress(HttpServletRequest request) {
        if (request == null) return "Unknown";
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
